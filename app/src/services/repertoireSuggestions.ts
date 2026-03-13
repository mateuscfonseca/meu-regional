import api from './api'

export interface RepertoireSuggestion {
  id: number
  nome: string
  autor: string | null
  label: string
}

export interface RepertoireSuggestionsResponse {
  query: string
  suggestions: RepertoireSuggestion[]
  total: number
}

export function useRepertoireSuggestions() {
  /**
   * Buscar sugestões de músicas (autocomplete)
   * @param query - Termo de busca parcial
   * @param limit - Quantidade máxima de sugestões (default: 10)
   * @param regionalId - ID da regional para filtrar músicas
   * @returns Lista de sugestões de músicas
   */
  async function getSuggestions(
    query: string,
    limit?: number,
    regionalId?: number
  ): Promise<RepertoireSuggestion[]> {
    const params = new URLSearchParams({ q: query })

    if (limit) {
      params.set('limit', limit.toString())
    }

    if (regionalId) {
      params.set('regional_id', regionalId.toString())
    }

    const response = await api.get(`/repertoire/suggestions?${params.toString()}`)
    return response.data.suggestions || []
  }

  return {
    getSuggestions,
  }
}
