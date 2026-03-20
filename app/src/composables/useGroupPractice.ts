import { ref, readonly } from 'vue'
import api from '../services/api'

export interface GroupPracticeLog {
  id: number
  member_id: number
  repertoire_item_id: number
  tipo: 'grupo'
  duracao_minutos: number | null
  notas: string | null
  data: string
  estudado_em: string
  musica_nome: string
  autor: string | null
  membro_nome: string
}

export interface GroupPracticeStats {
  total_ensaios: number
  tempo_total_minutos: number
  musicas_mais_ensaiadas: { nome: string; autor: string | null; total_ensaios: number }[]
  ensaios_na_semana: number
  ensaios_no_mes: number
  ensaios_no_trimestre: number
  ensaios_no_semestre: number
  ensaios_no_ano: number
  musicas_diferentes_ensaiadas_semana: number
  musicas_diferentes_ensaiadas_mes: number
  ultimo_ensaio: {
    data: string
    musicas_count: number
  } | null
}

const logs = ref<GroupPracticeLog[]>([])
const stats = ref<GroupPracticeStats | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useGroupPractice() {
  async function loadStats(memberId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/practice-group/member/${memberId}/stats`)
      stats.value = response.data
      return stats.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar estatísticas de ensaios'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadLogs(memberId: number, limit: number = 100) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/practice-group/member/${memberId}/logs?limit=${limit}`)
      logs.value = response.data.logs
      return logs.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar histórico de ensaios'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadPracticesByDate(memberId: number, date: string) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/practice-group/member/${memberId}/by-date?data=${date}`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar práticas da data'
      throw err
    } finally {
      loading.value = false
    }
  }

  function formatDate(dateStr: string, includeTime: boolean = true) {
    if (!includeTime) {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    logs: readonly(logs),
    stats: readonly(stats),
    loading: readonly(loading),
    error: readonly(error),
    loadStats,
    loadLogs,
    loadPracticesByDate,
    formatDate
  }
}
