/**
 * Spotify Scraper - Integração com serviço de scraping via HTTP
 *
 * Este serviço se comunica com o container de scraping separado
 * para extrair metadados do Spotify. Funciona sem login.
 */

import { scraperClient, ScrapedMetadata, Suggestion } from './scraper-client.service';

export class SpotifyScraperService {
  /**
   * Verifica se o serviço está saudável
   */
  async health(): Promise<{ scraper: boolean; browser: boolean }> {
    try {
      const scraperHealth = await scraperClient.health();
      const browserHealth = await scraperClient.browserHealth();

      return {
        scraper: scraperHealth.status === 'ok',
        browser: browserHealth.browser === 'running',
      };
    } catch {
      return {
        scraper: false,
        browser: false,
      };
    }
  }

  /**
   * Busca músicas no Spotify por query
   */
  async search(query: string): Promise<ScrapedMetadata[]> {
    try {
      return await scraperClient.search(query);
    } catch (error: any) {
      console.error('[SpotifyScraper] Erro na busca:', error.message);
      throw new Error(`Falha ao buscar no Spotify: ${error.message}`);
    }
  }

  /**
   * Busca apenas o primeiro resultado
   */
  async searchFirst(query: string): Promise<ScrapedMetadata | null> {
    try {
      return await scraperClient.searchFirst(query);
    } catch (error: any) {
      console.error('[SpotifyScraper] Erro na busca:', error.message);
      return null;
    }
  }

  /**
   * Busca sugestões de músicas (autocomplete)
   */
  async searchSuggestions(query: string, limit?: number): Promise<Suggestion[]> {
    try {
      return await scraperClient.searchSuggestions(query, limit);
    } catch (error: any) {
      console.error('[SpotifyScraper] Erro na busca de sugestões:', error.message);
      return [];
    }
  }

  /**
   * Extrai metadados de URL do Spotify
   */
  async getMetadataByUrl(url: string): Promise<ScrapedMetadata> {
    try {
      return await scraperClient.getMetadataByUrl(url);
    } catch (error: any) {
      console.error('[SpotifyScraper] Erro ao extrair metadata:', error.message);
      throw new Error(`Falha ao extrair metadata do Spotify: ${error.message}`);
    }
  }
}

// Singleton exportado
export const spotifyScraperService = new SpotifyScraperService();
