import { Hono } from 'hono';
import { spotifyScraperService } from '../services/spotify-scraper.service';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1),
});

const urlSchema = z.object({
  url: z.string().url(),
});

const testSearchSchema = z.object({
  query: z.string().min(1),
});

const suggestionsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(20).optional().default(5),
});

export const scraperRoutes = new Hono();

/**
 * Health check do scraper
 */
scraperRoutes.get('/health', async (c) => {
  const health = await spotifyScraperService.health();

  return c.json({
    status: 'ok',
    scraper: {
      serviceRunning: health.scraper,
      browserRunning: health.browser,
    },
  });
});

/**
 * Testar busca no Spotify (sem autenticação)
 */
scraperRoutes.post('/spotify/test-search', async (c) => {
  try {
    const body = await c.req.json();
    const validated = testSearchSchema.parse(body);

    const results = await spotifyScraperService.search(validated.query);

    return c.json({
      success: true,
      results,
      total: results.length,
    });
  } catch (error: any) {
    console.error('[ScraperRoutes] Erro no teste de busca:', error);
    return c.json({ error: error.message || 'Falha na busca' }, 500);
  }
});

/**
 * Buscar músicas no Spotify por query
 */
scraperRoutes.post('/spotify/search', async (c) => {
  try {
    const body = await c.req.json();
    const validated = searchSchema.parse(body);

    const results = await spotifyScraperService.search(validated.query);

    return c.json({
      query: validated.query,
      results,
      total: results.length,
    });
  } catch (error: any) {
    console.error('[ScraperRoutes] Erro na busca:', error);
    return c.json({ error: error.message || 'Erro ao buscar no Spotify' }, 500);
  }
});

/**
 * Buscar apenas o primeiro resultado (para autocomplete)
 */
scraperRoutes.post('/spotify/search-first', async (c) => {
  try {
    const body = await c.req.json();
    const validated = searchSchema.parse(body);

    const result = await spotifyScraperService.searchFirst(validated.query);

    return c.json({
      query: validated.query,
      result,
    });
  } catch (error: any) {
    console.error('[ScraperRoutes] Erro na busca:', error);
    return c.json({ error: error.message || 'Erro ao buscar no Spotify' }, 500);
  }
});

/**
 * Buscar sugestões de músicas (autocomplete)
 */
scraperRoutes.post('/spotify/suggestions', async (c) => {
  try {
    const body = await c.req.json();
    const validated = suggestionsSchema.parse(body);

    const suggestions = await spotifyScraperService.searchSuggestions(validated.query, validated.limit);

    return c.json({
      query: validated.query,
      suggestions,
      total: suggestions.length,
    });
  } catch (error: any) {
    console.error('[ScraperRoutes] Erro na busca de sugestões:', error);
    return c.json({ error: error.message || 'Erro ao buscar sugestões no Spotify' }, 500);
  }
});

/**
 * Extrair metadados de URL do Spotify
 */
scraperRoutes.post('/spotify/metadata', async (c) => {
  try {
    const body = await c.req.json();
    const validated = urlSchema.parse(body);

    const metadata = await spotifyScraperService.getMetadataByUrl(validated.url);

    return c.json({
      url: validated.url,
      metadata,
    });
  } catch (error: any) {
    console.error('[ScraperRoutes] Erro ao extrair metadata:', error);
    return c.json({ error: error.message || 'Erro ao extrair metadata do Spotify' }, 500);
  }
});
