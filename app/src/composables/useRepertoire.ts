import { ref, readonly } from 'vue'
import api from '../services/api'
import { memberRepertoireService } from '../services/memberRepertoire'

export interface RepertoireItem {
  id: number
  regional_id: number
  nome: string
  autor: string | null
  descricao: string | null
  links: string[] | null
  metadados: Record<string, any> | null
  criado_em: string
  atualizado_em: string
  // Campos de caracterização GERAL (todos os membros podem ver/editar)
  tonalidade: string | null
  notas: string | null
  tem_introducao: boolean
  tem_tercas: boolean
  tem_arranjo_6_cordas: boolean
}

export interface RepertoireItemWithMemberData extends RepertoireItem {
  // Dados do usuário (opcionais, carregados separadamente)
  member_data?: {
    id: number
    member_id: number
    repertoire_item_id: number
    nivel_fluencia: string
    introducao_aprendida: boolean
    tercas_aprendidas: boolean
    arranjo_6_cordas_aprendido: boolean
    notas_pessoais: string | null
    ultima_pratica: string | null
  } | null
}

const items = ref<RepertoireItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useRepertoire() {
  /**
   * Carrega repertório da regional com dados de proficiência do usuário
   * Sempre requer memberId para mostrar dados de proficiência
   */
  async function loadRepertoire(
    regionalId: number,
    memberId: number,
    filters?: Record<string, any>
  ): Promise<RepertoireItemWithMemberData[]> {
    loading.value = true
    error.value = null

    try {
      // Montar query params
      const params = new URLSearchParams()
      params.set('member_id', memberId.toString())
      
      // Adicionar filtros se existirem
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, value.toString())
          }
        })
      }
      
      const queryString = params.toString()
      const url = `/repertoire/regional/${regionalId}${queryString ? '?' + queryString : ''}`

      const response = await api.get(url)
      items.value = response.data.items
      return response.data.items
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar repertório'
      console.error('[useRepertoire] loadRepertoire - Erro:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createItem(data: Partial<RepertoireItem>) {
    error.value = null
    
    try {
      const response = await api.post('/repertoire', data)
      items.value.push(response.data.item)
      return response.data.item
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao criar item'
      throw err
    }
  }

  async function importList(texto: string) {
    error.value = null

    try {
      const response = await api.post('/repertoire/import', { texto })
      items.value.push(...response.data.items)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao importar'
      throw err
    }
  }

  async function deleteItem(id: number) {
    error.value = null

    try {
      await api.delete(`/repertoire/${id}`)
      items.value = items.value.filter(item => item.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao excluir'
      throw err
    }
  }

  async function updateItem(id: number, data: Partial<RepertoireItem>) {
    error.value = null

    try {
      const response = await api.put(`/repertoire/${id}`, data)
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = response.data.item
      }
      return response.data.item
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao atualizar item'
      throw err
    }
  }

  /**
   * Busca um item do repertório por ID
   */
  async function getMusicById(id: number): Promise<RepertoireItem | null> {
    error.value = null

    try {
      const response = await api.get(`/repertoire/${id}`)
      return response.data.item
    } catch (err: any) {
      return null
    }
  }

  /**
   * Atualiza dados de proficiência do usuário para um item
   */
  async function updateMemberPracticeFields(
    repertoireItemId: number,
    fields: {
      introducao_aprendida?: boolean
      tercas_aprendidas?: boolean
      arranjo_6_cordas_aprendido?: boolean
      nivel_fluencia?: string
      notas_pessoais?: string
    }
  ) {
    error.value = null

    try {
      const response = await memberRepertoireService.updatePracticeFields(repertoireItemId, fields)
      return response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao atualizar dados'
      throw err
    }
  }

  function parseLinks(links: string | null) {
    if (!links) return []
    return typeof links === 'string' ? JSON.parse(links) : links
  }

  function getLinkLabel(link: string) {
    if (link.includes('youtube')) return 'YouTube'
    if (link.includes('spotify')) return 'Spotify'
    if (link.includes('tidal')) return 'Tidal'
    return 'Link'
  }

  return {
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    loadRepertoire,
    createItem,
    updateItem,
    getMusicById,
    updateMemberPracticeFields,
    importList,
    deleteItem,
    parseLinks,
    getLinkLabel
  }
}
