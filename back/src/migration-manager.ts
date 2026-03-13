/**
 * Migration Manager
 * 
 * Gerencia aplicação de migrations de forma automática
 * Verifica estado atual do banco e aplica migrations pendentes
 */

import type { Database } from 'bun:sqlite';
import { getDb } from './db-provider';

export interface Migration {
  id: number;
  name: string;
  up: (db: Database) => Promise<void> | void;
  down?: (db: Database) => Promise<void> | void;
}

export class MigrationManager {
  private db: Database;
  private migrations: Migration[] = [];

  constructor(db?: Database) {
    this.db = db || getDb();
    this.ensureMigrationsTable();
  }

  /**
   * Garante que a tabela de migrations existe
   */
  private ensureMigrationsTable(): void {
    // Primeiro verifica se a tabela existe com a estrutura antiga
    try {
      const tableExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'").get();
      
      if (!tableExists) {
        // Tabela não existe, cria nova
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        return;
      }

      // Tabela existe, verifica estrutura
      const columns = this.db.prepare("PRAGMA table_info(migrations)").all() as { name: string }[];
      const hasNameColumn = columns.some(col => col.name === 'name');

      if (!hasNameColumn) {
        // Estrutura antiga, recria tabela
        console.log('   📝 Updating migrations table structure...');
        this.db.exec(`DROP TABLE IF EXISTS migrations`);
        this.db.exec(`
          CREATE TABLE migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
    } catch (error: any) {
      // Erro ao verificar, recria tabela
      this.db.exec(`DROP TABLE IF EXISTS migrations`);
      this.db.exec(`
        CREATE TABLE migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  }

  /**
   * Registra uma migration
   */
  register(migration: Migration): void {
    this.migrations.push(migration);
  }

  /**
   * Registra múltiplas migrations
   */
  registerMany(migrations: Migration[]): void {
    this.migrations.push(...migrations);
  }

  /**
   * Obtém migrations já aplicadas
   */
  private getAppliedMigrations(): string[] {
    const rows = this.db.prepare('SELECT name FROM migrations ORDER BY id').all() as { name: string }[];
    return rows.map(row => row.name);
  }

  /**
   * Verifica se uma migration específica já foi aplicada
   */
  private isApplied(name: string): boolean {
    const result = this.db.prepare('SELECT 1 FROM migrations WHERE name = ?').get(name);
    return !!result;
  }

  /**
   * Marca uma migration como aplicada
   */
  private markAsApplied(name: string): void {
    this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
  }

  /**
   * Aplica todas as migrations pendentes
   */
  async migrate(): Promise<{ applied: string[]; skipped: string[] }> {
    const applied = this.getAppliedMigrations();
    const appliedNow: string[] = [];
    const skipped: string[] = [...applied];

    console.log(`\n📊 Migration Manager - Checking migrations...`);
    console.log(`   Already applied: ${applied.length}`);
    console.log(`   Total registered: ${this.migrations.length}`);

    for (const migration of this.migrations) {
      if (applied.includes(migration.name) 
      || migration.name.includes('initial-schema'))
        continue;
  

      console.log(`\n🔧 Applying migration: ${migration.name}`);
      
      try {
        await migration.up(this.db);
        this.markAsApplied(migration.name);
        appliedNow.push(migration.name);
        console.log(`   ✅ Applied: ${migration.name}`);
      } catch (error: any) {
        console.error(`   ❌ Error applying ${migration.name}:`, error.message);
        throw new Error(`Migration ${migration.name} failed: ${error.message}`);
      }
    }

    if (appliedNow.length === 0) {
      console.log(`\n✅ All migrations are up to date!\n`);
    } else {
      console.log(`\n✅ Applied ${appliedNow.length} migration(s): ${appliedNow.join(', ')}\n`);
    }

    return { applied: appliedNow, skipped };
  }

  /**
   * Reverte a última migration
   */
  async rollback(): Promise<string | null> {
    const applied = this.getAppliedMigrations();
    
    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return null;
    }

    const lastMigrationName = applied[applied.length - 1];
    const migration = this.migrations.find(m => m.name === lastMigrationName);

    if (!migration) {
      throw new Error(`Migration ${lastMigrationName} not found in registry`);
    }

    if (!migration.down) {
      throw new Error(`Migration ${lastMigrationName} does not have a down method`);
    }

    console.log(`\n🔙 Rolling back migration: ${lastMigrationName}`);

    try {
      await migration.down(this.db);
      this.db.prepare('DELETE FROM migrations WHERE name = ?').run(lastMigrationName);
      console.log(`   ✅ Rolled back: ${lastMigrationName}\n`);
      return lastMigrationName;
    } catch (error: any) {
      console.error(`   ❌ Error rolling back ${lastMigrationName}:`, error.message);
      throw new Error(`Rollback failed: ${error.message}`);
    }
  }

  /**
   * Lista todas as migrations e seu status
   */
  list(): { name: string; applied: boolean }[] {
    const applied = this.getAppliedMigrations();
    return this.migrations.map(migration => ({
      name: migration.name,
      applied: applied.includes(migration.name),
    }));
  }

  /**
   * Status das migrations
   */
  status(): void {
    const migrations = this.list();
    const applied = migrations.filter(m => m.applied);
    const pending = migrations.filter(m => !m.applied);

    console.log('\n📊 Migration Status');
    console.log('==================');
    console.log(`Total: ${migrations.length}`);
    console.log(`Applied: ${applied.length}`);
    console.log(`Pending: ${pending.length}\n`);

    if (applied.length > 0) {
      console.log('✅ Applied:');
      applied.forEach(m => console.log(`   - ${m.name}`));
    }

    if (pending.length > 0) {
      console.log('\n⏳ Pending:');
      pending.forEach(m => console.log(`   - ${m.name}`));
    }

    console.log('');
  }
}

// Singleton
let migrationManager: MigrationManager | null = null;

export function getMigrationManager(db?: Database): MigrationManager {
  if (!migrationManager) {
    migrationManager = new MigrationManager(db);
  }
  return migrationManager;
}

/**
 * Inicializa e aplica todas as migrations automaticamente
 * Deve ser chamado ao iniciar a aplicação
 */
export async function initMigrations(): Promise<void> {
  const manager = getMigrationManager();
  await manager.migrate();
}
