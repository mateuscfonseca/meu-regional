/**
 * Study Logs Service - Lógica de negócio de estudos
 * 
 * Encapsula toda a lógica de registro e estatísticas de estudos
 */

import { getDb } from '../db-provider';

export interface StudyLog {
  id: number;
  member_id: number;
  repertoire_item_id: number;
  tipo: 'individual' | 'grupo';
  duracao_minutos: number | null;
  notas: string | null;
  data: string;
  estudado_em: string;
  musica_nome: string;
  autor: string | null;
  membro_nome?: string;
}

export interface StudyStats {
  total_estudos: number;
  tempo_total_minutos: number;
  estudos_por_tipo: { tipo: string; total: number }[];
  musicas_mais_estudadas: { nome: string; autor: string | null; total_estudos: number }[];
  // Frequência por período
  estudos_na_semana: number;
  estudos_no_mes: number;
  estudos_no_trimestre: number;
  estudos_no_semestre: number;
  estudos_no_ano: number;
  musicas_diferentes_estudadas_semana: number;
  musicas_diferentes_estudadas_mes: number;
}

export interface CreateStudyLogInput {
  member_id: number;
  repertoire_item_id: number;
  tipo: 'individual' | 'grupo';
  duracao_minutos?: number;
  notas?: string;
  data?: string;
}

export class StudyLogsService {
  private db: any;

  constructor() {
    this.db = getDb();
  }

  /**
   * Lista logs de estudo de um membro
   */
  async findByMember(memberId: number, limit: number = 100): Promise<StudyLog[]> {
    return this.db
      .prepare(`
        SELECT sl.*, r.nome as musica_nome, r.autor
        FROM study_logs sl
        JOIN repertoire_items r ON sl.repertoire_item_id = r.id
        WHERE sl.member_id = ?
        ORDER BY sl.estudado_em DESC
        LIMIT ?
      `)
      .all(memberId, limit) as StudyLog[];
  }

  /**
   * Lista logs de estudo de uma música
   */
  async findByRepertoire(repertoireId: number, limit: number = 100): Promise<StudyLog[]> {
    return this.db
      .prepare(`
        SELECT sl.*, m.nome as membro_nome, r.nome as musica_nome, r.autor
        FROM study_logs sl
        JOIN members m ON sl.member_id = m.id
        JOIN repertoire_items r ON sl.repertoire_item_id = r.id
        WHERE sl.repertoire_item_id = ?
        ORDER BY sl.data DESC, sl.estudado_em DESC
        LIMIT ?
      `)
      .all(repertoireId, limit) as StudyLog[];
  }

  /**
   * Cria log de estudo
   */
  async create(input: CreateStudyLogInput): Promise<StudyLog> {
    const result = this.db
      .prepare(`
        INSERT INTO study_logs (member_id, repertoire_item_id, tipo, duracao_minutos, notas, data)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.member_id,
        input.repertoire_item_id,
        input.tipo,
        input.duracao_minutos || null,
        input.notas || null,
        input.data || new Date().toISOString().split('T')[0]
      );

    const log = this.db
      .prepare('SELECT * FROM study_logs WHERE id = ?')
      .get(result.lastInsertRowid) as StudyLog;

    // Adicionar nome da música
    const item = this.db
      .prepare('SELECT nome, autor FROM repertoire_items WHERE id = ?')
      .get(input.repertoire_item_id) as { nome: string; autor: string | null };

    return {
      ...log,
      musica_nome: item.nome,
      autor: item.autor,
    };
  }

  /**
   * Busca estatísticas de estudo de um membro
   */
  async getStats(memberId: number): Promise<StudyStats> {
    // Total de estudos
    const totalEstudos = this.db
      .prepare('SELECT COUNT(*) as total FROM study_logs WHERE member_id = ?')
      .get(memberId) as { total: number };

    // Tempo total estudado
    const tempoTotal = this.db
      .prepare('SELECT COALESCE(SUM(duracao_minutos), 0) as total FROM study_logs WHERE member_id = ? AND duracao_minutos IS NOT NULL')
      .get(memberId) as { total: number };

    // Estudos por tipo
    const estudosPorTipo = this.db
      .prepare(`
        SELECT tipo, COUNT(*) as total
        FROM study_logs
        WHERE member_id = ?
        GROUP BY tipo
      `)
      .all(memberId) as { tipo: string; total: number }[];

    // Músicas mais estudadas
    const musicasMaisEstudadas = this.db
      .prepare(`
        SELECT r.nome, r.autor, COUNT(*) as total_estudos
        FROM study_logs sl
        JOIN repertoire_items r ON sl.repertoire_item_id = r.id
        WHERE sl.member_id = ?
        GROUP BY sl.repertoire_item_id
        ORDER BY total_estudos DESC
        LIMIT 10
      `)
      .all(memberId) as { nome: string; autor: string | null; total_estudos: number }[];

    // Estudos na semana (últimos 7 dias)
    const estudosNaSemana = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND data >= date('now', '-7 days')")
      .get(memberId) as { total: number };

    // Estudos no mês (últimos 30 dias)
    const estudosNoMes = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND data >= date('now', '-30 days')")
      .get(memberId) as { total: number };

    // Estudos no trimestre (últimos 90 dias)
    const estudosNoTrimestre = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND data >= date('now', '-90 days')")
      .get(memberId) as { total: number };

    // Estudos no semestre (últimos 180 dias)
    const estudosNoSemestre = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND data >= date('now', '-180 days')")
      .get(memberId) as { total: number };

    // Estudos no ano (últimos 365 dias)
    const estudosNoAno = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND data >= date('now', '-365 days')")
      .get(memberId) as { total: number };

    // Músicas diferentes estudadas na semana
    const musicasDiferentesSemana = this.db
      .prepare("SELECT COUNT(DISTINCT repertoire_item_id) as total FROM study_logs WHERE member_id = ? AND data >= date('now', '-7 days')")
      .get(memberId) as { total: number };

    // Músicas diferentes estudadas no mês
    const musicasDiferentesMes = this.db
      .prepare("SELECT COUNT(DISTINCT repertoire_item_id) as total FROM study_logs WHERE member_id = ? AND data >= date('now', '-30 days')")
      .get(memberId) as { total: number };

    return {
      total_estudos: totalEstudos.total,
      tempo_total_minutos: tempoTotal.total,
      estudos_por_tipo: estudosPorTipo,
      musicas_mais_estudadas: musicasMaisEstudadas,
      estudos_na_semana: estudosNaSemana.total,
      estudos_no_mes: estudosNoMes.total,
      estudos_no_trimestre: estudosNoTrimestre.total,
      estudos_no_semestre: estudosNoSemestre.total,
      estudos_no_ano: estudosNoAno.total,
      musicas_diferentes_estudadas_semana: musicasDiferentesSemana.total,
      musicas_diferentes_estudadas_mes: musicasDiferentesMes.total,
    };
  }
}

// Singleton exportado
export const studyLogsService = new StudyLogsService();
