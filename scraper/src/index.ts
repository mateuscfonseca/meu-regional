/**
 * Scraper Service - Serviço standalone para web scraping
 *
 * Este serviço roda em um container separado e expõe uma API HTTP
 * para realizar web scraping de forma isolada da aplicação principal.
 *
 * Funciona sem login - usa páginas públicas do Spotify
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { SpotifyScraperService } from './services/SpotifyScraperService';
import type { ScrapedMetadata } from './services/ISpotifyScraperService';

const app = new Hono();

// CORS para permitir acesso do backend
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'scraper',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Logger Utility
// ============================================
const log = {
  info: (msg: string, data?: any) => console.log(`[Scraper][INFO] ${new Date().toISOString()} - ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[Scraper][WARN] ${new Date().toISOString()} - ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[Scraper][ERROR] ${new Date().toISOString()} - ${msg}`, data || ''),
  debug: (msg: string, data?: any) => console.log(`[Scraper][DEBUG] ${new Date().toISOString()} - ${msg}`, data || ''),
};

const searchSchema = z.object({
  query: z.string().min(1),
});

const urlSchema = z.object({
  url: z.string().url(),
});

const suggestionsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(20).optional().default(5),
});

// Service instance (singleton)
let scraperService: SpotifyScraperService | null = null;

/**
 * Obtém ou cria a instância do service
 */
function getScraperService(): SpotifyScraperService {
  if (!scraperService) {
    scraperService = new SpotifyScraperService({
      headless: process.env.HEADLESS !== 'false',
    });
  }
  return scraperService;
}

// Rotas da API

// Middleware de log para todas as rotas
app.use('/*', async (c, next) => {
  const startTime = Date.now();
  log.info('[HTTP] Request:', {
    method: c.req.method,
    path: c.req.path,
  });

  await next();

  log.info('[HTTP] Response:', {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    time: Date.now() - startTime + 'ms',
  });
});

/**
 * Spotify Search
 */
app.post('/spotify/search', async (c) => {
  try {
    const body = await c.req.json();
    const validated = searchSchema.parse(body);

    log.info('[API] Search request:', { query: validated.query });
    
    const service = getScraperService();
    const results = await service.search(validated.query);

    log.info('[API] Search response:', { total: results.length });
    return c.json({
      query: validated.query,
      results,
      total: results.length,
    });
  } catch (error: any) {
    log.info('[API] Search error:', error.message);
    return c.json({ error: error.message || 'Erro ao buscar no Spotify' }, 500);
  }
});

/**
 * Spotify Search First (apenas primeiro resultado)
 */
app.post('/spotify/search-first', async (c) => {
  try {
    const body = await c.req.json();
    const validated = searchSchema.parse(body);

    log.info('[API] Search-first request:', { query: validated.query });
    
    const service = getScraperService();
    const results = await service.search(validated.query);

    log.info('[API] Search-first response:', { found: !!results[0] });
    return c.json({
      query: validated.query,
      result: results[0] || null,
    });
  } catch (error: any) {
    log.info('[API] Search-first error:', error.message);
    return c.json({ error: error.message || 'Erro ao buscar no Spotify' }, 500);
  }
});

/**
 * Spotify Suggestions (autocomplete para busca parcial)
 */
app.post('/spotify/suggestions', async (c) => {
  try {
    const body = await c.req.json();
    const validated = suggestionsSchema.parse(body);

    log.info('[API] Suggestions request:', { query: validated.query, limit: validated.limit });
    
    const service = getScraperService();
    const suggestions = await service.searchSuggestions(validated.query, validated.limit);

    log.info('[API] Suggestions response:', { total: suggestions.length });
    return c.json({
      query: validated.query,
      suggestions,
      total: suggestions.length,
    });
  } catch (error: any) {
    log.info('[API] Suggestions error:', error.message);
    return c.json({ error: error.message || 'Erro ao buscar sugestões no Spotify' }, 500);
  }
});

/**
 * Spotify Get Metadata by URL
 */
app.post('/spotify/metadata', async (c) => {
  try {
    const body = await c.req.json();
    const validated = urlSchema.parse(body);

    log.info('[API] Metadata request:', { url: validated.url });
    
    const service = getScraperService();
    const metadata = await service.getMetadataByUrl(validated.url);

    if (!metadata) {
      log.info('[API] Metadata response: not found');
      return c.json({ error: 'Não foi possível extrair metadados da URL' }, 404);
    }

    log.info('[API] Metadata response:', { nome: metadata.nome });
    return c.json({
      url: validated.url,
      metadata,
    });
  } catch (error: any) {
    log.info('[API] Metadata error:', error.message);
    return c.json({ error: error.message || 'Erro ao extrair metadata do Spotify' }, 500);
  }
});

/**
 * Health Check do Browser
 */
app.get('/browser/health', (c) => {
  return c.json({
    browser: scraperService ? 'running' : 'stopped',
    context: scraperService ? 'active' : 'inactive',
  });
});

/**
 * Close Browser (para manutenção)
 */
app.post('/browser/close', async (c) => {
  log.info('[API] Browser close request');
  
  if (scraperService) {
    await scraperService.close();
    scraperService = null;
  }
  
  log.info('[API] Browser fechado com sucesso');
  return c.json({ success: true, message: 'Browser fechado' });
});

// Cleanup on shutdown
process.on('SIGINT', async () => {
  log.info('[PROCESS] SIGINT recebido, shutting down...');
  if (scraperService) {
    await scraperService.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.info('[PROCESS] SIGTERM recebido, shutting down...');
  if (scraperService) {
    await scraperService.close();
  }
  process.exit(0);
});

export default {
  port: process.env.PORT || 4000,
  fetch: app.fetch,
};
