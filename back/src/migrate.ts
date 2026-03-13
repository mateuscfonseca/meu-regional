#!/usr/bin/env bun
/**
 * Script de migração do banco de dados
 *
 * Comandos:
 * - bun run migrate         - Aplica todas as migrações pendentes
 * - bun run migrate:rollback - Reverte a última migração
 * - bun run migrate:list    - Lista todas as migrações
 */

import { getMigrationManager } from './migration-manager';
import { migrations } from './migrations-registry';
import { initDatabase } from './db-provider';

const command = process.argv[2] || 'run';

console.log('🚀 Meu Regional - Migration Tool\n');

// Inicializa o banco de dados
initDatabase();

async function main() {
  const manager = getMigrationManager();
  manager.registerMany(migrations);

  try {
    switch (command) {
      case 'run':
      case 'up':
        await manager.migrate();
        break;

      case 'rollback':
      case 'down':
        await manager.rollback();
        break;

      case 'list':
      case 'status':
        manager.status();
        break;

      default:
        console.log(`
Comandos disponíveis:
  bun run migrate          - Aplica migrações pendentes
  bun run migrate:rollback - Reverte última migração
  bun run migrate:list     - Lista status das migrações

Uso:
  bun run migrate
  bun run migrate:rollback
  bun run migrate:list
`);
    }
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
