/**
 * Selections Service - Lógica de negócio de seleções
 * 
 * Encapsula toda a lógica de CRUD de seleções e votação
 */

import { getDb } from '../db-provider';

export interface Selection {
  id: number;
  regional_id: number;
  nome: string;
  descricao: string | null;
  data_evento: string | null;
  max_musicas: number;
  criada_por: number;
  status: 'votacao' | 'finalizada';
  criado_em: string;
  atualizado_em: string;
  criadora_nome?: string;
}

export interface SelectionVote {
  repertoire_item_id: number;
  musica_nome: string;
  autor: string | null;
  total_votos: number;
}

export interface SelectionResult {
  repertoire_item_id: number;
  posicao: number;
  musica_nome: string;
  autor: string | null;
  total_votos: number;
}

export interface SelectionDetail {
  selection: Selection;
  votes: SelectionVote[];
  results: SelectionResult[];
}

export interface CreateSelectionInput {
  regional_id: number;
  nome: string;
  descricao?: string;
  data_evento?: string;
  max_musicas?: number;
  criada_por: number;
}

export interface VoteInput {
  selection_id: number;
  member_id: number;
  repertoire_item_id: number;
}

export class SelectionsService {
  private db: any;

  constructor() {
    this.db = getDb();
  }

  /**
   * Lista todas as seleções de uma regional
   */
  async findByRegional(regionalId: number): Promise<Selection[]> {
    return this.db
      .prepare(`
        SELECT s.*, m.nome as criadora_nome
        FROM selections s
        LEFT JOIN members m ON s.criada_por = m.id
        WHERE s.regional_id = ?
        ORDER BY criado_em DESC
      `)
      .all(regionalId) as Selection[];
  }

  /**
   * Busca seleção por ID com detalhes
   */
  async findDetailById(id: number): Promise<SelectionDetail | null> {
    const selection = this.db
      .prepare(`
        SELECT s.*, m.nome as criadora_nome
        FROM selections s
        LEFT JOIN members m ON s.criada_por = m.id
        WHERE s.id = ?
      `)
      .get(id) as Selection | undefined;

    if (!selection) {
      return null;
    }

    // Obter votos da seleção
    const votes = this.db
      .prepare(`
        SELECT sv.repertoire_item_id, r.nome as musica_nome, r.autor, COUNT(*) as total_votos
        FROM selection_votes sv
        JOIN repertoire_items r ON sv.repertoire_item_id = r.id
        WHERE sv.selection_id = ?
        GROUP BY sv.repertoire_item_id
        ORDER BY total_votos DESC
      `)
      .all(id) as SelectionVote[];

    // Obter resultado final (se houver)
    const results = this.db
      .prepare(`
        SELECT sr.repertoire_item_id, sr.posicao, r.nome as musica_nome, r.autor, sr.total_votos
        FROM selection_results sr
        JOIN repertoire_items r ON sr.repertoire_item_id = r.id
        WHERE sr.selection_id = ?
        ORDER BY sr.posicao
      `)
      .all(id) as SelectionResult[];

    return {
      selection,
      votes,
      results,
    };
  }

