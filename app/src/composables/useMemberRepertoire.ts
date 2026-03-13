import { ref, readonly } from 'vue'
import { memberRepertoireService } from '../services/memberRepertoire'

export interface MemberRepertoire {
  id: number
  member_id: number
  repertoire_item_id: number
  nivel_fluencia: string
  introducao_aprendida: boolean
  tercas_aprendidas: boolean
  arranjo_6_cordas_aprendido: boolean
  notas_pessoais: string | null
  ultima_pratica: string | null
  criado_em: string
  atualizado_em: string
}

export interface RepertoireItemWithMemberData {
  id: number
  regional_id: number
  nome: string
  autor: string | null
  descricao: string | null
  links: string[] | null
  metadados: Record<string, any> | null
  tonalidade: string | null
  notas: string | null
  tem_introducao: boolean
  tem_tercas: boolean
  tem_arranjo_6_cordas: boolean
  criado_em: string
  atualizado_em: string
  // Dados do usuário (opcionais, carregados separadamente)
  member_data?: MemberRepertoire | null
}

const items = ref<MemberRepertoire[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useMemberRepertoire() {
  /**
   * Carrega dados de repertório de um membro para uma regional
   */
  async function loadMemberRepertoire(memberId: number, regionalId: number): Promise<MemberRepertoire[]> {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(
        `/member-repertoire/regional/${regionalId}?member_id=${memberId}`
      )
      items.value = response.data.items
      return response.data.items
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar dados do membro'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Carrega dados de um membro para um item específico
   */
  async function loadByItem(memberId: number, repertoireItemId: number): Promise<MemberRepertoire | null> {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/member-repertoire/item/${repertoireItemId}/member/${memberId}`)
      return response.data.data
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null
      }
      error.value = err.response?.data?.error || 'Erro ao buscar dados'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Atualiza ou cria dados de um membro para um item
   */
  async function updateStatus(data: Partial<MemberRepertoire> & { repertoire_item_id: number }): Promise<MemberRepertoire> {
    error.value = null

    try {
      const response = await memberRepertoireService.upsert({
        ...data,
        member_id: 0, // Será preenchido no backend pelo token
        repertoire_item_id: data.repertoire_item_id
      })
      return response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao atualizar dados'
      throw err
    }
  }

  /**
   * Atualiza campos de proficiência de um item
   */
  async function updatePracticeFields(
    repertoireItemId: number,
    fields: {
      nivel_fluencia?: string
      introducao_aprendida?: boolean
      tercas_aprendidas?: boolean
      arranjo_6_cordas_aprendido?: boolean
      notas_pessoais?: string
    }
  ): Promise<MemberRepertoire> {
    error.value = null

    try {
      const response = await memberRepertoireService.updatePracticeFields(repertoireItemId, fields)
      return response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao atualizar dados'
      throw err
    }
  }

  /**
   * Remove dados de um membro para um item
   */
  async function deleteByItem(repertoireItemId: number): Promise<void> {
    error.value = null

    try {
      // Nota: member_id é obtido do token no backend
      await memberRepertoireService.deleteByItem(0, repertoireItemId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao excluir dados'
      throw err
    }
  }

  /**
   * Inicializa registro em member_repertoire se não existir
   */
  async function initializeMemberData(repertoireItemId: number): Promise<MemberRepertoire | null> {
    error.value = null

    try {
      await memberRepertoireService.initialize(repertoireItemId)
      // Não podemos buscar sem member_id, então retornamos null
      return null
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao inicializar dados'
      throw err
    }
  }

  /**
   * Inicializa registro em member_repertoire se não existir (apenas sucesso/erro)
   */
  async function initializeIfNeeded(repertoireItemId: number): Promise<void> {
    error.value = null

    try {
      await memberRepertoireService.initialize(repertoireItemId)
    } catch (err: any) {
      // Ignora erro se registro já existir (400 Bad Request)
      if (err.response?.status !== 400) {
        error.value = err.response?.data?.error || 'Erro ao inicializar'
        throw err
      }
    }
  }

  return {
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    loadMemberRepertoire,
    loadByItem,
    updateStatus,
    updatePracticeFields,
    deleteByItem,
    initializeMemberData,
    initializeIfNeeded
  }
}
