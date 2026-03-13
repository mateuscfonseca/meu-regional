/**
 * Migration 006: Study Logs Data and Tonalidade Modo
 *
 * 1. Adiciona campo 'data' em study_logs para permitir registro de estudos anteriores
 * 2. Adiciona campo 'tonalidade_modo' em repertoire_items para diferenciar maior/menor
 */

import type { Database } from 'bun:sqlite';

export const name = 'Study Logs Data and Tonalidade Modo';

export async function up(db: Database): Promise<void> {
  // ============================================
  // 1. Adicionar campo 'data' em study_logs
  // ============================================
  // Campo data para permitir registro de estudos anteriores
  // SQLite não permite default dinâmico em ALTER TABLE, então usamos NULL e atualizamos depois
  db.run(`
    ALTER TABLE study_logs
    ADD COLUMN data DATE
  `);

  // Criar índice para otimizar buscas por data
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_study_logs_data
    ON study_logs(data DESC)
  `);

  // ============================================
  // 2. Adicionar campo 'tonalidade_modo' em repertoire_items
  // ============================================
  // Permite diferenciar entre tonalidade maior e menor
  // Ex: C-maior (Dó Maior), C-menor (Dó menor)
  db.run(`
    ALTER TABLE repertoire_items
    ADD COLUMN tonalidade_modo TEXT DEFAULT 'maior'
  `);

  // ============================================
  // 3. Migrar dados existentes (se houver)
  // ============================================
  // Copiar data de 'estudado_em' para 'data' nos registros existentes
  db.run(`
    UPDATE study_logs
    SET data = date(estudado_em)
    WHERE data IS NULL
  `);
}

export async function down(db: Database): Promise<void> {
  // ============================================
  // Remover índices
  // ============================================
  db.run(`DROP INDEX IF EXISTS idx_study_logs_data`);

  // ============================================
  // Remover colunas (SQLite moderno suporta DROP COLUMN)
  // ============================================
  db.run(`ALTER TABLE study_logs DROP COLUMN data`);
  db.run(`ALTER TABLE repertoire_items DROP COLUMN tonalidade_modo`);
}
