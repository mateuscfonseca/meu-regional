import { ref, readonly } from 'vue'
import api from '../services/api'

export interface Member {
  id: number
  regional_id: number
  nome: string
  username: string
  instrumento: string
  criado_em: string
}

const members = ref<Member[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useMembers() {
  async function loadMembers(regionalId: number) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/members/regional/${regionalId}`)
      members.value = response.data.members
      return members.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar membros'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createMember(data: {
    regional_id: number
    nome: string
    username: string
    password: string
    instrumento: string
  }) {
    error.value = null
    
    try {
      const response = await api.post('/members', data)
      members.value.push(response.data.member)
      return response.data.member
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao criar membro'
      throw err
    }
  }

  async function deleteMember(id: number) {
    error.value = null
    
    try {
      await api.delete(`/members/${id}`)
      members.value = members.value.filter(m => m.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao excluir membro'
      throw err
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  return {
    members: readonly(members),
    loading: readonly(loading),
    error: readonly(error),
    loadMembers,
    createMember,
    deleteMember,
    formatDate
  }
}
