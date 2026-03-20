/**
 * Practice Calendar Service - Serviço para calendário de práticas
 *
 * Fornece dados para exibição de calendário com dias que tiveram ensaios
 */

import { getDb } from '../db-provider';

export interface CalendarDayData {
  day: number;
  has_practice: boolean;
  practice_count: number;
  is_today: boolean;
}

export interface CalendarMonthData {
  year: number;
  month: number; // 1-12
  days: CalendarDayData[];
}

export class PracticeCalendarService {
  private db: any;

  constructor() {
    this.db = getDb();
  }

  /**
   * Busca dados do calendário de práticas em grupo para um mês específico
   * Retorna apenas dias que tiveram práticas (tipo='grupo')
   */
  async getCalendarData(memberId: number, year: number, month: number): Promise<CalendarMonthData> {
    // Primeiros e últimos dias do mês
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    
    // Último dia do mês
    const lastDayQuery = this.db
      .prepare("SELECT date(?, '+1 month', '-1 day') as last_day")
      .get(firstDay) as { last_day: string };
    
    const lastDay = lastDayQuery.last_day;
    const lastDayNum = parseInt(lastDay.split('-')[2]);

    // Buscar dias com práticas em grupo no mês
    const practicesQuery = this.db
      .prepare(`
        SELECT 
          CAST(strftime('%d', data) AS INTEGER) as day,
          COUNT(*) as practice_count
        FROM study_logs
        WHERE member_id = ? 
          AND tipo = 'grupo'
          AND data >= ?
          AND data <= ?
        GROUP BY day
        ORDER BY day
      `)
      .all(memberId, firstDay, lastDay) as { day: number; practice_count: number }[];

    // Criar mapa de dias com práticas
    const practiceDaysMap = new Map<number, number>();
    practicesQuery.forEach(p => {
      practiceDaysMap.set(p.day, p.practice_count);
    });

    // Obter data de hoje para marcar o dia atual
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const todayDay = isCurrentMonth ? today.getDate() : 0;

    // Gerar todos os dias do mês
    const days: CalendarDayData[] = [];
    for (let day = 1; day <= lastDayNum; day++) {
      const practiceCount = practiceDaysMap.get(day) || 0;
      days.push({
        day,
        has_practice: practiceCount > 0,
        practice_count: practiceCount,
        is_today: day === todayDay,
      });
    }

    return {
      year,
      month,
      days,
    };
  }

  /**
   * Busca práticas de uma data específica (usada ao clicar no dia do calendário)
   * Retorna todas as práticas (individual e grupo) da data
   */
  async getPracticesByDate(memberId: number, date: string) {
    const practices = this.db
      .prepare(`
        SELECT 
          sl.*,
          r.nome as musica_nome,
          r.autor,
          m.nome as membro_nome
        FROM study_logs sl
        JOIN repertoire_items r ON sl.repertoire_item_id = r.id
        JOIN members m ON sl.member_id = m.id
        WHERE sl.member_id = ? AND sl.data = ?
        ORDER BY sl.estudado_em DESC
      `)
      .all(memberId, date) as {
        id: number;
        tipo: 'individual' | 'grupo';
        duracao_minutos: number | null;
        notas: string | null;
        musica_nome: string;
        autor: string | null;
        membro_nome: string;
      }[];

    return practices;
  }
}

// Singleton
export const practiceCalendarService = new PracticeCalendarService();
