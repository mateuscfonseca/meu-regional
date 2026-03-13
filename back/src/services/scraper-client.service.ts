/**
 * Scraper Client - Cliente HTTP para comunicação com o serviço de scraping
 *
 * Este cliente se comunica com o container separado de scraping via HTTP
 * Funciona sem login - usa páginas públicas do Spotify
 */

export interface ScrapedMetadata {
  nome: string;
  autor: string;
  album?: string;
  ano?: string;
  url?: string;
  thumbnail?: string;
}

export interface Suggestion {
  nome: string;
  artista: string;
  album?: string;
  url?: string;
}

export interface ScraperHealth {
  status: string;
  service: string;
  timestamp: string;
}

export interface BrowserHealth {
  browser: string;
  context: string;
}

export interface SearchResponse {
  query: string;
  results: ScrapedMetadata[];
  total: number;
}

export interface MetadataResponse {
  url: string;
  metadata: ScrapedMetadata;
}

export class ScraperClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SCRAPER_API_URL || 'http://localhost:4000';
  }

  /**
   * Verifica saúde do serviço de scraper
   */
  async health(): Promise<ScraperHealth> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Scraper health check failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Verifica saúde do browser
   */
  async browserHealth(): Promise<BrowserHealth> {
    const response = await fetch(`${this.baseUrl}/browser/health`);
    if (!response.ok) {
      throw new Error(`Browser health check failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Busca músicas no Spotify por query
   */
  async search(query: string): Promise<ScrapedMetadata[]> {
    const response = await fetch(`${this.baseUrl}/spotify/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data: SearchResponse = await response.json();

    if (!response.ok) {
      throw new Error(data as any);
    }

    return data.results || [];
  }

  /**
   * Busca apenas o primeiro resultado
   */
  async searchFirst(query: string): Promise<ScrapedMetadata | null> {
    const response = await fetch(`${this.baseUrl}/spotify/search-first`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data);
    }

    return data.result || null;
  }

  /**
   * Busca sugestões de músicas (autocomplete)
   */
  async searchSuggestions(query: string, limit?: number): Promise<Suggestion[]> {
    const response = await fetch(`${this.baseUrl}/spotify/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data);
    }

    return data.suggestions || [];
  }

  /**
   * Extrai metadados de URL do Spotify
   */
  async getMetadataByUrl(url: string): Promise<ScrapedMetadata> {
    const response = await fetch(`${this.baseUrl}/spotify/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data: MetadataResponse = await response.json();

    if (!response.ok) {
      throw new Error(data as any);
    }

    return data.metadata;
  }

  /**
   * Fecha o browser (para manutenção)
   */
  async closeBrowser(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/browser/close`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to close browser');
    }
  }
}

// Singleton exportado
export const scraperClient = new ScraperClient();
