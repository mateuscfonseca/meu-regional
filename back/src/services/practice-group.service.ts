/**
 * Practice Group Service - Serviço para controle de práticas em grupo (ensaios)
 *
 * Gerencia estatísticas e histórico de ensaios (tipo='grupo' em study_logs)
 */

import { getDb } from '../db-provider';

export interface GroupPracticeStats {
  total_ensaios: number;
  musicas_mais_ensaiadas: { nome: string; autor: string | null; total_ensaios: number }[];
  // Frequência por período
  ensaios_na_semana: number;
  ensaios_no_mes: number;
  ensaios_no_trimestre: number;
  ensaios_no_semestre: number;
  ensaios_no_ano: number;
  musicas_diferentes_ensaiadas_semana: number;
  musicas_diferentes_ensaiadas_mes: number;
  // Último ensaio
  ultimo_ensaio: {
    data: string;
    musicas_count: number;
  } | null;
}

export interface GroupPracticeLog {
  id: number;
  member_id: number;
  repertoire_item_id: number;
  tipo: 'grupo';
  duracao_minutos: number | null;
  notas: string | null;
  data: string;
  estudado_em: string;
  musica_nome: string;
  autor: string | null;
  membro_nome: string;
}

export interface PracticeByDate {
  data: string;
  total_estudos: number;
  musicas: {
    id: number;
    nome: string;
    autor: string | null;
    membro_nome: string;
    duracao_minutos: number | null;
    notas: string | null;
  }[];
}

export class PracticeGroupService {
  private db: any;

  constructor() {
    this.db = getDb();
  }

  /**
   * Busca estatísticas de práticas em grupo de um membro
   */
  async getGroupStats(memberId: number): Promise<GroupPracticeStats> {
    // Total de ensaios (estudos em grupo)
    const totalEnsaios = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND tipo = 'grupo'")
      .get(memberId) as { total: number };

    // Músicas mais ensaiadas
    const musicasMaisEnsaiadas = this.db
      .prepare(`
        SELECT r.nome, r.autor, COUNT(*) as total_ensaios
        FROM study_logs sl
        JOIN repertoire_items r ON sl.repertoire_item_id = r.id
        WHERE sl.member_id = ? AND sl.tipo = 'grupo'
        GROUP BY sl.repertoire_item_id
        ORDER BY total_ensaios DESC
        LIMIT 10
      `)
      .all(memberId) as { nome: string; autor: string | null; total_ensaios: number }[];

    // Ensaios na semana (últimos 7 dias)
    const ensaiosNaSemana = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND tipo = 'grupo' AND data >= date('now', '-7 days')")
      .get(memberId) as { total: number };

    // Ensaios no mês (últimos 30 dias)
    const ensaiosNoMes = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND tipo = 'grupo' AND data >= date('now', '-30 days')")
      .get(memberId) as { total: number };

    // Ensaios no trimestre (últimos 90 dias)
    const ensaiosNoTrimestre = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND tipo = 'grupo' AND data >= date('now', '-90 days')")
      .get(memberId) as { total: number };

    // Ensaios no semestre (últimos 180 dias)
    const ensaiosNoSemestre = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND tipo = 'grupo' AND data >= date('now', '-180 days')")
      .get(memberId) as { total: number };

    // Ensaios no ano (últimos 365 dias)
    const ensaiosNoAno = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND tipo = 'grupo' AND data >= date('now', '-365 days')")
      .get(memberId) as { total: number };

    // Músicas diferentes ensaiadas na semana
    const musicasDiferentesSemana = this.db
      .prepare("SELECT COUNT(DISTINCT repertoire_item_id) as total FROM study_logs WHERE member_id = ? AND tipo = 'grupo' AND data >= date('now', '-7 days')")
      .get(memberId) as { total: number };

    // Músicas diferentes ensaiadas no mês
    const musicasDiferentesMes = this.db
      .prepare("SELECT COUNT(DISTINCT repertoire_item_id) as total FROM study_logs WHERE member_id = ? AND tipo = 'grupo' AND data >= date('now', '-30 days')")
      .get(memberId) as { total: number };

    // Último ensaio
    const ultimoEnsaio = this.db
      .prepare(`
        SELECT data, COUNT(*) as musicas_count
        FROM study_logs
        WHERE member_id = ? AND tipo = 'grupo'
        GROUP BY data
        ORDER BY data DESC
        LIMIT 1
      `)
      .get(memberId) as { data: string; musicas_count: number } | undefined;

    return {
      total_ensaios: totalEnsaios.total,
      musicas_mais_ensaiadas: musicasMaisEnsaiadas,
      ensaios_na_semana: ensaiosNaSemana.total,
      ensaios_no_mes: ensaiosNoMes.total,
      ensaios_no_trimestre: ensaiosNoTrimestre.total,
      ensaios_no_semestre: ensaiosNoSemestre.total,
      ensaios_no_ano: ensaiosNoAno.total,
      musicas_diferentes_ensaiadas_semana: musicasDiferentesSemana.total,
      musicas_diferentes_ensaiadas_mes: musicasDiferentesMes.total,
      ultimo_ensaio: ultimoEnsaio ? {
        data: ultimoEnsaio.data,
        musicas_count: ultimoEnsaio.musicas_count,
      } : null,
    };
  }

  /**
   * Lista logs de práticas em grupo de um membro
   */
  async getGroupLogs(memberId: number, limit: number = 100): Promise<GroupPracticeLog[]> {
    return this.db
      .prepare(`
        SELECT sl.*, r.nome as musica_nome, r.autor, m.nome as membro_nome
        FROM study_logs sl
        JOIN repertoire_items r ON sl.repertoire_item_id = r.id
        JOIN members m ON sl.member_id = m.id
        WHERE sl.member_id = ? AND sl.tipo = 'grupo'
        ORDER BY sl.data DESC, sl.estudado_em DESC
        LIMIT ?
      `)
      .all(memberId, limit) as GroupPracticeLog[];
  }

  /**
   * Busca práticas de um membro em uma data específica
   */
  async getPracticesByDate(memberId: number, date: string): Promise<PracticeByDate> {
    // Total de estudos na data
    const totalEstudos = this.db
      .prepare("SELECT COUNT(*) as total FROM study_logs WHERE member_id = ? AND data = ?")
      .get(memberId, date) as { total: number };

    // Músicas praticadas na data
    const musicas = this.db
      .prepare(`
        SELECT r.id, r.nome, r.autor, m.nome as membro_nome, sl.duracao_minutos, sl.notas
        FROM study_logs sl
        JOIN repertoire_items r ON sl.repertoire_item_id = r.id
        JOIN members m ON sl.member_id = m.id
        WHERE sl.member_id = ? AND sl.data = ?
        ORDER BY sl.estudado_em DESC
      `)
      .all(memberId, date) as {
        id: number;
        nome: string;
        autor: string | null;
        membro_nome: string;
        duracao_minutos: number | null;
        notas: string | null;
      }[];

    return {
      data: date,
      total_estudos: totalEstudos.total,
      musicas,
    };
  }
}

// Singleton
export const practiceGroupService = new PracticeGroupService();
