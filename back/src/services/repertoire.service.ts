/**
 * Repertoire Service - Lógica de negócio de repertório
 *
 * Encapsula toda a lógica de CRUD de itens do repertório
 */

import { getDb } from '../db-provider';

/**
 * Item do repertório (dados gerais - visíveis para todos)
 * Campos em repertoire_items
 */
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
  // Campos de prática (caracterização geral da música)
  tonalidade: string | null;
  tonalidade_modo: string | null;
  notas: string | null;
  tem_introducao: boolean;
  tem_tercas: boolean;
  tem_arranjo_6_cordas: boolean;
}

/**
 * Dados de proficiência do usuário em relação a um item do repertório
 * Campos em member_repertoire
 */
export interface MemberRepertoireData {
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

/**
 * Item do repertório com dados de proficiência do membro
 */
export interface RepertoireItemWithMemberData extends RepertoireItem {
  member_data?: MemberRepertoireData & {
    ultima_pratica?: string | null;
  };
}

export interface CreateRepertoireItemInput {
  regional_id: number;
  nome: string;
  autor?: string;
  descricao?: string;
  links?: string[];
  metadados?: Record<string, any>;
  // Campos de prática (caracterização geral - repertoire_items)
  tonalidade?: string;
  tonalidade_modo?: string;
  notas?: string;
  tem_introducao?: boolean;
  tem_tercas?: boolean;
  tem_arranjo_6_cordas?: boolean;
}

export interface UpdateRepertoireItemInput {
  nome?: string;
  autor?: string;
  descricao?: string;
  links?: string[];
  metadados?: Record<string, any>;
  // Campos de prática (caracterização geral - repertoire_items)
  tonalidade?: string;
  tonalidade_modo?: string;
  notas?: string;
  tem_introducao?: boolean;
  tem_tercas?: boolean;
  tem_arranjo_6_cordas?: boolean;
}

export interface FindByRegionalFilters {
  memberId?: number;
  nao_praticadas_ha?: number;
  nivel_fluencia?: string;
  tem_introducao?: boolean;
  introducao_aprendida?: boolean;
  tercas_aprendidas?: boolean;
  arranjo_6_cordas_aprendido?: boolean;
}

export interface ImportResult {
  items: RepertoireItem[];
  total: number;
}

export class RepertoireService {
  /**
   * Lista itens do repertório de uma regional com filtros opcionais
   */
  async findByRegionalWithFilters(regionalId: number, filters: FindByRegionalFilters = {}): Promise<RepertoireItemWithMemberData[]> {
    const { memberId, nao_praticadas_ha, nivel_fluencia, tem_introducao, introducao_aprendida, tercas_aprendidas, arranjo_6_cordas_aprendido } = filters;
    
    // Buscar dados com ou sem member_id
    let items: RepertoireItemWithMemberData[];
    
    if (memberId) {
      items = await this.findByRegionalWithMemberData(regionalId, memberId);
    } else {
      const rawItems = await this.findByRegional(regionalId);
      items = rawItems.map(item => ({ ...item }));
    }

    // Aplicar filtros
    return items.filter(item => {
      // Filtro por tem_introducao (campo geral da música)
      if (tem_introducao !== undefined) {
        if (item.tem_introducao !== tem_introducao) return false;
      }

      // Filtros de proficiência do membro
      const memberData = item.member_data;
      
      if (memberData) {
        // Filtro por nivel_fluencia
        if (nivel_fluencia) {
          const niveis = nivel_fluencia.split(',');
          if (!niveis.includes(memberData.nivel_fluencia)) return false;
        }

        // Filtro por introducao_aprendida
        if (introducao_aprendida !== undefined) {
          if (memberData.introducao_aprendida !== introducao_aprendida) return false;
        }

        // Filtro por tercas_aprendidas
        if (tercas_aprendidas !== undefined) {
          if (memberData.tercas_aprendidas !== tercas_aprendidas) return false;
        }

        // Filtro por arranjo_6_cordas_aprendido
        if (arranjo_6_cordas_aprendido !== undefined) {
          if (memberData.arranjo_6_cordas_aprendido !== arranjo_6_cordas_aprendido) return false;
        }

        // Filtro por nao_praticadas_ha (dias)
        if (nao_praticadas_ha !== undefined && memberData.ultima_pratica) {
          const dataUltimaPratica = new Date(memberData.ultima_pratica);
          const dataLimite = new Date();
          dataLimite.setDate(dataLimite.getDate() - nao_praticadas_ha);
          if (dataUltimaPratica > dataLimite) return false;
        }
      }

      return true;
    });
  }

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
   * Lista itens do repertório de uma regional com dados de proficiência do membro
   */
  async findByRegionalWithMemberData(regionalId: number, memberId: number): Promise<RepertoireItemWithMemberData[]> {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT
          ri.id, ri.regional_id, ri.nome, ri.autor, ri.descricao, ri.links, ri.metadados,
          ri.tonalidade, ri.tonalidade_modo, ri.notas,
          ri.tem_introducao, ri.tem_tercas, ri.tem_arranjo_6_cordas,
          ri.criado_em, ri.atualizado_em,
          COALESCE(mr.nivel_fluencia, 'precisa_aprender') as nivel_fluencia,
          COALESCE(mr.introducao_aprendida, 0) as introducao_aprendida,
          COALESCE(mr.tercas_aprendidas, 0) as tercas_aprendidas,
          COALESCE(mr.arranjo_6_cordas_aprendido, 0) as arranjo_6_cordas_aprendido,
          COALESCE(mr.notas_pessoais, NULL) as notas_pessoais,
          mr.criado_em as member_criado_em,
          mr.atualizado_em as member_atualizado_em,
          (
            SELECT MAX(sl.estudado_em)
            FROM study_logs sl
            WHERE sl.repertoire_item_id = ri.id
              AND sl.member_id = ?
          ) as ultima_pratica
        FROM repertoire_items ri
        LEFT JOIN member_repertoire mr
          ON mr.repertoire_item_id = ri.id
          AND mr.member_id = ?
        WHERE ri.regional_id = ?
        ORDER BY ri.nome ASC
      `)
      .all(memberId, memberId, regionalId) as any[];

    return rows.map(row => {
      const item: RepertoireItemWithMemberData = {
        id: row.id,
        regional_id: row.regional_id,
        nome: row.nome,
        autor: row.autor,
        descricao: row.descricao,
        links: row.links ? (typeof row.links === 'string' ? JSON.parse(row.links) : row.links) : null,
        metadados: row.metadados ? (typeof row.metadados === 'string' ? JSON.parse(row.metadados) : row.metadados) : null,
        tonalidade: row.tonalidade,
        tonalidade_modo: row.tonalidade_modo,
        notas: row.notas,
        tem_introducao: Boolean(row.tem_introducao),
        tem_tercas: Boolean(row.tem_tercas),
        tem_arranjo_6_cordas: Boolean(row.tem_arranjo_6_cordas),
        criado_em: row.criado_em,
        atualizado_em: row.atualizado_em,
        member_data: {
          id: row.id,
          member_id: memberId,
          repertoire_item_id: row.id,
          nivel_fluencia: row.nivel_fluencia,
          introducao_aprendida: Boolean(row.introducao_aprendida),
          tercas_aprendidas: Boolean(row.tercas_aprendidas),
          arranjo_6_cordas_aprendido: Boolean(row.arranjo_6_cordas_aprendido),
          notas_pessoais: row.notas_pessoais,
          ultima_pratica: row.ultima_pratica,
          criado_em: row.member_criado_em,
          atualizado_em: row.member_atualizado_em,
        },
      };
      return item;
    });
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
          tonalidade, tonalidade_modo, notas, tem_introducao, tem_tercas, tem_arranjo_6_cordas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        input.tem_arranjo_6_cordas ? 1 : 0
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

  /**
   * Busca sugestões de músicas por nome
   */
  async findSuggestions(regionalId: number, query: string, limit: number): Promise<{ id: number; nome: string; autor: string | null; label: string }[]> {
    const db = getDb();
    const searchPattern = `%${query}%`;

    const rows = db.prepare(`
      SELECT id, nome, autor
      FROM repertoire_items
      WHERE regional_id = ?
        AND nome LIKE ?
      ORDER BY nome
      LIMIT ?
    `).all(regionalId, searchPattern, limit) as { id: number; nome: string; autor: string | null }[];

    return rows.map(row => ({
      id: row.id,
      nome: row.nome,
      autor: row.autor,
      label: `${row.nome}${row.autor ? ` - ${row.autor}` : ''}`,
    }));
  }
}

// Singleton exportado
export const repertoireService = new RepertoireService();
