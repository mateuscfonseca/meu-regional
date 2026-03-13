/**
 * Practice Service - Serviço para controle de prática e estudo
 *
 * Gerencia campos de prática GERAIS nas músicas do repertório
 * (campos que todos os membros podem ver/editar)
 */

import { getDb } from '../db-provider';

export interface PracticeFields {
  tonalidade?: string;
  notas?: string;
  tem_introducao?: boolean;
  tem_tercas?: boolean;
  tem_arranjo_6_cordas?: boolean;
}

export interface RepertoireFilters {
  nao_praticadas_ha?: number; // dias (baseado em member_repertoire)
  tem_introducao?: boolean;
  tem_tercas?: boolean;
  tem_arranjo_6_cordas?: boolean;
}

export interface RepertoireItemWithPractice {
  id: number;
  regional_id: number;
  nome: string;
  autor: string;
  descricao: string | null;
  links: string | null;
  metadados: string | null;
  tonalidade: string | null;
  notas: string | null;
  tem_introducao: number;
  tem_tercas: number;
  tem_arranjo_6_cordas: number;
  criado_em: string;
  atualizado_em: string;
}

export class PracticeService {
  /**
   * Atualizar campos de prática GERAIS de uma música
   * (afeta todos os usuários)
   */
  async updatePracticeFields(id: number, fields: PracticeFields): Promise<void> {
    const db = getDb();

    const updates: string[] = [];
    const values: any[] = [];

    if (fields.tonalidade !== undefined) {
      updates.push('tonalidade = ?');
      values.push(fields.tonalidade);
    }

    if (fields.notas !== undefined) {
      updates.push('notas = ?');
      values.push(fields.notas);
    }

    if (fields.tem_introducao !== undefined) {
      updates.push('tem_introducao = ?');
      values.push(fields.tem_introducao ? 1 : 0);
    }

    if (fields.tem_tercas !== undefined) {
      updates.push('tem_tercas = ?');
      values.push(fields.tem_tercas ? 1 : 0);
    }

    if (fields.tem_arranjo_6_cordas !== undefined) {
      updates.push('tem_arranjo_6_cordas = ?');
      values.push(fields.tem_arranjo_6_cordas ? 1 : 0);
    }

    if (updates.length === 0) return;

    updates.push('atualizado_em = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE repertoire_items SET ${updates.join(', ')} WHERE id = ?`;
    db.run(sql, values);
  }

  /**
   * Listar repertório com filtros de prática (campos gerais)
   * Nota: Filtros específicos por usuário devem usar member_repertoire service
   */
  async getRepertoireWithFilters(
    regionalId: number,
    filters: RepertoireFilters = {}
  ): Promise<RepertoireItemWithPractice[]> {
    const db = getDb();

    let sql = `
      SELECT
        id, regional_id, nome, autor, descricao, links, metadados,
        tonalidade, notas,
        tem_introducao, tem_tercas, tem_arranjo_6_cordas,
        criado_em, atualizado_em
      FROM repertoire_items
      WHERE regional_id = ?
    `;

    const params: any[] = [regionalId];
    const whereClauses: string[] = [];

    // Filtros booleanos de características gerais
    if (filters.tem_introducao !== undefined) {
      whereClauses.push('tem_introducao = ?');
      params.push(filters.tem_introducao ? 1 : 0);
    }

    if (filters.tem_tercas !== undefined) {
      whereClauses.push('tem_tercas = ?');
      params.push(filters.tem_tercas ? 1 : 0);
    }

    if (filters.tem_arranjo_6_cordas !== undefined) {
      whereClauses.push('tem_arranjo_6_cordas = ?');
      params.push(filters.tem_arranjo_6_cordas ? 1 : 0);
    }

    if (whereClauses.length > 0) {
      sql += ' AND ' + whereClauses.join(' AND ');
    }

    // Ordenar por nome
    sql += ' ORDER BY nome ASC';

    const rows = db.prepare(sql).all(...params) as RepertoireItemWithPractice[];

    return rows;
  }
}

// Singleton
export const practiceService = new PracticeService();
