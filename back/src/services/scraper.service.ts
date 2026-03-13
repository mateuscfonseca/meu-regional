/**
 * Scraper Service - Serviço base para web scraping
 * 
 * Fornece funcionalidades comuns para todos os scrapers (Spotify, YouTube, Tidal, etc.)
 */

import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import { getDb } from '../db-provider';

export interface ScrapedMetadata {
  nome: string;
  autor: string;
  album?: string;
  ano?: string;
  url?: string;
  thumbnail?: string;
}

export interface ScraperConfig {
  headless: boolean;
  timeout: number;
  cacheEnabled: boolean;
  cacheTTL: number; // em segundos
}

const DEFAULT_CONFIG: ScraperConfig = {
  headless: process.env.SCRAPER_HEADLESS !== 'false',
  timeout: 30000,
  cacheEnabled: true,
  cacheTTL: 60 * 60 * 24, // 24 horas
};

/**
 * Classe base para scrapers
 */
export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected config: ScraperConfig;
  protected db: any;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.db = getDb();
    this.initCacheTable();
  }

  /**
   * Inicializa tabela de cache no banco
   */
  private initCacheTable() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS scraper_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        query TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        UNIQUE(source, query)
      )
    `);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_scraper_cache_source_query ON scraper_cache(source, query)`);
  }

  /**
   * Inicializa o browser
   */
  async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
    }
  }

  /**
   * Fecha o browser
   */
  async closeBrowser(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Cria uma nova página
   */
  async newPage(): Promise<Page> {
    if (!this.context) {
      await this.initBrowser();
    }
    return this.context!.newPage();
  }

  /**
   * Busca no cache
   */
  getCachedResult(source: string, query: string): ScrapedMetadata[] | null {
    if (!this.config.cacheEnabled) return null;

    const cached = this.db.prepare(`
      SELECT result, expires_at FROM scraper_cache
      WHERE source = ? AND query = ? AND expires_at > datetime('now')
    `).get(source, query) as { result: string; expires_at: string } | undefined;

    if (cached) {
      try {
        return JSON.parse(cached.result);
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Salva no cache
   */
  saveToCache(source: string, query: string, results: ScrapedMetadata[]): void {
    if (!this.config.cacheEnabled) return;

    const expiresAt = new Date(Date.now() + this.config.cacheTTL * 1000).toISOString();

    this.db.prepare(`
      INSERT OR REPLACE INTO scraper_cache (source, query, result, expires_at)
      VALUES (?, ?, ?, datetime(?))
    `).run(source, query, JSON.stringify(results), expiresAt);
  }

  /**
   * Limpa cache expirado
   */
  clearExpiredCache(): void {
    this.db.run(`DELETE FROM scraper_cache WHERE expires_at <= datetime('now')`);
  }

  /**
   * Método abstrato para busca
   */
  abstract search(query: string): Promise<ScrapedMetadata[]>;

  /**
   * Método abstrato para extrair metadata de URL
   */
  abstract getMetadataByUrl(url: string): Promise<ScrapedMetadata | null>;
}

/**
 * Singleton do scraper service
 */
class ScraperServiceManager {
  private scrapers: Map<string, BaseScraper> = new Map();

  register(name: string, scraper: BaseScraper): void {
    this.scrapers.set(name, scraper);
  }

  get(name: string): BaseScraper | undefined {
    return this.scrapers.get(name);
  }

  async cleanup(): Promise<void> {
    for (const scraper of this.scrapers.values()) {
      await scraper.closeBrowser();
    }
  }
}

export const scraperManager = new ScraperServiceManager();
