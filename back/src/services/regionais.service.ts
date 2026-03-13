/**
 * Regionais Service - Lógica de negócio de regionais
 * 
 * Encapsula toda a lógica de CRUD de regionais
 */

import { getDb } from '../db-provider';

export interface Regional {
  id: number;
  nome: string;
  descricao: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface CreateRegionalInput {
  nome: string;
  descricao?: string;
}

export interface UpdateRegionalInput {
  nome?: string;
  descricao?: string;
}

export class RegionaisService {
  private db: any;

  constructor() {
    this.db = getDb();
  }

  /**
   * Lista todas as regionais
   */
  async findAll(): Promise<Regional[]> {
    return this.db
      .prepare('SELECT * FROM regionais ORDER BY criado_em DESC')
      .all() as Regional[];
  }

  /**
   * Busca regional por ID
   */
  async findById(id: number): Promise<Regional | null> {
    const regional = this.db
      .prepare('SELECT * FROM regionais WHERE id = ?')
      .get(id) as Regional | undefined;

    return regional || null;
  }

  /**
   * Cria nova regional
   */
  async create(input: CreateRegionalInput): Promise<Regional> {
    const result = this.db
      .prepare('INSERT INTO regionais (nome, descricao) VALUES (?, ?)')
      .run(input.nome, input.descricao || null);

    return this.findById(result.lastInsertRowid as number) as Promise<Regional>;
  }

  /**
   * Atualiza regional
   */
  async update(id: number, input: UpdateRegionalInput): Promise<Regional | null> {
    const regional = await this.findById(id);

    if (!regional) {
      return null;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (input.nome !== undefined) {
      fields.push('nome = ?');
      values.push(input.nome);
    }
    if (input.descricao !== undefined) {
      fields.push('descricao = ?');
      values.push(input.descricao);
    }

    if (fields.length > 0) {
      fields.push('atualizado_em = CURRENT_TIMESTAMP');
      values.push(id);

      this.db.prepare(`UPDATE regionais SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.findById(id);
  }

  /**
   * Deleta regional
   */
  async delete(id: number): Promise<boolean> {
    const regional = await this.findById(id);

    if (!regional) {
      return false;
    }

    this.db.prepare('DELETE FROM regionais WHERE id = ?').run(id);
    return true;
  }
}

// Singleton exportado
export const regionaisService = new RegionaisService();
