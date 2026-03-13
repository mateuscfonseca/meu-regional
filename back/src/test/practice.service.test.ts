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
        nivel_fluencia: 'tocando_bem',
        tem_introducao: true,
      });

      const result = testDb.prepare('SELECT * FROM repertoire_items WHERE id = ?').get(1) as any;
      
      expect(result.tonalidade).toBe('C');
      expect(result.nivel_fluencia).toBe('tocando_bem');
      expect(result.tem_introducao).toBe(1);
    });

    it('deve atualizar múltiplos campos booleanos', () => {
      testDb.run(`INSERT INTO repertoire_items (regional_id, nome, autor) VALUES (1, 'Música Teste', 'Autor Teste')`);

      practiceService.updatePracticeFields(1, {
        tem_introducao: true,
        tem_tercas: true,
        tem_arranjo_6_cordas: true,
        introducao_aprendida: true,
        tercas_aprendidas: true,
        arranjo_6_cordas_aprendido: true,
      });

      const result = testDb.prepare('SELECT * FROM repertoire_items WHERE id = ?').get(1) as any;
      
      expect(result.tem_introducao).toBe(1);
      expect(result.tem_tercas).toBe(1);
      expect(result.tem_arranjo_6_cordas).toBe(1);
      expect(result.introducao_aprendida).toBe(1);
      expect(result.tercas_aprendidas).toBe(1);
      expect(result.arranjo_6_cordas_aprendido).toBe(1);
    });
  });

  describe('markAsPracticed', () => {
    it('deve marcar música como praticada com data atual', () => {
      testDb.run(`INSERT INTO repertoire_items (regional_id, nome, autor) VALUES (1, 'Música Teste', 'Autor Teste')`);

      practiceService.markAsPracticed(1, { nivel_fluencia: 'tirada' });

      const result = testDb.prepare('SELECT * FROM repertoire_items WHERE id = ?').get(1) as any;
      
      expect(result.ultima_pratica).toBeDefined();
      expect(result.nivel_fluencia).toBe('tirada');
    });

    it('deve atualizar nível de fluência ao marcar como praticada', () => {
      testDb.run(`INSERT INTO repertoire_items (regional_id, nome, autor, nivel_fluencia) VALUES (1, 'Música Teste', 'Autor Teste', 'precisa_aprender')`);

      practiceService.markAsPracticed(1, { nivel_fluencia: 'tocando_bem' });

      const result = testDb.prepare('SELECT * FROM repertoire_items WHERE id = ?').get(1) as any;
      
      expect(result.nivel_fluencia).toBe('tocando_bem');
    });
  });

  describe('getRepertoireWithFilters', () => {
    beforeEach(() => {
      testDb.run(`
        INSERT INTO repertoire_items (regional_id, nome, autor, nivel_fluencia, ultima_pratica, tem_introducao, introducao_aprendida)
        VALUES 
          (1, 'Música 1', 'Autor 1', 'precisa_aprender', NULL, 0, 0),
          (1, 'Música 2', 'Autor 2', 'tirada', datetime('now', '-1 day'), 1, 1),
          (1, 'Música 3', 'Autor 3', 'tocando_bem', datetime('now', '-5 days'), 1, 0),
          (1, 'Música 4', 'Autor 4', 'tirando_onda', datetime('now', '-10 days'), 0, 0),
          (2, 'Música 5', 'Autor 5', 'precisa_aprender', NULL, 0, 0)
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

    it('deve filtrar por nível de fluência', async () => {
      const result = await practiceService.getRepertoireWithFilters(1, {
        nivel_fluencia: ['tirada', 'tocando_bem'],
      });

      expect(result).toBeDefined();
      expect(result!.length).toBe(2);
    });

    it('deve filtrar por tem_introducao', async () => {
      const result = await practiceService.getRepertoireWithFilters(1, {
        tem_introducao: true,
      });

      expect(result).toBeDefined();
      expect(result!.length).toBe(2);
    });

    it('deve filtrar por introducao_aprendida', async () => {
      const result = await practiceService.getRepertoireWithFilters(1, {
        introducao_aprendida: true,
      });

      expect(result).toBeDefined();
      expect(result!.length).toBe(1);
      expect(result![0].introducao_aprendida).toBe(1);
    });

    it('deve aplicar múltiplos filtros simultaneamente', async () => {
      const result = await practiceService.getRepertoireWithFilters(1, {
        tem_introducao: true,
        nivel_fluencia: ['tirada'],
      });

      expect(result).toBeDefined();
      expect(result!.length).toBe(1);
      expect(result![0].nome).toBe('Música 2');
    });
  });

  describe('getPracticeStats', () => {
    beforeEach(() => {
      testDb.run(`
        INSERT INTO repertoire_items (regional_id, nome, autor, nivel_fluencia, ultima_pratica)
        VALUES 
          (1, 'Música 1', 'Autor 1', 'precisa_aprender', NULL),
          (1, 'Música 2', 'Autor 2', 'tirada', datetime('now', '-1 day')),
          (1, 'Música 3', 'Autor 3', 'tocando_bem', datetime('now', '-2 days')),
          (1, 'Música 4', 'Autor 4', 'tirando_onda', datetime('now', '-10 days')),
          (2, 'Música 5', 'Autor 5', 'precisa_aprender', NULL)
      `);
    });

    it('deve retornar estatísticas corretas', async () => {
      const stats = await practiceService.getPracticeStats(1);

      expect(stats).toBeDefined();
      expect(stats!.total).toBe(4);
      expect(stats!.praticadas_ultima_semana).toBe(2);
      expect(stats!.nao_praticadas_ha_7_dias).toBe(2);
    });

    it('deve retornar contagem por nível de fluência', async () => {
      const stats = await practiceService.getPracticeStats(1);

      expect(stats).toBeDefined();
      expect(stats!.nivel_fluencia_counts['precisa_aprender']).toBe(1);
      expect(stats!.nivel_fluencia_counts['tirada']).toBe(1);
      expect(stats!.nivel_fluencia_counts['tocando_bem']).toBe(1);
      expect(stats!.nivel_fluencia_counts['tirando_onda']).toBe(1);
    });

    it('deve filtrar por regional', async () => {
      const statsRegional1 = await practiceService.getPracticeStats(1);
      const statsRegional2 = await practiceService.getPracticeStats(2);

      expect(statsRegional1).toBeDefined();
      expect(statsRegional2).toBeDefined();
      expect(statsRegional1!.total).toBe(4);
      expect(statsRegional2!.total).toBe(1);
    });
  });
});
