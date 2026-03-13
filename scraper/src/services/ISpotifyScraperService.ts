/**
 * Interface para o serviço de scraping do Spotify
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

export interface SpotifyScraperConfig {
  headless?: boolean;
}

export interface ISpotifyScraperService {
  /**
   * Inicializa o browser e o contexto
   */
  initialize(): Promise<void>;

  /**
   * Busca músicas no Spotify por query (busca completa)
   * @param query - Termo de busca (artista, música, etc)
   * @returns Lista de metadados das músicas encontradas (até 10)
   */
  search(query: string): Promise<ScrapedMetadata[]>;

  /**
   * Busca sugestões de músicas no Spotify (autocomplete)
   * @param query - Termo de busca parcial
   * @param limit - Quantidade máxima de sugestões (default: 5)
   * @returns Lista de sugestões
   */
  searchSuggestions(query: string, limit?: number): Promise<Suggestion[]>;

  /**
   * Extrai metadados de uma URL do Spotify
   * @param url - URL da track/album/playlist no Spotify
   * @returns Metadados da track ou null se não encontrado
   */
  getMetadataByUrl(url: string): Promise<ScrapedMetadata | null>;

  /**
   * Fecha o browser e limpa recursos
   */
  close(): Promise<void>;
}
