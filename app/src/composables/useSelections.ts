import { ref, readonly } from 'vue'
import api from '../services/api'

export interface Selection {
  id: number
  regional_id: number
  nome: string
  descricao: string | null
  data_evento: string | null
  max_musicas: number
  criada_por: number
  status: 'votacao' | 'finalizada'
  criado_em: string
  atualizado_em: string
  criadora_nome?: string
}

const selections = ref<Selection[]>([])
const currentSelection = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useSelections() {
  async function loadSelections(regionalId: number) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/selections/regional/${regionalId}`)
      selections.value = response.data.selections
      return selections.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar seleções'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadSelectionDetail(id: number | string) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/selections/${id}`)
      currentSelection.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar detalhes'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSelection(data: Partial<Selection>) {
    error.value = null
    
    try {
      const response = await api.post('/selections', data)
      selections.value.push(response.data.selection)
      return response.data.selection
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao criar seleção'
      throw err
    }
  }

  async function vote(selectionId: number, repertoireItemId: number, memberId: number) {
    error.value = null
    
    try {
      await api.post(`/selections/${selectionId}/vote`, {
        repertoire_item_id: repertoireItemId,
        member_id: memberId
      })
      await loadSelectionDetail(selectionId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao votar'
      throw err
    }
  }

  async function removeVote(selectionId: number, memberId: number, repertoireItemId: number) {
    error.value = null
    
    try {
      await api.delete(`/selections/${selectionId}/vote/${memberId}`, {
        params: { repertoire_item_id: repertoireItemId }
      })
      await loadSelectionDetail(selectionId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao remover voto'
      throw err
    }
  }

  async function finalizeSelection(selectionId: number, maxMusicas?: number) {
    error.value = null
    
    try {
      await api.post(`/selections/${selectionId}/finalize`, { max_musicas: maxMusicas })
      await loadSelectionDetail(selectionId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao finalizar seleção'
      throw err
    }
  }

  async function reopenSelection(selectionId: number) {
    error.value = null

    try {
      await api.post(`/selections/${selectionId}/reopen`)
      await loadSelectionDetail(selectionId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao reabrir seleção'
      throw err
    }
  }

  async function getVoters(selectionId: number, repertoireItemId: number) {
    error.value = null

    try {
      const response = await api.get(`/selections/${selectionId}/votes/${repertoireItemId}/voters`)
      return response.data.voters || []
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar votantes'
      throw err
    }
  }

  function clearCurrentSelection() {
    currentSelection.value = null
  }

  return {
    selections: readonly(selections),
    currentSelection: readonly(currentSelection),
    loading: readonly(loading),
    error: readonly(error),
    loadSelections,
    loadSelectionDetail,
    createSelection,
    vote,
    removeVote,
    finalizeSelection,
    reopenSelection,
    getVoters,
    clearCurrentSelection
  }
}
