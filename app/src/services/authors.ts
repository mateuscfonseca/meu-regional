import api from './api'

export interface AuthorsSuggestionsResponse {
  query: string
  suggestions: string[]
  total: number
}

export function useAuthors() {
  /**
   * Buscar sugestões de autores (autocomplete)
   * @param query - Termo de busca parcial
   * @param limit - Quantidade máxima de sugestões (default: 10)
   * @returns Lista de nomes de autores
   */
  async function getSuggestions(query: string, limit?: number): Promise<string[]> {
    const params = new URLSearchParams({ q: query })
    
    if (limit) {
      params.set('limit', limit.toString())
    }
    
    const response = await api.get(`/authors/suggestions?${params.toString()}`)
    return response.data.suggestions || []
  }

  /**
   * Listar todos os autores (paginado)
   * @param offset - Posição inicial
   * @param limit - Quantidade máxima (default: 50)
   * @returns Lista de autores e total
   */
  async function list(offset?: number, limit?: number): Promise<{ authors: string[]; total: number }> {
    const params = new URLSearchParams()
    
    if (offset !== undefined) {
      params.set('offset', offset.toString())
    }
    
    if (limit !== undefined) {
      params.set('limit', limit.toString())
    }
    
    const response = await api.get(`/authors/list?${params.toString()}`)
    return response.data
  }

  return {
    getSuggestions,
    list,
  }
}
