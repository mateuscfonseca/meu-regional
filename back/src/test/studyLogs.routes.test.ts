/**
 * Testes unitários para Study Logs Routes
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { Hono } from 'hono';
import { dbProvider } from '../../src/db-provider';
import { runMigrations } from './helpers/migration-runner';
import { studyLogsRoutes } from '../../src/routes/studyLogs';

let testDb: Database;
let app: Hono;

describe('Study Logs Routes', () => {
  beforeEach(async () => {
    // Criar banco de dados em memória para testes
    testDb = new Database(':memory:');

    // Aplicar migrations
    await runMigrations(testDb);

    // Injetar banco de teste
    dbProvider.setTestDb(testDb);

    // Inserir dados de teste APÓS aplicar migrations
    testDb.run(`
      INSERT INTO regionais (id, nome) VALUES (1, 'Regional Teste');
      
      INSERT INTO members (id, regional_id, nome, username, password_hash, instrumento)
      VALUES
        (1, 1, 'Membro 1', 'membro1', 'hash123', 'Violão'),
        (2, 1, 'Membro 2', 'membro2', 'hash456', 'Cavaquinho');
      
      INSERT INTO repertoire_items (id, regional_id, nome, autor)
      VALUES
        (1, 1, 'Brasileirinho', 'Waldir Azevedo'),
        (2, 1, 'Tico-Tico no Fubá', 'Zequinha de Abreu'),
        (3, 1, 'Odeon', 'Ernesto Nazareth');
      
      INSERT INTO study_logs (member_id, repertoire_item_id, tipo, duracao_minutos, notas, data, estudado_em)
      VALUES
        (1, 1, 'individual', 30, 'Estudo focado na introdução', '2025-01-10', '2025-01-10 10:00:00'),
        (1, 2, 'individual', 45, 'Prática de tercas', '2025-01-09', '2025-01-09 11:00:00'),
        (1, 1, 'grupo', 60, 'Ensemble com o grupo', '2025-01-08', '2025-01-08 14:00:00');
    `);

    app = new Hono();
    app.route('/study-logs', studyLogsRoutes);
  });

  afterEach(() => {
    dbProvider.reset();
    testDb.close();
  });

  describe('GET /study-logs/member/:memberId', () => {
    it('deve listar logs de estudo de um membro', async () => {
      const response = await app.request('/study-logs/member/1');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(3);
      expect(data.logs[0].musica_nome).toBe('Brasileirinho');
    });

    it('deve respeitar o limite de resultados via query param', async () => {
      const response = await app.request('/study-logs/member/1?limit=2');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(2);
    });

    it('deve retornar lista vazia se membro não tiver estudos', async () => {
      const response = await app.request('/study-logs/member/999');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(0);
    });

    it('deve retornar logs ordenados por estudado_em (mais recente primeiro)', async () => {
      const response = await app.request('/study-logs/member/1');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.logs[0].estudado_em).toContain('2025-01-10');
      expect(data.logs[1].estudado_em).toContain('2025-01-09');
      expect(data.logs[2].estudado_em).toContain('2025-01-08');
    });
  });

  describe('GET /study-logs/repertoire/:repertoireId', () => {
    it('deve listar logs de estudo de uma música', async () => {
      const response = await app.request('/study-logs/repertoire/1');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(2);
    });

    it('deve retornar lista vazia se música não tiver estudos', async () => {
      const response = await app.request('/study-logs/repertoire/999');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(0);
    });
  });

  describe('POST /study-logs', () => {
    it('deve criar novo log de estudo', async () => {
      const newLog = {
        member_id: 1,
        repertoire_item_id: 1,
        tipo: 'individual',
        duracao_minutos: 30,
        notas: 'Teste de estudo',
        data: '2025-01-11',
      };

      const response = await app.request('/study-logs', {
        method: 'POST',
        body: JSON.stringify(newLog),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json() as any;

      expect(response.status).toBe(201);
      expect(data.log.member_id).toBe(1);
      expect(data.log.repertoire_item_id).toBe(1);
      expect(data.log.tipo).toBe('individual');
      expect(data.log.duracao_minutos).toBe(30);
    });

    it('deve criar log com campos opcionais', async () => {
      const newLog = {
        member_id: 1,
        repertoire_item_id: 2,
        tipo: 'grupo',
      };

      const response = await app.request('/study-logs', {
        method: 'POST',
        body: JSON.stringify(newLog),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json() as any;

      expect(response.status).toBe(201);
      expect(data.log.tipo).toBe('grupo');
      expect(data.log.duracao_minutos).toBeNull();
      expect(data.log.notas).toBeNull();
    });

    it('deve retornar erro se tipo não for fornecido', async () => {
      const newLog = {
        member_id: 1,
        repertoire_item_id: 1,
      };

      const response = await app.request('/study-logs', {
        method: 'POST',
        body: JSON.stringify(newLog),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(400);
    });

    it('deve retornar erro se tipo for inválido', async () => {
      const newLog = {
        member_id: 1,
        repertoire_item_id: 1,
        tipo: 'invalido',
      };

      const response = await app.request('/study-logs', {
        method: 'POST',
        body: JSON.stringify(newLog),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /study-logs/member/:memberId/stats', () => {
    it('deve retornar estatísticas de estudo de um membro', async () => {
      const response = await app.request('/study-logs/member/1/stats');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.total_estudos).toBe(3);
      expect(data.estudos_por_tipo).toHaveLength(2);
    });

    it('deve retornar estatísticas com zero se membro não tiver estudos', async () => {
      const response = await app.request('/study-logs/member/999/stats');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.total_estudos).toBe(0);
    });
  });

  describe('DELETE /study-logs/:id', () => {
    it('deve excluir log de estudo', async () => {
      const response = await app.request('/study-logs/1', {
        method: 'DELETE',
      });

      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verificar se foi excluído
      const result = testDb.prepare('SELECT * FROM study_logs WHERE id = ?').get(1);
      expect(result).toBeUndefined();
    });

    it('deve retornar 404 se log não existir', async () => {
      const response = await app.request('/study-logs/999', {
        method: 'DELETE',
      });

      const data = await response.json() as any;

      expect(response.status).toBe(404);
      expect(data.error).toBe('Registro de estudo não encontrado');
    });

    it('deve atualizar contagem de estudos após exclusão', async () => {
      // Verificar contagem antes
      const beforeResponse = await app.request('/study-logs/member/1/stats');
      const beforeData = await beforeResponse.json() as any;
      expect(beforeData.total_estudos).toBe(3);

      // Excluir um log
      await app.request('/study-logs/1', { method: 'DELETE' });

      // Verificar contagem depois
      const afterResponse = await app.request('/study-logs/member/1/stats');
      const afterData = await afterResponse.json() as any;
      expect(afterData.total_estudos).toBe(2);
    });
  });
});
