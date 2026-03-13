/**
 * Member Repertoire Service
 *
 * Gerencia dados de proficiência de membros para itens do repertório.
 * Cada membro tem seu próprio status de aprendizado para cada música.
 */

import { getDb } from '../db-provider';

export interface MemberRepertoire {
  id: number;
  member_id: number;
  repertoire_item_id: number;
  nivel_fluencia: string;
  introducao_aprendida: boolean;
  tercas_aprendidas: boolean;
  arranjo_6_cordas_aprendido: boolean;
  notas_pessoais: string | null;
  ultima_pratica: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface CreateMemberRepertoireInput {
  member_id: number;
  repertoire_item_id: number;
  nivel_fluencia?: string;
  introducao_aprendida?: boolean;
  tercas_aprendidas?: boolean;
  arranjo_6_cordas_aprendido?: boolean;
  notas_pessoais?: string;
  ultima_pratica?: string;
}

export interface UpdateMemberRepertoireInput {
  nivel_fluencia?: string;
  introducao_aprendida?: boolean;
  tercas_aprendidas?: boolean;
  arranjo_6_cordas_aprendido?: boolean;
  notas_pessoais?: string;
  ultima_pratica?: string;
}

export interface PracticeFields {
  introducao_aprendida?: boolean;
  tercas_aprendidas?: boolean;
  arranjo_6_cordas_aprendido?: boolean;
  nivel_fluencia?: string;
}

export class MemberRepertoireService {
  /**
   * Busca dados de um membro para um item específico do repertório
   */
  async findByMemberAndItem(
    memberId: number,
    repertoireItemId: number
  ): Promise<MemberRepertoire | null> {
    const db = getDb();
    const record = db.prepare(`
      SELECT * FROM member_repertoire
      WHERE member_id = ? AND repertoire_item_id = ?
    `).get(memberId, repertoireItemId) as any;

    if (!record) {
      return null;
    }

    return this.parseRecord(record);
  }

  /**
   * Busca todos os dados de repertório de um membro
   */
  async findByMember(memberId: number): Promise<MemberRepertoire[]> {
    const db = getDb();
    const records = db.prepare(`
      SELECT * FROM member_repertoire
      WHERE member_id = ?
      ORDER BY repertoire_item_id
    `).all(memberId) as any[];

    return records.map(record => this.parseRecord(record));
  }

  /**
   * Busca dados de múltiplos membros para itens do repertório
   * (útil para listar repertório da regional com status de um membro específico)
   */
  async findByMemberWithItems(
    memberId: number,
    regionalId: number
  ): Promise<Array<MemberRepertoire & { item_nome: string; item_autor: string | null }>> {
    const db = getDb();
    const records = db.prepare(`
      SELECT mr.*, ri.nome as item_nome, ri.autor as item_autor
      FROM member_repertoire mr
      INNER JOIN repertoire_items ri ON mr.repertoire_item_id = ri.id
      WHERE mr.member_id = ? AND ri.regional_id = ?
      ORDER BY ri.nome
    `).all(memberId, regionalId) as any[];

    return records.map(record => ({
      ...this.parseRecord(record),
      item_nome: record.item_nome,
      item_autor: record.item_autor,
    }));
  }

