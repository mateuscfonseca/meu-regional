/**
 * Implementação do serviço de scraping do Spotify
 * 
 * Funciona sem login - usa páginas públicas do Spotify
 */

import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import type {
  ISpotifyScraperService,
  ScrapedMetadata,
  SpotifyScraperConfig,
  Suggestion,
} from './ISpotifyScraperService';

// Logger
const log = {
  info: (msg: string, data?: any) => console.log(`[SpotifyScraper][INFO] ${new Date().toISOString()} - ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[SpotifyScraper][WARN] ${new Date().toISOString()} - ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[SpotifyScraper][ERROR] ${new Date().toISOString()} - ${msg}`, data || ''),
  debug: (msg: string, data?: any) => console.log(`[SpotifyScraper][DEBUG] ${new Date().toISOString()} - ${msg}`, data || ''),
};

export class SpotifyScraperService implements ISpotifyScraperService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: SpotifyScraperConfig;

  constructor(config: SpotifyScraperConfig = {}) {
    this.config = {
      headless: config.headless ?? process.env.HEADLESS !== 'false',
    };
  }

  /**
   * Inicializa o browser
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      log.info('[BROWSER] Inicializando browser...', { headless: this.config.headless });

      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      log.info('[BROWSER] Browser inicializado com sucesso');
    }
  }

  /**
   * Cria uma nova página
   */
  private async newPage(): Promise<Page> {
    if (!this.context) {
      await this.initialize();
    }
    return this.context!.newPage();
  }

  /**
   * Busca músicas no Spotify (sem login necessário)
   */
  async search(query: string): Promise<ScrapedMetadata[]> {
    const startTime = Date.now();
    log.info('[SEARCH] Iniciando busca:', { query });

    try {
      const page = await this.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });

      // Navegar para página de busca pública
      const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}/tracks`;
      log.info('[SEARCH] Navegando para:', searchUrl);

      await page.goto(searchUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      log.info('[SEARCH] Página carregada em', Date.now() - startTime, 'ms');

      // Aguardar resultados carregarem
      log.info('[SEARCH] Aguardando track-list...');
      try {
        await page.waitForSelector('[data-testid="track-list"]', {
          timeout: 10000,
        });
        log.info('[SEARCH] Track-list encontrado');
      } catch {
        log.info('[SEARCH] Warn: Track-list não encontrado, tentando continuar...');
      }

      // Extrair resultados
      log.info('[SEARCH] Extraindo resultados...');
      
      // Debug: capturar estrutura do HTML
      const htmlStructure = await page.evaluate(() => {
        const trackList = document.querySelector('[data-testid="track-list"]');
        if (!trackList) return { found: false };
        
        const rows = trackList.querySelectorAll('[role="row"]');
        const rowsByClass = trackList.querySelectorAll('div[class*="row"]');
        const allDivs = trackList.querySelectorAll('div');
        
        return {
          found: true,
          rowCount: rows.length,
          rowsByClassCount: rowsByClass.length,
          totalDivs: allDivs.length,
          firstRowHtml: rows[0]?.outerHTML.substring(0, 500) || 'N/A',
        };
      });
      
      log.info('[SEARCH] Estrutura HTML:', htmlStructure);
      
      const results = await page.evaluate(() => {
        const trackList = document.querySelector('[data-testid="track-list"]');
        if (!trackList) return [];
        
        // Tentar múltiplos seletores
        let tracks: NodeListOf<Element>;
        
        // Seletor 1: [role="row"]
        tracks = trackList.querySelectorAll('[role="row"]');
        if (tracks.length === 0) {
          // Seletor 2: divs com classe contendo "row"
          tracks = trackList.querySelectorAll('div[role="row"]');
        }
        if (tracks.length === 0) {
          // Seletor 3: elementos li
          tracks = trackList.querySelectorAll('li');
        }
        if (tracks.length === 0) {
          // Seletor 4: qualquer div direta
          tracks = trackList.querySelectorAll(':scope > div');
        }
        
        const metadata: any[] = [];

        tracks.forEach((track, index) => {
          if (index >= 10) return;

          // Tentar múltiplos seletores para título
          let title = '';
          const titleSelectors = [
            '[data-testid="track-title"]',
            '[data-testid="track-name"]',
            'a[href*="/track/"]',
            '.encore-text',
          ];
          
          for (const selector of titleSelectors) {
            const el = track.querySelector(selector);
            if (el) {
              title = el.getAttribute('title') || el.textContent || '';
              break;
            }
          }

          // Tentar múltiplos seletores para artista
          let artist = '';
          const artistSelectors = [
            '[data-testid="track-artist"]',
            '[data-testid="track-creator"]',
            'a[href*="/artist/"]',
          ];
          
          for (const selector of artistSelectors) {
            const el = track.querySelector(selector);
            if (el) {
              artist = el.getAttribute('title') || el.textContent || '';
              break;
            }
          }

          // Tentar múltiplos seletores para álbum
          let album = '';
          const albumSelectors = [
            '[data-testid="track-album"]',
            'a[href*="/album/"]',
          ];

          for (const selector of albumSelectors) {
            const el = track.querySelector(selector);
            if (el) {
              album = el.getAttribute('title') || el.textContent || '';
              break;
            }
          }

          // Extrair URL da track
          let url = '';
          const linkElement = track.querySelector('a[href*="/track/"]');
          if (linkElement) {
            const href = linkElement.getAttribute('href');
            if (href) {
              url = `https://open.spotify.com${href}`;
            }
          }

          if (title.trim()) {
            const yearMatch = album?.match(/\b(19|20)\d{2}\b/);
            const year = yearMatch ? yearMatch[0] : undefined;

            metadata.push({
              nome: title.trim(),
              autor: artist.trim(),
              album: album?.trim() || undefined,
              ano: year,
              url: url || undefined,
            });
          }
        });

        return metadata;
      });

      log.info('[SEARCH] Resultados extraídos:', { total: results.length, time: Date.now() - startTime + 'ms' });
      await page.close();
      return results;
    } catch (error: any) {
      log.info('[SEARCH] ❌ Erro na busca:', {
        query,
        message: error.message,
      });
      throw error;
    }
  }

  /**
   * Busca sugestões de músicas no Spotify (autocomplete)
   * Retorna apenas nome, artista e álbum para sugestões rápidas
   */
  async searchSuggestions(query: string, limit: number = 5): Promise<Suggestion[]> {
    const startTime = Date.now();
    log.info('[SUGGESTIONS] Iniciando busca de sugestões:', { query, limit });

    try {
      const page = await this.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });

      // Navegar para página de busca pública
      const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}/tracks`;
      log.info('[SUGGESTIONS] Navegando para:', searchUrl);

      await page.goto(searchUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      log.info('[SUGGESTIONS] Página carregada em', Date.now() - startTime, 'ms');

      // Aguardar resultados carregarem
      log.info('[SUGGESTIONS] Aguardando track-list...');
      try {
        await page.waitForSelector('[data-testid="track-list"]', {
          timeout: 10000,
        });
        log.info('[SUGGESTIONS] Track-list encontrado');
      } catch {
        log.info('[SUGGESTIONS] Warn: Track-list não encontrado, tentando continuar...');
      }

      // Extrair sugestões (apenas nome, artista, álbum)
      log.info('[SUGGESTIONS] Extraindo sugestões...');
      const suggestions = await page.evaluate((limitParam: number) => {
        const trackList = document.querySelector('[data-testid="track-list"]');
        if (!trackList) return [];

        // Tentar múltiplos seletores para encontrar tracks
        let tracks: NodeListOf<Element>;

        tracks = trackList.querySelectorAll('[role="row"]');
        if (tracks.length === 0) {
          tracks = trackList.querySelectorAll('div[role="row"]');
        }
        if (tracks.length === 0) {
          tracks = trackList.querySelectorAll('li');
        }
        if (tracks.length === 0) {
          tracks = trackList.querySelectorAll(':scope > div');
        }

        const suggestions: any[] = [];

        tracks.forEach((track) => {
          if (suggestions.length >= limitParam) return;

          // Tentar múltiplos seletores para título
          let title = '';
          const titleSelectors = [
            '[data-testid="track-title"]',
            '[data-testid="track-name"]',
            'a[href*="/track/"]',
            '.encore-text',
          ];

          for (const selector of titleSelectors) {
            const el = track.querySelector(selector);
            if (el) {
              title = el.getAttribute('title') || el.textContent || '';
              break;
            }
          }

          // Tentar múltiplos seletores para artista
          let artist = '';
          const artistSelectors = [
            '[data-testid="track-artist"]',
            '[data-testid="track-creator"]',
            'a[href*="/artist/"]',
          ];

          for (const selector of artistSelectors) {
            const el = track.querySelector(selector);
            if (el) {
              artist = el.getAttribute('title') || el.textContent || '';
              break;
            }
          }

          // Tentar múltiplos seletores para álbum
          let album = '';
          const albumSelectors = [
            '[data-testid="track-album"]',
            'a[href*="/album/"]',
          ];

          for (const selector of albumSelectors) {
            const el = track.querySelector(selector);
            if (el) {
              album = el.getAttribute('title') || el.textContent || '';
              break;
            }
          }

          // Extrair URL da track
          let url = '';
          const linkElement = track.querySelector('a[href*="/track/"]');
          if (linkElement) {
            const href = linkElement.getAttribute('href');
            if (href) {
              url = `https://open.spotify.com${href}`;
            }
          }

          if (title.trim() && artist.trim()) {
            suggestions.push({
              nome: title.trim(),
              artista: artist.trim(),
              album: album?.trim() || undefined,
              url: url || undefined,
            });
          }
        });

        return suggestions;
      }, limit);

      log.info('[SUGGESTIONS] Sugestões extraídas:', { total: suggestions.length, time: Date.now() - startTime + 'ms' });
      await page.close();
      return suggestions;
    } catch (error: any) {
      log.info('[SUGGESTIONS] ❌ Erro na busca de sugestões:', {
        query,
        message: error.message,
      });
      throw error;
    }
  }

  /**
   * Extrai metadados de URL do Spotify (sem login necessário)
   */
  async getMetadataByUrl(url: string): Promise<ScrapedMetadata | null> {
    const startTime = Date.now();
    log.info('[METADATA] Iniciando extração de URL:', { url });

    try {
      const page = await this.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });

      log.info('[METADATA] Navegando para URL...');
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      log.info('[METADATA] Página carregada em', Date.now() - startTime, 'ms');

      try {
        await page.waitForSelector('[data-testid="track-title"]', {
          timeout: 10000,
        });
        log.info('[METADATA] Elementos encontrados');
      } catch {
        log.info('[METADATA] Warn: Título da track não encontrado');
      }

      log.info('[METADATA] Extraindo dados...');
      const metadata = await page.evaluate(() => {
        const titleElement = document.querySelector('[data-testid="track-title"]');
        const artistElements = document.querySelectorAll('[data-testid="track-artist"]');
        const albumElement = document.querySelector('[data-testid="track-album"]');
        const thumbnailElement = document.querySelector('img[alt*="capa"], img[alt*="cover"]');

        const title = titleElement?.textContent?.trim() || '';
        const artists: string[] = [];
        artistElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text) artists.push(text);
        });

        const album = albumElement?.textContent?.trim();
        const thumbnail = thumbnailElement?.getAttribute('src');

        const yearElement = document.querySelector('[data-testid="track-subtitle"]');
        const yearMatch = yearElement?.textContent?.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? yearMatch[0] : undefined;

        return {
          nome: title,
          autor: artists.join(', '),
          album: album || undefined,
          ano: year,
          thumbnail: thumbnail || undefined,
        };
      });

      log.info('[METADATA] Dados extraídos:', {
        nome: metadata.nome,
        autor: metadata.autor,
        time: Date.now() - startTime + 'ms',
      });

      await page.close();

      if (!metadata.nome) {
        log.info('[METADATA] Warn: Nome vazio, retornando null');
        return null;
      }

      return metadata;
    } catch (error: any) {
      log.info('[METADATA] ❌ Erro ao extrair:', {
        url,
        message: error.message,
      });
      throw error;
    }
  }

  /**
   * Fecha o browser e limpa recursos
   */
  async close(): Promise<void> {
    log.info('[BROWSER] Fechando browser...');
    
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    log.info('[BROWSER] Browser fechado');
  }
}
