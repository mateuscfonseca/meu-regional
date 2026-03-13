/**
 * Migration 001: Initial Schema
 * 
 * Cria todas as tabelas iniciais do banco de dados
 */

import type { Database } from 'bun:sqlite';

export const name = 'Initial Schema - Creates all initial tables';

export async function up(db: Database): Promise<void> {
  // Tabela de regionais
  db.run(`
    CREATE TABLE IF NOT EXISTS regionais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de membros
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      regional_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      instrumento TEXT NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (regional_id) REFERENCES regionais(id) ON DELETE CASCADE
    )
  `);

  // Tabela de itens do repertório
  db.run(`
    CREATE TABLE IF NOT EXISTS repertoire_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      regional_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      autor TEXT,
      descricao TEXT,
      links TEXT,
      metadados TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (regional_id) REFERENCES regionais(id) ON DELETE CASCADE
    )
  `);

  // Tabela de seleções (setlists)
  db.run(`
    CREATE TABLE IF NOT EXISTS selections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      regional_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      descricao TEXT,
      data_evento DATE,
      max_musicas INTEGER DEFAULT 30,
      criada_por INTEGER NOT NULL,
      status TEXT DEFAULT 'votacao',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (regional_id) REFERENCES regionais(id) ON DELETE CASCADE,
      FOREIGN KEY (criada_por) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  // Tabela de votos nas seleções
  db.run(`
    CREATE TABLE IF NOT EXISTS selection_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      selection_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      repertoire_item_id INTEGER NOT NULL,
      votado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (selection_id) REFERENCES selections(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (repertoire_item_id) REFERENCES repertoire_items(id) ON DELETE CASCADE,
      UNIQUE(selection_id, member_id, repertoire_item_id)
    )
  `);

  // Tabela de músicas selecionadas (mais votadas)
  db.run(`
    CREATE TABLE IF NOT EXISTS selection_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      selection_id INTEGER NOT NULL,
      repertoire_item_id INTEGER NOT NULL,
      posicao INTEGER NOT NULL,
      total_votos INTEGER NOT NULL,
      FOREIGN KEY (selection_id) REFERENCES selections(id) ON DELETE CASCADE,
      FOREIGN KEY (repertoire_item_id) REFERENCES repertoire_items(id) ON DELETE CASCADE,
      UNIQUE(selection_id, repertoire_item_id)
    )
  `);

  // Tabela de logs de estudo
  db.run(`
    CREATE TABLE IF NOT EXISTS study_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      repertoire_item_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      duracao_minutos INTEGER,
      notas TEXT,
      estudado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (repertoire_item_id) REFERENCES repertoire_items(id) ON DELETE CASCADE
    )
  `);

  // Índices para buscas
  db.run(`CREATE INDEX IF NOT EXISTS idx_repertoire_nome ON repertoire_items(nome)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_members_username ON members(username)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_study_logs_member ON study_logs(member_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_study_logs_repertoire ON study_logs(repertoire_item_id)`);

  console.log('  ✅ Created all tables and indexes');
}

export async function down(db: Database): Promise<void> {
  // Drop tables em ordem inversa (devido às foreign keys)
  db.run(`DROP TABLE IF EXISTS study_logs`);
  db.run(`DROP TABLE IF EXISTS selection_results`);
  db.run(`DROP TABLE IF EXISTS selection_votes`);
  db.run(`DROP TABLE IF EXISTS selections`);
  db.run(`DROP TABLE IF EXISTS repertoire_items`);
  db.run(`DROP TABLE IF EXISTS members`);
  db.run(`DROP TABLE IF EXISTS regionais`);

  console.log('  ✅ Dropped all tables');
}
