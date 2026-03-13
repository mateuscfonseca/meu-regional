/**
 * Repertoire Service - Lógica de negócio de repertório
 * 
 * Encapsula toda a lógica de CRUD de itens do repertório
 */

import { getDb } from '../db-provider';

export interface RepertoireItem {
  id: number;
  regional_id: number;
  nome: string;
  autor: string | null;
  descricao: string | null;
  links: string[] | null;
  metadados: Record<string, any> | null;
  criado_em: string;
  atualizado_em: string;
  // Campos de prática
  tonalidade: string | null;
  tonalidade_modo: string | null;
  notas: string | null;
  tem_introducao: boolean;
  tem_tercas: boolean;
  tem_arranjo_6_cordas: boolean;
  introducao_aprendida: boolean;
  tercas_aprendidas: boolean;
  arranjo_6_cordas_aprendido: boolean;
  nivel_fluencia: string | null;
  ultima_pratica: string | null;
}

export interface CreateRepertoireItemInput {
  regional_id: number;
  nome: string;
  autor?: string;
  descricao?: string;
  links?: string[];
  metadados?: Record<string, any>;
  // Campos de prática
  tonalidade?: string;
  tonalidade_modo?: string;
  notas?: string;
  tem_introducao?: boolean;
  tem_tercas?: boolean;
  tem_arranjo_6_cordas?: boolean;
  introducao_aprendida?: boolean;
  tercas_aprendidas?: boolean;
  arranjo_6_cordas_aprendido?: boolean;
  nivel_fluencia?: string;
}

export interface UpdateRepertoireItemInput {
  nome?: string;
  autor?: string;
  descricao?: string;
  links?: string[];
  metadados?: Record<string, any>;
  // Campos de prática
  tonalidade?: string;
  tonalidade_modo?: string;
  notas?: string;
  tem_introducao?: boolean;
  tem_tercas?: boolean;
  tem_arranjo_6_cordas?: boolean;
  introducao_aprendida?: boolean;
  tercas_aprendidas?: boolean;
  arranjo_6_cordas_aprendido?: boolean;
  nivel_fluencia?: string;
}

export interface ImportResult {
  items: RepertoireItem[];
  total: number;
}

export class RepertoireService {
  /**
   * Lista todos os itens do repertório de uma regional
   */
  async findByRegional(regionalId: number): Promise<RepertoireItem[]> {
    const db = getDb();
    const items = db
      .prepare(`
        SELECT * FROM repertoire_items
        WHERE regional_id = ?
        ORDER BY nome
      `)
      .all(regionalId) as any[];

    // Parsear campos JSON
    return items.map((item) => this.parseItem(item));
  }

  /**
   * Busca item do repertório por ID
   */
  async findById(id: number): Promise<RepertoireItem | null> {
    const db = getDb();
    const item = db
      .prepare('SELECT * FROM repertoire_items WHERE id = ?')
      .get(id) as any;

    if (!item) {
      return null;
    }

    return this.parseItem(item);
  }

  /**
   * Parseia campos JSON do item
   */
  private parseItem(item: any): RepertoireItem {
    if (item.links) {
      item.links = typeof item.links === 'string' ? JSON.parse(item.links) : item.links;
    }
    if (item.metadados) {
      item.metadados = typeof item.metadados === 'string' ? JSON.parse(item.metadados) : item.metadados;
    }
    // Converter campos booleanos de SQLite (0/1) para boolean
    if (item.tem_introducao !== undefined) {
      item.tem_introducao = Boolean(item.tem_introducao);
    }
    if (item.tem_tercas !== undefined) {
      item.tem_tercas = Boolean(item.tem_tercas);
    }
    if (item.tem_arranjo_6_cordas !== undefined) {
      item.tem_arranjo_6_cordas = Boolean(item.tem_arranjo_6_cordas);
    }
    if (item.introducao_aprendida !== undefined) {
      item.introducao_aprendida = Boolean(item.introducao_aprendida);
    }
    if (item.tercas_aprendidas !== undefined) {
      item.tercas_aprendidas = Boolean(item.tercas_aprendidas);
    }
    if (item.arranjo_6_cordas_aprendido !== undefined) {
      item.arranjo_6_cordas_aprendido = Boolean(item.arranjo_6_cordas_aprendido);
    }
    return item;
  }