  /**
   * Cria ou atualiza (upsert) dados de um membro para um item
   */
  async upsert(
    memberId: number,
    repertoireItemId: number,
    data: UpdateMemberRepertoireInput
  ): Promise<MemberRepertoire> {
    const db = getDb();
    const existing = await this.findByMemberAndItem(memberId, repertoireItemId);

    if (existing) {
      // Atualizar
      await this.update(existing.id, data);
      return (await this.findByMemberAndItem(memberId, repertoireItemId))!;
    } else {
      // Criar
      const result = db.prepare(`
        INSERT INTO member_repertoire (
          member_id, repertoire_item_id,
          nivel_fluencia, introducao_aprendida, tercas_aprendidas,
          arranjo_6_cordas_aprendido, notas_pessoais, ultima_pratica
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        memberId,
        repertoireItemId,
        data.nivel_fluencia || 'precisa_aprender',
        data.introducao_aprendida ? 1 : 0,
        data.tercas_aprendidas ? 1 : 0,
        data.arranjo_6_cordas_aprendido ? 1 : 0,
        data.notas_pessoais || null,
        data.ultima_pratica || null
      );

      return (await this.findByMemberAndItem(memberId, repertoireItemId))!;
    }
  }

  /**
   * Cria novo registro
   */
  async create(input: CreateMemberRepertoireInput): Promise<MemberRepertoire> {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO member_repertoire (
        member_id, repertoire_item_id,
        nivel_fluencia, introducao_aprendida, tercas_aprendidas,
        arranjo_6_cordas_aprendido, notas_pessoais, ultima_pratica
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.member_id,
      input.repertoire_item_id,
      input.nivel_fluencia || 'precisa_aprender',
      input.introducao_aprendida ? 1 : 0,
      input.tercas_aprendidas ? 1 : 0,
      input.arranjo_6_cordas_aprendido ? 1 : 0,
      input.notas_pessoais || null,
      input.ultima_pratica || null
    );

    return (await this.findByMemberAndItem(input.member_id, input.repertoire_item_id))!;
  }

  /**
   * Atualiza registro existente
   */
  async update(id: number, input: UpdateMemberRepertoireInput): Promise<void> {
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (input.nivel_fluencia !== undefined) {
      fields.push('nivel_fluencia = ?');
      values.push(input.nivel_fluencia);
    }

    if (input.introducao_aprendida !== undefined) {
      fields.push('introducao_aprendida = ?');
      values.push(input.introducao_aprendida ? 1 : 0);
    }

    if (input.tercas_aprendidas !== undefined) {
      fields.push('tercas_aprendidas = ?');
      values.push(input.tercas_aprendidas ? 1 : 0);
    }

    if (input.arranjo_6_cordas_aprendido !== undefined) {
      fields.push('arranjo_6_cordas_aprendido = ?');
      values.push(input.arranjo_6_cordas_aprendido ? 1 : 0);
    }

    if (input.notas_pessoais !== undefined) {
      fields.push('notas_pessoais = ?');
      values.push(input.notas_pessoais);
    }

    if (input.ultima_pratica !== undefined) {
      fields.push('ultima_pratica = ?');
      values.push(input.ultima_pratica);
    }

    if (fields.length > 0) {
      fields.push('atualizado_em = CURRENT_TIMESTAMP');
      values.push(id);

      db.prepare(`UPDATE member_repertoire SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  /**
   * Atualiza campos de proficiência de uma música para um membro
   */
  async updatePracticeFields(
    memberId: number,
    repertoireItemId: number,
    fields: PracticeFields
  ): Promise<MemberRepertoire> {
    const existing = await this.findByMemberAndItem(memberId, repertoireItemId);

    if (existing) {
      await this.update(existing.id, fields);
      return (await this.findByMemberAndItem(memberId, repertoireItemId))!;
    } else {
      // Criar novo registro se não existir
      return await this.create({
        member_id: memberId,
        repertoire_item_id: repertoireItemId,
        ...fields,
      });
    }
  }

  /**
   * Atualiza última prática de um membro para uma música
   */
  async updateLastPractice(
    memberId: number,
    repertoireItemId: number,
    date: Date,
    nivelFluencia?: string
  ): Promise<MemberRepertoire> {
    const existing = await this.findByMemberAndItem(memberId, repertoireItemId);

    if (existing) {
      const updateData: UpdateMemberRepertoireInput = {
        ultima_pratica: date.toISOString(),
      };
      if (nivelFluencia) {
        updateData.nivel_fluencia = nivelFluencia;
      }
      await this.update(existing.id, updateData);
      return (await this.findByMemberAndItem(memberId, repertoireItemId))!;
    } else {
      return await this.create({
        member_id: memberId,
        repertoire_item_id: repertoireItemId,
        ultima_pratica: date.toISOString(),
        nivel_fluencia: nivelFluencia || 'precisa_aprender',
      });
    }
  }

  /**
   * Deleta registro
   */
  async delete(id: number): Promise<boolean> {
    const db = getDb();
    const record = db.prepare('SELECT * FROM member_repertoire WHERE id = ?').get(id);

    if (!record) {
      return false;
    }

    db.prepare('DELETE FROM member_repertoire WHERE id = ?').run(id);
    return true;
  }

  /**
   * Deleta registro por membro e item
   */
  async deleteByMemberAndItem(memberId: number, repertoireItemId: number): Promise<boolean> {
    const db = getDb();
    const record = db.prepare(`
      SELECT * FROM member_repertoire
      WHERE member_id = ? AND repertoire_item_id = ?
    `).get(memberId, repertoireItemId);

    if (!record) {
      return false;
    }

    db.prepare(`
      DELETE FROM member_repertoire
      WHERE member_id = ? AND repertoire_item_id = ?
    `).run(memberId, repertoireItemId);
    return true;
  }

  /**
   * Parseia campos booleanos do SQLite
   */
  private parseRecord(record: any): MemberRepertoire {
    record.introducao_aprendida = Boolean(record.introducao_aprendida);
    record.tercas_aprendidas = Boolean(record.tercas_aprendidas);
    record.arranjo_6_cordas_aprendido = Boolean(record.arranjo_6_cordas_aprendido);
    return record;
  }
}

// Singleton
export const memberRepertoireService = new MemberRepertoireService();
