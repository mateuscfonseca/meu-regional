import { ref, readonly, computed } from 'vue'
import { useRepertoire } from './useRepertoire'
import { useAuth } from './useAuth'

export interface MusicSuggestion {
  id: number
  nome: string
  autor: string | null
  tonalidade: string | null
  tem_introducao: boolean
  tem_tercas: boolean
  tem_arranjo_6_cordas: boolean
  member_data?: {
    nivel_fluencia: string
    introducao_aprendida: boolean
    tercas_aprendidas: boolean
    arranjo_6_cordas_aprendido: boolean
    ultima_pratica: string | null
  } | null
}

export interface SuggestionFilters {
  // Nível de fluência
  nivel_fluencia?: string[]
  
  // Filtro temporal (dias sem praticar)
  nao_praticadas_ha?: number
  
  // Características gerais
  tem_introducao?: boolean
  introducao_aprendida?: boolean
  tem_tercas?: boolean
  tercas_aprendidas?: boolean
  tem_arranjo_6_cordas?: boolean
  arranjo_6_cordas_aprendido?: boolean
  
  // Filtro por seleção (opcional)
  selection_id?: number
}

interface StoredSuggestion {
  musica_id: number
  data_expiracao: string // ISO string - último minuto do dia corrente
}

const STORAGE_KEY = 'music_suggestion_cache'

