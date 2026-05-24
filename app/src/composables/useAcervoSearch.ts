import api from '../services/api'
import { ref, readonly } from 'vue'

export interface AcervoResult {
  nome: string
  autor: string
  genero: string
}

export function useAcervoSearch() {
  const results = ref<AcervoResult[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function search(query: string) {
    if (!query || query.length < 2) return

    loading.value = true
    error.value = null
    results.value = []

    try {
      const response = await api.post('/scraper/casa-do-choro/search', { query })
      results.value = response.data.results || []
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao buscar no Acervo'
      results.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearResults() {
    results.value = []
    error.value = null
  }

  return {
    results: readonly(results),
    loading: readonly(loading),
    error: readonly(error),
    search,
    clearResults,
  }
}
