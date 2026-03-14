import { ref, readonly } from 'vue'
import api from '../services/api'

export interface StudyLog {
  id: number
  member_id: number
  repertoire_item_id: number
  tipo: 'individual' | 'grupo'
  duracao_minutos: number | null
  notas: string | null
  data: string
  estudado_em: string
  musica_nome?: string
  autor?: string
  membro_nome?: string
}

export interface StudyStats {
  total_estudos: number
  tempo_total_minutos: number
  estudos_por_tipo: { tipo: string; total: number }[]
  musicas_mais_estudadas: { nome: string; autor: string | null; total_estudos: number }[]
  // Frequência por período
  estudos_na_semana: number
  estudos_no_mes: number
  estudos_no_trimestre: number
  estudos_no_semestre: number
  estudos_no_ano: number
  musicas_diferentes_estudadas_semana: number
  musicas_diferentes_estudadas_mes: number
}

const logs = ref<StudyLog[]>([])
const stats = ref<StudyStats | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useStudyLogs() {
  async function loadLogs(memberId: number, limit: number = 100) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/study-logs/member/${memberId}?limit=${limit}`)
      logs.value = response.data.logs
      return logs.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar histórico'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadStats(memberId: number) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/study-logs/member/${memberId}/stats`)
      stats.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar estatísticas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logStudy(data: {
    member_id: number
    repertoire_item_id: number
    tipo: 'individual' | 'grupo'
    duracao_minutos?: number
    notas?: string
    data?: string
  }) {
    error.value = null

    try {
      const response = await api.post('/study-logs', data)
      logs.value.unshift(response.data.log)

      // Atualizar stats se existirem
      if (stats.value) {
        await loadStats(data.member_id)
      }

      return response.data.log
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao registrar estudo'
      throw err
    }
  }

  async function findByRepertoire(repertoireItemId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/study-logs/repertoire/${repertoireItemId}`)
      return response.data.logs
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar histórico'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteLog(logId: number, memberId: number) {
    error.value = null

    try {
      await api.delete(`/study-logs/${logId}`)
      logs.value = logs.value.filter(log => log.id !== logId)

      // Atualizar stats
      if (stats.value) {
        await loadStats(memberId)
      }

      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao excluir registro'
      throw err
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
    loadLogs,
    loadStats,
    logStudy,
    deleteLog,
    findByRepertoire,
    formatDate
  }
}
