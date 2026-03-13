/**
 * Migration Runner (Legacy)
 * 
 * Wrapper para compatibilidade com o antigo sistema de migrations
 * Usa o novo MigrationManager internamente
 */

import type { Database } from 'bun:sqlite';
import { MigrationManager, getMigrationManager } from './migration-manager';
import { migrations } from './migrations-registry';

/**
 * Aplica todas as migrations (legacy API)
 */
export async function runMigrations(db?: Database): Promise<void> {
  const manager = db ? new MigrationManager(db) : getMigrationManager();
  manager.registerMany(migrations);
  await manager.migrate();
}

/**
 * Reverte a última migration (legacy API)
 */
export async function rollbackMigration(db?: Database): Promise<void> {
  const manager = db ? new MigrationManager(db) : getMigrationManager();
  manager.registerMany(migrations);
  await manager.rollback();
}

/**
 * Lista migrations (legacy API)
 */
export async function listMigrations(db?: Database): Promise<void> {
  const manager = db ? new MigrationManager(db) : getMigrationManager();
  manager.registerMany(migrations);
  manager.status();
}
