import api from './api'

export interface ScrapedMetadata {
  nome: string
  autor: string
  album?: string
  ano?: string
  url?: string
  thumbnail?: string
}

export interface Suggestion {
  nome: string
  artista: string
  album?: string
  url?: string
}

export interface ScraperHealth {
  status: string
  scraper: {
    serviceRunning: boolean
    browserRunning: boolean
  }
}

export interface SearchResponse {
  query: string
  results: ScrapedMetadata[]
  total: number
}

export interface SuggestionsResponse {
  query: string
  suggestions: Suggestion[]
  total: number
}

export interface MetadataResponse {
  url: string
  metadata: ScrapedMetadata
}

export function useScraper() {
  /**
   * Verificar saúde do serviço de scraper
   */
  async function health(): Promise<ScraperHealth> {
    const response = await api.get('/scraper/health')
    return response.data
  }

  /**
   * Buscar músicas no Spotify por query
   */
  async function search(query: string): Promise<ScrapedMetadata[]> {
    const response = await api.post('/scraper/spotify/search', { query })
    return response.data.results || []
  }

  /**
   * Buscar apenas o primeiro resultado (para autocomplete)
   */
  async function searchFirst(query: string): Promise<ScrapedMetadata | null> {
    const response = await api.post('/scraper/spotify/search-first', { query })
    return response.data.result || null
  }

  /**
   * Buscar sugestões de músicas (autocomplete)
   * @param query - Termo de busca parcial
   * @param limit - Quantidade máxima de sugestões (default: 5)
   */
  async function searchSuggestions(query: string, limit?: number): Promise<Suggestion[]> {
    const response = await api.post('/scraper/spotify/suggestions', { query, limit })
    return response.data.suggestions || []
  }

  /**
   * Extrair metadados de URL do Spotify
   */
  async function getMetadataByUrl(url: string): Promise<ScrapedMetadata> {
    const response = await api.post('/scraper/spotify/metadata', { url })
    return response.data.metadata
  }

  return {
    health,
    search,
    searchFirst,
    searchSuggestions,
    getMetadataByUrl,
  }
}