const repertoire = ref<MusicSuggestion[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentSuggestion = ref<MusicSuggestion | null>(null)

export function useMusicSuggestion() {
  const { loadRepertoire } = useRepertoire()
  const { state } = useAuth()

  /**
   * Calcula a data de expiração (último minuto do dia corrente)
   */
  function getExpiryDate(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  }

  /**
   * Verifica se sugestão armazenada ainda é válida
   */
  function isStoredSuggestionValid(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false

      const parsed: StoredSuggestion = JSON.parse(stored)
      const expiry = new Date(parsed.data_expiracao)
      const now = new Date()

      return now <= expiry
    } catch {
      return false
    }
  }

  /**
   * Obtém ID da música armazenada (se válida)
   */
  function getStoredMusicId(): number | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const parsed: StoredSuggestion = JSON.parse(stored)
      const expiry = new Date(parsed.data_expiracao)
      const now = new Date()

      if (now <= expiry) {
        return parsed.musica_id
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Armazena sugestão no Local Storage
   */
  function storeSuggestion(musicaId: number): void {
    const expiry = getExpiryDate()
    const stored: StoredSuggestion = {
      musica_id: musicaId,
      data_expiracao: expiry.toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  }

  /**
   * Limpa sugestão armazenada
   */
  function clearStoredSuggestion(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Carrega repertório completo da regional
   */
  async function loadFullRepertoire(): Promise<void> {
    if (!state.user?.regional_id || !state.user?.id) {
      error.value = 'Usuário não autenticado'
      return
    }

    loading.value = true
    error.value = null

    try {
      const items = await loadRepertoire(state.user.regional_id, state.user.id)
      repertoire.value = items as MusicSuggestion[]
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar repertório'
      console.error('[useMusicSuggestion] Erro ao carregar repertório:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Aplica filtros no repertório carregado
   */
  function filterRepertoire(filters: SuggestionFilters): MusicSuggestion[] {
    let result = repertoire.value

    // Filtro: nível de fluência
    if (filters.nivel_fluencia && filters.nivel_fluencia.length > 0) {
      result = result.filter(item =>
        filters.nivel_fluencia!.includes(item.member_data?.nivel_fluencia || 'precisa_aprender')
      )
    }

    // Filtro: não praticadas há X dias
    if (filters.nao_praticadas_ha) {
      const days = filters.nao_praticadas_ha
      result = result.filter(item => {
        if (!item.member_data?.ultima_pratica) return true // nunca praticada = inclui
        const lastPractice = new Date(item.member_data.ultima_pratica)
        const diffDays = Math.floor((Date.now() - lastPractice.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays >= days
      })
    }

    // Filtro: introdução (característica geral)
    if (filters.tem_introducao !== undefined) {
      result = result.filter(item => item.tem_introducao === filters.tem_introducao)
    }

    // Filtro: introdução aprendida (dados do usuário)
    if (filters.introducao_aprendida !== undefined) {
      result = result.filter(item =>
        (item.member_data?.introducao_aprendida || false) === filters.introducao_aprendida
      )
    }

    // Filtro: terças (característica geral)
    if (filters.tem_tercas !== undefined) {
      result = result.filter(item => item.tem_tercas === filters.tem_tercas)
    }

    // Filtro: terças aprendidas (dados do usuário)
    if (filters.tercas_aprendidas !== undefined) {
      result = result.filter(item =>
        (item.member_data?.tercas_aprendidas || false) === filters.tercas_aprendidas
      )
    }

    // Filtro: arranjo 6 cordas (característica geral)
    if (filters.tem_arranjo_6_cordas !== undefined) {
      result = result.filter(item => item.tem_arranjo_6_cordas === filters.tem_arranjo_6_cordas)
    }

    // Filtro: arranjo 6 cordas aprendido (dados do usuário)
    if (filters.arranjo_6_cordas_aprendido !== undefined) {
      result = result.filter(item =>
        (item.member_data?.arranjo_6_cordas_aprendido || false) === filters.arranjo_6_cordas_aprendido
      )
    }

    return result
  }

  /**
   * Seleciona música aleatória do repertório (excluindo já sugerida)
   */
  function pickRandomMusic(excludeId?: number): MusicSuggestion | null {
    let candidates = repertoire.value

    // Excluir música já sugerida (se não expirou)
    if (excludeId) {
      candidates = candidates.filter(item => item.id !== excludeId)
    }

    if (candidates.length === 0) {
      return null
    }

    const randomIndex = Math.floor(Math.random() * candidates.length)
    return candidates[randomIndex]
  }

  /**
   * Gera sugestão de música aleatória com filtros opcionais
   * @param filters - Filtros para restringir as músicas elegíveis
   * @param forceNew - Se true, ignora sugestão armazenada e gera nova
   */
  async function suggestMusic(
    filters: SuggestionFilters = {},
    forceNew: boolean = false
  ): Promise<MusicSuggestion | null> {
    // Carregar repertório se necessário
    if (repertoire.value.length === 0) {
      await loadFullRepertoire()
    }

    if (error.value || repertoire.value.length === 0) {
      return null
    }

    // Verificar se já existe sugestão válida (e não estamos forçando nova)
    if (!forceNew) {
      const storedId = getStoredMusicId()
      if (storedId) {
        const storedMusic = repertoire.value.find(m => m.id === storedId)
        if (storedMusic) {
          currentSuggestion.value = storedMusic
          return storedMusic
        }
      }
    }

    // Aplicar filtros
    const filtered = filterRepertoire(filters)

    if (filtered.length === 0) {
      currentSuggestion.value = null
      error.value = 'Nenhuma música encontrada com os filtros selecionados'
      return null
    }

    // Selecionar música aleatória
    const storedId = getStoredMusicId()
    const suggestion = pickRandomMusic(storedId || undefined)

    if (!suggestion) {
      // Se não há mais candidatos (ex: todos já foram sugeridos), limpar e tentar de novo
      clearStoredSuggestion()
      const retry = pickRandomMusic()
      if (!retry) {
        currentSuggestion.value = null
        error.value = 'Não foi possível gerar sugestão'
        return null
      }
      currentSuggestion.value = retry
      storeSuggestion(retry.id)
      return retry
    }

    currentSuggestion.value = suggestion
    storeSuggestion(suggestion.id)
    error.value = null

    return suggestion
  }

  /**
   * Limpa sugestão atual
   */
  function clearSuggestion(): void {
    currentSuggestion.value = null
    clearStoredSuggestion()
    error.value = null
  }

  /**
   * Reseta repertório carregado (útil para logout)
   */
  function reset(): void {
    repertoire.value = []
    currentSuggestion.value = null
    error.value = null
    clearStoredSuggestion()
  }

  return {
    repertoire: readonly(repertoire),
    loading: readonly(loading),
    error: readonly(error),
    currentSuggestion: readonly(currentSuggestion),
    loadFullRepertoire,
    filterRepertoire,
    suggestMusic,
    clearSuggestion,
    reset,
  }
}
