/**
 * Migration Runner para Testes
 *
 * Aplica todas as migrations em um banco de dados de teste
 * Importa as migrations originais para evitar duplicação
 */

import type { Database } from 'bun:sqlite';
import * as migration001 from '../../migrations/001-initial-schema';
import * as migration004 from '../../migrations/004-add-practice-fields';
import * as migration005 from '../../migrations/005-member-repertoire-and-practice-logs';
import * as migration006 from '../../migrations/006-study-logs-data-and-tonalidade-modo';

const migrations = [
  { name: '001-initial-schema', up: migration001.up },
  { name: '004-add-practice-fields', up: migration004.up },
  { name: '005-member-repertoire-and-practice-logs', up: migration005.up },
  { name: '006-study-logs-data-and-tonalidade-modo', up: migration006.up },
];

/**
 * Aplica todas as migrations em um banco de dados
 */
export async function runMigrations(db: Database): Promise<void> {
  // Criar tabela de migrations se não existir
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Aplicar cada migration
  for (const migration of migrations) {
    // Verificar se já foi aplicada
    const exists = db.prepare('SELECT 1 FROM migrations WHERE name = ?').get(migration.name);
    
    if (!exists) {
      await migration.up(db);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
    }
  }
}

/**
 * Reseta todas as tabelas do banco de dados
 */
export function resetDatabase(db: Database): void {
  db.exec(`DROP TABLE IF EXISTS selection_results`);
  db.exec(`DROP TABLE IF EXISTS selection_votes`);
  db.exec(`DROP TABLE IF EXISTS selections`);
  db.exec(`DROP TABLE IF EXISTS study_logs`);
  db.exec(`DROP TABLE IF EXISTS repertoire_items`);
  db.exec(`DROP TABLE IF EXISTS members`);
  db.exec(`DROP TABLE IF EXISTS regionais`);
  db.exec(`DROP TABLE IF EXISTS migrations`);
}
