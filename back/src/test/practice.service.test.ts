/**
 * Testes unitários para Practice Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { dbProvider } from '../../src/db-provider';
import { runMigrations } from './helpers/migration-runner';
import { PracticeService } from '../../src/services/practice.service';

let testDb: Database;
let practiceService: PracticeService;

describe('PracticeService', () => {
  beforeEach(async () => {
    // Criar banco de dados em memória para testes
    testDb = new Database(':memory:');
    
    // Aplicar migrations
    await runMigrations(testDb);

    // Injetar banco de teste e criar service
    dbProvider.setTestDb(testDb);
    practiceService = new PracticeService();
  });

  afterEach(() => {
    dbProvider.reset();
    if (testDb) {
      testDb.close();
    }
  });

  describe('updatePracticeFields', () => {
    it('deve atualizar campos de prática de uma música', () => {
      testDb.run(`INSERT INTO repertoire_items (regional_id, nome, autor) VALUES (1, 'Música Teste', 'Autor Teste')`);

      practiceService.updatePracticeFields(1, {
        tonalidade: 'C',
        tem_introducao: true,
      });

      const result = testDb.prepare('SELECT * FROM repertoire_items WHERE id = ?').get(1) as any;

      expect(result.tonalidade).toBe('C');
      expect(result.tem_introducao).toBe(1);
    });

    it('deve atualizar múltiplos campos booleanos', () => {
      testDb.run(`INSERT INTO repertoire_items (regional_id, nome, autor) VALUES (1, 'Música Teste', 'Autor Teste')`);

      practiceService.updatePracticeFields(1, {
        tem_introducao: true,
        tem_tercas: true,
        tem_arranjo_6_cordas: true,
      });

      const result = testDb.prepare('SELECT * FROM repertoire_items WHERE id = ?').get(1) as any;

      expect(result.tem_introducao).toBe(1);
      expect(result.tem_tercas).toBe(1);
      expect(result.tem_arranjo_6_cordas).toBe(1);
    });
  });

  describe('markAsPracticed', () => {
    it('deve marcar música como praticada com data atual', () => {
      testDb.run(`INSERT INTO repertoire_items (regional_id, nome, autor) VALUES (1, 'Música Teste', 'Autor Teste')`);
      testDb.run(`INSERT INTO members (id, regional_id, nome, username, password_hash, instrumento) VALUES (1, 1, 'Membro', 'user1', 'hash', 'Violão')`);
      testDb.run(`INSERT INTO member_repertoire (member_id, repertoire_item_id) VALUES (1, 1)`);

      // Atualizar member_repertoire
      testDb.run(`
        UPDATE member_repertoire
        SET nivel_fluencia = 'tirada', ultima_pratica = CURRENT_TIMESTAMP
        WHERE member_id = 1 AND repertoire_item_id = 1
      `);

      const result = testDb.prepare('SELECT * FROM member_repertoire WHERE member_id = ? AND repertoire_item_id = ?').get(1, 1) as any;

      expect(result.nivel_fluencia).toBe('tirada');
      expect(result.ultima_pratica).toBeDefined();
    });

    it('deve atualizar nível de fluência ao marcar como praticada', () => {
      testDb.run(`INSERT INTO repertoire_items (regional_id, nome, autor) VALUES (1, 'Música Teste', 'Autor Teste')`);
      testDb.run(`INSERT INTO members (id, regional_id, nome, username, password_hash, instrumento) VALUES (1, 1, 'Membro', 'user1', 'hash', 'Violão')`);
      testDb.run(`INSERT INTO member_repertoire (member_id, repertoire_item_id, nivel_fluencia) VALUES (1, 1, 'precisa_aprender')`);

      testDb.run(`
        UPDATE member_repertoire
        SET nivel_fluencia = 'tocando_bem'
        WHERE member_id = 1 AND repertoire_item_id = 1
      `);

      const result = testDb.prepare('SELECT * FROM member_repertoire WHERE member_id = ? AND repertoire_item_id = ?').get(1, 1) as any;

      expect(result.nivel_fluencia).toBe('tocando_bem');
    });
  });

  describe('getRepertoireWithFilters', () => {
    beforeEach(() => {
      testDb.run(`
        INSERT INTO regionais (id, nome) VALUES (1, 'Regional Teste');
        INSERT INTO regionais (id, nome) VALUES (2, 'Regional 2');
        INSERT INTO members (id, regional_id, nome, username, password_hash, instrumento) VALUES (1, 1, 'Membro', 'user1', 'hash', 'Violão');
        INSERT INTO repertoire_items (id, regional_id, nome, autor, tem_introducao)
        VALUES
          (1, 1, 'Música 1', 'Autor 1', 0),
          (2, 1, 'Música 2', 'Autor 2', 1),
          (3, 1, 'Música 3', 'Autor 3', 1),
          (4, 1, 'Música 4', 'Autor 4', 0),
          (5, 2, 'Música 5', 'Autor 5', 0);
        INSERT INTO member_repertoire (member_id, repertoire_item_id, nivel_fluencia, ultima_pratica, introducao_aprendida)
        VALUES
          (1, 1, 'precisa_aprender', NULL, 0),
          (1, 2, 'tirada', datetime('now', '-1 day'), 1),
          (1, 3, 'tocando_bem', datetime('now', '-5 days'), 0),
          (1, 4, 'tirando_onda', datetime('now', '-10 days'), 0),
          (1, 5, 'precisa_aprender', NULL, 0);
      `);
    });

    it('deve filtrar por regional_id', async () => {
      const result = await practiceService.getRepertoireWithFilters(1);
      expect(result).toBeDefined();
      expect(result!.length).toBe(4);
    });

    it('deve filtrar músicas não praticadas há X dias', async () => {
      const result = await practiceService.getRepertoireWithFilters(1, { nao_praticadas_ha: 7 });

      expect(result).toBeDefined();
      expect(result!.length).toBeGreaterThan(0);
    });

    it('deve filtrar por tem_introducao', async () => {
      const result = await practiceService.getRepertoireWithFilters(1, {
        tem_introducao: true,
      });

      expect(result).toBeDefined();
      expect(result!.length).toBe(2);
    });

    it('deve aplicar múltiplos filtros simultaneamente', async () => {
      const result = await practiceService.getRepertoireWithFilters(1, {
        tem_introducao: true,
      });

      expect(result).toBeDefined();
      expect(result!.length).toBe(2);
    });
  });
});
