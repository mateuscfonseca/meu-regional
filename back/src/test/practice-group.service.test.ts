/**
 * Testes unitários para Practice Group Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { dbProvider } from '../../src/db-provider';
import { runMigrations } from './helpers/migration-runner';
import { PracticeGroupService } from '../../src/services/practice-group.service';

let testDb: Database;
let practiceGroupService: PracticeGroupService;

describe('PracticeGroupService', () => {
  beforeEach(async () => {
    // Criar banco de dados em memória para testes
    testDb = new Database(':memory:');

    // Aplicar migrations
    await runMigrations(testDb);

    // Injetar banco de teste e criar service
    dbProvider.setTestDb(testDb);
    practiceGroupService = new PracticeGroupService();
  });

  afterEach(() => {
    dbProvider.reset();
    if (testDb) {
      testDb.close();
    }
  });

  describe('getGroupStats', () => {
    beforeEach(() => {
      // Setup: Criar regional, membro, músicas e estudos em grupo
      testDb.run(`
        INSERT INTO regionais (id, nome) VALUES (1, 'Regional Teste');
        INSERT INTO members (id, regional_id, nome, username, password_hash, instrumento) 
        VALUES (1, 1, 'Membro Teste', 'user1', 'hash', 'Violão');
        INSERT INTO repertoire_items (id, regional_id, nome, autor) 
        VALUES 
          (1, 1, 'Brasileirinho', 'Waldir Azevedo'),
          (2, 1, 'Tico-Tico no Fubá', 'Zequinha de Abreu'),
          (3, 1, 'Odeon', 'Pixinguinha');
      `);

      // Inserir estudos em grupo (tipo='grupo')
      testDb.run(`
        INSERT INTO study_logs (member_id, repertoire_item_id, tipo, notas, data)
        VALUES
          (1, 1, 'grupo', 'Ensaio focado na introdução', date('now', '-1 day')),
          (1, 2, 'grupo', 'Ensaio completo', date('now', '-1 day')),
          (1, 1, 'grupo', 'Revisão', date('now', '-7 days')),
          (1, 3, 'grupo', 'Ensaio longo', date('now', '-15 days')),
          (1, 2, 'grupo', 'Ensaio', date('now', '-45 days')),
          (1, 1, 'grupo', 'Ensaio antigo', date('now', '-200 days'));
      `);

      // Inserir estudo individual (não deve ser contado)
      testDb.run(`
        INSERT INTO study_logs (member_id, repertoire_item_id, tipo, data)
        VALUES (1, 1, 'individual', date('now'));
      `);
    });

    it('deve buscar estatísticas de práticas em grupo', async () => {
      const stats = await practiceGroupService.getGroupStats(1);

      expect(stats).toBeDefined();
      expect(stats.total_ensaios).toBe(6); // 6 estudos em grupo
    });

    it('deve retornar ensaios na semana (últimos 7 dias)', async () => {
      const stats = await practiceGroupService.getGroupStats(1);

      // 1 dia atrás = 2 ensaios, 7 dias atrás = 1 ensaio
      expect(stats.ensaios_na_semana).toBe(3);
    });

    it('deve retornar ensaios no mês (últimos 30 dias)', async () => {
      const stats = await practiceGroupService.getGroupStats(1);

      // 1 dia atrás (2) + 7 dias atrás (1) + 15 dias atrás (1) = 4
      expect(stats.ensaios_no_mes).toBe(4);
    });

    it('deve retornar ensaios no trimestre (últimos 90 dias)', async () => {
      const stats = await practiceGroupService.getGroupStats(1);

      // 1 dia (2) + 7 dias (1) + 15 dias (1) + 45 dias (1) = 5
      expect(stats.ensaios_no_trimestre).toBe(5);
    });

    it('deve retornar ensaios no semestre (últimos 180 dias)', async () => {
      const stats = await practiceGroupService.getGroupStats(1);

      // Mesmos do trimestre (nenhum entre 90-180 dias)
      expect(stats.ensaios_no_semestre).toBe(5);
    });

    it('deve retornar ensaios no ano (últimos 365 dias)', async () => {
      const stats = await practiceGroupService.getGroupStats(1);

      // Todos os 6 ensaios estão dentro de 365 dias
      expect(stats.ensaios_no_ano).toBe(6);
    });

    it('deve retornar músicas diferentes ensaiadas na semana', async () => {
      const stats = await practiceGroupService.getGroupStats(1);

      // Na semana: Brasileira (1 dia), Tico-Tico (1 dia), Odeon (7 dias) = 2 músicas diferentes
      // Correção: 1 dia atrás tem 2 músicas (1 e 2), 7 dias atrás tem 1 música (1)
      // Músicas diferentes na semana: 1 (Brasileirinho) e 2 (Tico-Tico) = 2
      expect(stats.musicas_diferentes_ensaiadas_semana).toBe(2);
    });

    it('deve retornar músicas mais ensaiadas', async () => {
      const stats = await practiceGroupService.getGroupStats(1);

      expect(stats.musicas_mais_ensaiadas).toBeDefined();
      expect(stats.musicas_mais_ensaiadas.length).toBeGreaterThan(0);

      // Brasileirinho: 3 ensaios
      const brasileira = stats.musicas_mais_ensaiadas.find(m => m.nome === 'Brasileirinho');
      expect(brasileira?.total_ensaios).toBe(3);

      // Tico-Tico: 2 ensaios
      const ticoTico = stats.musicas_mais_ensaiadas.find(m => m.nome === 'Tico-Tico no Fubá');
      expect(ticoTico?.total_ensaios).toBe(2);
    });

    it('deve retornar último ensaio', async () => {
      const stats = await practiceGroupService.getGroupStats(1);

      expect(stats.ultimo_ensaio).toBeDefined();
      // Último ensaio foi 1 dia atrás
      const expectedDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      expect(stats.ultimo_ensaio?.data).toBe(expectedDate);
      expect(stats.ultimo_ensaio?.musicas_count).toBe(2); // 2 músicas no último ensaio (1 dia atrás)
    });

    it('deve excluir estudos individuais das estatísticas', async () => {
      const stats = await practiceGroupService.getGroupStats(1);

      // Total deve ser 6 (apenas grupo), não 7 (que incluiria o individual)
      expect(stats.total_ensaios).toBe(6);
    });
  });

  describe('getGroupLogs', () => {
    beforeEach(() => {
      testDb.run(`
        INSERT INTO regionais (id, nome) VALUES (1, 'Regional Teste');
        INSERT INTO members (id, regional_id, nome, username, password_hash, instrumento) 
        VALUES (1, 1, 'Membro Teste', 'user1', 'hash', 'Violão');
        INSERT INTO repertoire_items (id, regional_id, nome, autor) 
        VALUES (1, 1, 'Brasileirinho', 'Waldir Azevedo');
      `);

      testDb.run(`
        INSERT INTO study_logs (member_id, repertoire_item_id, tipo, notas, data)
        VALUES
          (1, 1, 'grupo', 'Ensaio 1', date('now', '-1 day')),
          (1, 1, 'grupo', 'Ensaio 2', date('now', '-2 days'));
      `);
    });

    it('deve listar logs de práticas em grupo', async () => {
      const logs = await practiceGroupService.getGroupLogs(1, 10);

      expect(logs).toBeDefined();
      expect(logs.length).toBe(2);
      expect(logs[0].tipo).toBe('grupo');
      expect(logs[0].musica_nome).toBe('Brasileirinho');
    });

    it('deve limitar resultados', async () => {
      const logs = await practiceGroupService.getGroupLogs(1, 1);

      expect(logs.length).toBe(1);
    });
  });

  describe('getPracticesByDate', () => {
    beforeEach(() => {
      testDb.run(`
        INSERT INTO regionais (id, nome) VALUES (1, 'Regional Teste');
        INSERT INTO members (id, regional_id, nome, username, password_hash, instrumento) 
        VALUES (1, 1, 'Membro Teste', 'user1', 'hash', 'Violão');
        INSERT INTO repertoire_items (id, regional_id, nome, autor) 
        VALUES (1, 1, 'Brasileirinho', 'Waldir Azevedo');
      `);

      const today = new Date().toISOString().split('T')[0];

      testDb.run(`
        INSERT INTO study_logs (member_id, repertoire_item_id, tipo, notas, data)
        VALUES
          (1, 1, 'grupo', 'Ensaio em grupo', '${today}'),
          (1, 1, 'individual', 'Estudo individual', '${today}');
      `);
    });

    it('deve buscar práticas de uma data específica', async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await practiceGroupService.getPracticesByDate(1, today);

      expect(result).toBeDefined();
      expect(result.data).toBe(today);
      expect(result.total_estudos).toBe(2);
      expect(result.musicas.length).toBe(2);
    });

    it('deve retornar zero se não houver práticas na data', async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const result = await practiceGroupService.getPracticesByDate(1, yesterday);

      expect(result).toBeDefined();
      expect(result.total_estudos).toBe(0);
      expect(result.musicas.length).toBe(0);
    });
  });
});
