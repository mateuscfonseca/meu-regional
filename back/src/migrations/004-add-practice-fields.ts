/**
 * Migration 004: Add Practice Fields
 *
 * Adiciona campos de caracterização GERAL das músicas no repertório
 * (campos que todos os membros podem ver/editar)
 */

import type { Database } from 'bun:sqlite';

export const name = 'Add Practice Fields - Add general characterization fields to repertoire_items';

export async function up(db: Database): Promise<void> {
  // Adicionar campos de caracterização GERAL em repertoire_items
  // Estes campos são visíveis e editáveis por todos os membros
  
  db.run(`
    ALTER TABLE repertoire_items
    ADD COLUMN tonalidade TEXT
  `);

  db.run(`
    ALTER TABLE repertoire_items
    ADD COLUMN notas TEXT
  `);

  db.run(`
    ALTER TABLE repertoire_items
    ADD COLUMN tem_introducao BOOLEAN DEFAULT 0
  `);

  db.run(`
    ALTER TABLE repertoire_items
    ADD COLUMN tem_tercas BOOLEAN DEFAULT 0
  `);

  db.run(`
    ALTER TABLE repertoire_items
    ADD COLUMN tem_arranjo_6_cordas BOOLEAN DEFAULT 0
  `);

  // Nota: Campos específicos por usuário (nivel_fluencia, introducao_aprendida, etc.)
  // foram movidos para a tabela member_repertoire na migration 005
}

export async function down(db: Database): Promise<void> {
  // Remover colunas (SQLite moderno suporta DROP COLUMN)
  db.run(`ALTER TABLE repertoire_items DROP COLUMN tonalidade`);
  db.run(`ALTER TABLE repertoire_items DROP COLUMN notas`);
  db.run(`ALTER TABLE repertoire_items DROP COLUMN tem_introducao`);
  db.run(`ALTER TABLE repertoire_items DROP COLUMN tem_tercas`);
  db.run(`ALTER TABLE repertoire_items DROP COLUMN tem_arranjo_6_cordas`);
}