  /**
   * Cria nova seleção
   */
  async create(input: CreateSelectionInput): Promise<Selection> {
    const result = this.db
      .prepare(`
        INSERT INTO selections (regional_id, nome, descricao, data_evento, max_musicas, criada_por)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.regional_id,
        input.nome,
        input.descricao || null,
        input.data_evento || null,
        input.max_musicas || 30,
        input.criada_por
      );

    const selection = this.db
      .prepare('SELECT * FROM selections WHERE id = ?')
      .get(result.lastInsertRowid) as Selection;

    return selection;
  }

  /**
   * Registra voto em uma música
   */
  async vote(input: VoteInput): Promise<void> {
    // Verificar se seleção existe
    const selection = this.db
      .prepare('SELECT * FROM selections WHERE id = ?')
      .get(input.selection_id) as Selection | undefined;

    if (!selection) {
      throw new Error('Seleção não encontrada');
    }

    // Verificar se votação ainda está aberta
    if (selection.status !== 'votacao') {
      throw new Error('Votação já foi finalizada');
    }

    // Verificar se item do repertório existe
    const item = this.db
      .prepare('SELECT * FROM repertoire_items WHERE id = ?')
      .get(input.repertoire_item_id);

    if (!item) {
      throw new Error('Item do repertório não encontrado');
    }

    // Verificar se já votou nesta música
    const existingVote = this.db
      .prepare('SELECT id FROM selection_votes WHERE selection_id = ? AND member_id = ? AND repertoire_item_id = ?')
      .get(input.selection_id, input.member_id, input.repertoire_item_id);

    if (existingVote) {
      throw new Error('Você já votou nesta música');
    }

    // Registrar voto
    this.db
      .prepare('INSERT INTO selection_votes (selection_id, member_id, repertoire_item_id) VALUES (?, ?, ?)')
      .run(input.selection_id, input.member_id, input.repertoire_item_id);
  }

  /**
   * Remove voto
   */
  async removeVote(selectionId: number, memberId: number, repertoireItemId: number): Promise<void> {
    this.db
      .prepare('DELETE FROM selection_votes WHERE selection_id = ? AND member_id = ? AND repertoire_item_id = ?')
      .run(selectionId, memberId, repertoireItemId);
  }

  /**
   * Finaliza seleção (calcula mais votadas)
   */
  async finalize(selectionId: number, maxMusicas?: number): Promise<number> {
    const selection = this.db
      .prepare('SELECT * FROM selections WHERE id = ?')
      .get(selectionId) as Selection | undefined;

    if (!selection) {
      throw new Error('Seleção não encontrada');
    }

    if (selection.status === 'finalizada') {
      throw new Error('Seleção já foi finalizada');
    }

    const limite = maxMusicas || selection.max_musicas;

    // Obter músicas mais votadas
    const topMusicas = this.db
      .prepare(`
        SELECT repertoire_item_id, COUNT(*) as total_votos
        FROM selection_votes
        WHERE selection_id = ?
        GROUP BY repertoire_item_id
        ORDER BY total_votos DESC, repertoire_item_id ASC
        LIMIT ?
      `)
      .all(selectionId, limite) as { repertoire_item_id: number; total_votos: number }[];

    // Inserir resultados
    const insertResult = this.db.prepare(
      'INSERT INTO selection_results (selection_id, repertoire_item_id, posicao, total_votos) VALUES (?, ?, ?, ?)'
    );

    this.db.prepare('BEGIN TRANSACTION').run();

    try {
      // Limpar resultados anteriores se houver
      this.db.prepare('DELETE FROM selection_results WHERE selection_id = ?').run(selectionId);

      for (let i = 0; i < topMusicas.length; i++) {
        insertResult.run(selectionId, topMusicas[i].repertoire_item_id, i + 1, topMusicas[i].total_votos);
      }

      // Atualizar status da seleção
      this.db.prepare("UPDATE selections SET status = 'finalizada' WHERE id = ?").run(selectionId);

      this.db.prepare('COMMIT').run();

      return topMusicas.length;
    } catch (error) {
      this.db.prepare('ROLLBACK').run();
      throw error;
    }
  }

  /**
   * Reabre votação
   */
  async reopen(selectionId: number): Promise<void> {
    const selection = this.db
      .prepare('SELECT * FROM selections WHERE id = ?')
      .get(selectionId) as Selection | undefined;

    if (!selection) {
      throw new Error('Seleção não encontrada');
    }

    this.db.prepare("UPDATE selections SET status = 'votacao' WHERE id = ?").run(selectionId);
    this.db.prepare('DELETE FROM selection_results WHERE selection_id = ?').run(selectionId);
  }
}

// Singleton exportado
export const selectionsService = new SelectionsService();
