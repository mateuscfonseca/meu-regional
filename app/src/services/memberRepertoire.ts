import api from './api'

export interface MemberRepertoireData {
  id: number
  member_id: number
  repertoire_item_id: number
  nivel_fluencia: string
  introducao_aprendida: boolean
  tercas_aprendidas: boolean
  arranjo_6_cordas_aprendido: boolean
  notas_pessoais: string | null
  ultima_pratica: string | null
}

export const memberRepertoireService = {
  /**
   * Busca dados de proficiência de um membro para um item do repertório
   */
  async getByItem(
    memberId: number,
    repertoireItemId: number
  ): Promise<MemberRepertoireData | null> {
    try {
      const response = await api.get(
        `/member-repertoire/item/${repertoireItemId}/member/${memberId}`
      )
      return response.data.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  /**
   * Inicializa registro em member_repertoire se não existir
   */
  async initialize(repertoireItemId: number) {
    return await api.post('/member-repertoire/initialize', {
      repertoire_item_id: repertoireItemId
    })
  },

  /**
   * Atualiza dados de proficiência de um membro
   */
  async updatePracticeFields(
    repertoireItemId: number,
    fields: {
      introducao_aprendida?: boolean
      tercas_aprendidas?: boolean
      arranjo_6_cordas_aprendido?: boolean
      nivel_fluencia?: string
      notas_pessoais?: string
    }
  ) {
    return await api.put(`/member-repertoire/item/${repertoireItemId}`, fields)
  },

  /**
   * Atualiza ou cria dados de um membro para um item (upsert)
   */
  async upsert(data: {
    member_id: number
    repertoire_item_id: number
    nivel_fluencia?: string
    introducao_aprendida?: boolean
    tercas_aprendidas?: boolean
    arranjo_6_cordas_aprendido?: boolean
    notas_pessoais?: string
  }) {
    return await api.post('/member-repertoire', data)
  },

  /**
   * Remove dados de um membro para um item
   */
  async deleteByItem(memberId: number, repertoireItemId: number) {
    return await api.delete(`/member-repertoire/item/${repertoireItemId}?member_id=${memberId}`)
  },
}
