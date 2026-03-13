/**
 * Migration 005: Member Repertoire
 *
 * Cria tabela de ligação entre membros e itens do repertório (dados de proficiência por usuário).
 * 
 * Nota: Não criamos practice_logs pois já temos study_logs para registrar práticas.
 */

import type { Database } from 'bun:sqlite';

export const name = 'Member Repertoire';

export async function up(db: Database): Promise<void> {
  // ============================================
  // 1. Criar tabela member_repertoire
  // ============================================
  // Armazena dados de proficiência POR USUÁRIO para cada item do repertório
  db.run(`
    CREATE TABLE IF NOT EXISTS member_repertoire (
      id INTEGER PRIMARY KEY,
      member_id INTEGER NOT NULL,
      repertoire_item_id INTEGER NOT NULL,
      
      -- Proficiência/Status do usuário
      nivel_fluencia TEXT DEFAULT 'precisa_aprender',
      
      -- Status de aprendizado do usuário
      introducao_aprendida BOOLEAN DEFAULT 0,
      tercas_aprendidas BOOLEAN DEFAULT 0,
      arranjo_6_cordas_aprendido BOOLEAN DEFAULT 0,
      
      -- Notas pessoais do usuário (diferente de 'notas' geral da música)
      notas_pessoais TEXT,
      
      -- Última prática deste usuário (para filtros rápidos)
      ultima_pratica DATETIME,
      
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (repertoire_item_id) REFERENCES repertoire_items(id) ON DELETE CASCADE,
      UNIQUE(member_id, repertoire_item_id)
    )
  `);

  // ============================================
  // 2. Criar índices para member_repertoire
  // ============================================
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_member_repertoire_member 
    ON member_repertoire(member_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_member_repertoire_item 
    ON member_repertoire(repertoire_item_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_member_repertoire_member_last_practice 
    ON member_repertoire(member_id, ultima_pratica DESC)
  `);

  // ============================================
  // 3. Limpar campos obsoletos de repertoire_items (se existirem)
  // ============================================
  // Remove campos que foram movidos para member_repertoire
  try {
    db.run(`ALTER TABLE repertoire_items DROP COLUMN IF EXISTS introducao_aprendida`);
    db.run(`ALTER TABLE repertoire_items DROP COLUMN IF EXISTS tercas_aprendidas`);
    db.run(`ALTER TABLE repertoire_items DROP COLUMN IF EXISTS arranjo_6_cordas_aprendido`);
    db.run(`ALTER TABLE repertoire_items DROP COLUMN IF EXISTS nivel_fluencia`);
    db.run(`ALTER TABLE repertoire_items DROP COLUMN IF EXISTS ultima_pratica`);
  } catch (error) {
    // Ignora erro se as colunas não existirem (SQLite versão antiga)
    console.log('Colunas obsoletas já removidas ou não existentes');
  }
}

export async function down(db: Database): Promise<void> {
  // ============================================
  // Remover índices
  // ============================================
  db.run(`DROP INDEX IF EXISTS idx_member_repertoire_member`);
  db.run(`DROP INDEX IF EXISTS idx_member_repertoire_item`);
  db.run(`DROP INDEX IF EXISTS idx_member_repertoire_member_last_practice`);

  // ============================================
  // Remover tabelas
  // ============================================
  db.run(`DROP TABLE IF EXISTS member_repertoire`);
}