  /**
   * Cria novo item no repertório
   */
  async create(input: CreateRepertoireItemInput): Promise<RepertoireItem> {
    const db = getDb();
    const result = db
      .prepare(`
        INSERT INTO repertoire_items (regional_id, nome, autor, descricao, links, metadados,
          tonalidade, tonalidade_modo, notas, tem_introducao, tem_tercas, tem_arranjo_6_cordas,
          introducao_aprendida, tercas_aprendidas, arranjo_6_cordas_aprendido, nivel_fluencia)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.regional_id,
        input.nome,
        input.autor || null,
        input.descricao || null,
        input.links ? JSON.stringify(input.links) : null,
        input.metadados ? JSON.stringify(input.metadados) : null,
        input.tonalidade || null,
        input.tonalidade_modo || null,
        input.notas || null,
        input.tem_introducao ? 1 : 0,
        input.tem_tercas ? 1 : 0,
        input.tem_arranjo_6_cordas ? 1 : 0,
        input.introducao_aprendida ? 1 : 0,
        input.tercas_aprendidas ? 1 : 0,
        input.arranjo_6_cordas_aprendido ? 1 : 0,
        input.nivel_fluencia || 'precisa_aprender'
      );

    return this.findById(result.lastInsertRowid as number) as Promise<RepertoireItem>;
  }

  /**
   * Atualiza item do repertório
   */
  async update(id: number, input: UpdateRepertoireItemInput): Promise<RepertoireItem | null> {
    const item = await this.findById(id);

    if (!item) {
      return null;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (input.nome !== undefined) {
      fields.push('nome = ?');
      values.push(input.nome);
    }
    if (input.autor !== undefined) {
      fields.push('autor = ?');
      values.push(input.autor);
    }
    if (input.descricao !== undefined) {
      fields.push('descricao = ?');
      values.push(input.descricao);
    }
    if (input.links !== undefined) {
      fields.push('links = ?');
      values.push(JSON.stringify(input.links));
    }
    if (input.metadados !== undefined) {
      fields.push('metadados = ?');
      values.push(JSON.stringify(input.metadados));
    }
    // Campos de prática
    if (input.tonalidade !== undefined) {
      fields.push('tonalidade = ?');
      values.push(input.tonalidade);
    }
    if (input.tonalidade_modo !== undefined) {
      fields.push('tonalidade_modo = ?');
      values.push(input.tonalidade_modo);
    }
    if (input.notas !== undefined) {
      fields.push('notas = ?');
      values.push(input.notas);
    }
    if (input.tem_introducao !== undefined) {
      fields.push('tem_introducao = ?');
      values.push(input.tem_introducao ? 1 : 0);
    }
    if (input.tem_tercas !== undefined) {
      fields.push('tem_tercas = ?');
      values.push(input.tem_tercas ? 1 : 0);
    }
    if (input.tem_arranjo_6_cordas !== undefined) {
      fields.push('tem_arranjo_6_cordas = ?');
      values.push(input.tem_arranjo_6_cordas ? 1 : 0);
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
    if (input.nivel_fluencia !== undefined) {
      fields.push('nivel_fluencia = ?');
      values.push(input.nivel_fluencia);
    }

    if (fields.length > 0) {
      fields.push('atualizado_em = CURRENT_TIMESTAMP');
      values.push(id);

      const db = getDb();
      db.prepare(`UPDATE repertoire_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.findById(id);
  }

  /**
   * Deleta item do repertório
   */
  async delete(id: number): Promise<boolean> {
    const item = await this.findById(id);

    if (!item) {
      return false;
    }

    const db = getDb();
    db.prepare('DELETE FROM repertoire_items WHERE id = ?').run(id);
    return true;
  }

  /**
   * Importa lista de músicas (parsing de texto)
   */
  async importList(regionalId: number, texto: string): Promise<ImportResult> {
    const db = getDb();
    const linhas = texto.split('\n').filter((l) => l.trim());
    const items: RepertoireItem[] = [];

    for (const linha of linhas) {
      // Tentar parsear "Música - Autor" ou apenas "Música"
      const partes = linha.split('-').map((p: string) => p.trim());
      let nome: string;
      let autor: string | undefined;

      if (partes.length >= 2 && partes[1]) {
        nome = partes[0];
        autor = partes.slice(1).join(' - '); // Caso tenha múltiplos "-"
      } else {
        nome = linha.trim();
        autor = undefined;
      }

      if (nome) {
        const result = db
          .prepare('INSERT INTO repertoire_items (regional_id, nome, autor) VALUES (?, ?, ?)')
          .run(regionalId, nome, autor || null);

        const item = await this.findById(result.lastInsertRowid as number);
        if (item) {
          items.push(item);
        }
      }
    }

    return {
      items,
      total: items.length,
    };
  }
}

// Singleton exportado
export const repertoireService = new RepertoireService();
