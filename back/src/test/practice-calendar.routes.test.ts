import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Hono } from 'hono';
import { practiceCalendarRoutes } from '../routes/practice-calendar';
import { getDb } from '../db';
import { getMigrationManager } from '../migration-manager';
import { migrations } from '../migrations-registry';

describe('Practice Calendar Routes', () => {
  let app: Hono;
  let testDb: any;

  beforeAll(async () => {
    // Configurar app de teste
    app = new Hono();
    app.route('/api/practice-calendar', practiceCalendarRoutes);

    // Configurar banco de dados de teste e rodar migrations
    testDb = getDb();
    const manager = getMigrationManager();
    manager.registerMany(migrations);
    await manager.migrate();
    
    // Limpar dados de teste anteriores
    testDb.exec('DELETE FROM study_logs WHERE member_id = 999');
    testDb.exec('DELETE FROM repertoire_items WHERE id = 999');

    // Criar regional e member de teste se não existirem
    testDb.prepare(`
      INSERT OR IGNORE INTO regionais (id, nome) VALUES (1, 'Regional Teste')
    `).run();

    testDb.prepare(`
      INSERT OR REPLACE INTO members (id, regional_id, nome, username, password_hash, instrumento)
      VALUES (999, 1, 'Member Teste', 'test999', 'hash', 'Violão')
    `).run();

    // Criar um repertoire item de teste
    testDb.prepare(`
      INSERT INTO repertoire_items (id, regional_id, nome, autor, tonalidade, tonalidade_modo)
      VALUES (999, 1, 'Música Teste', 'Autor Teste', 'C', 'maior')
    `).run();
    
    // Criar study logs de teste
    testDb.prepare(`
      INSERT INTO study_logs (member_id, repertoire_item_id, tipo, data, estudado_em)
      VALUES (999, 999, 'grupo', '2026-03-16', datetime('now'))
    `).run();
  });

  afterAll(() => {
    // Limpar dados de teste
    testDb.exec('DELETE FROM study_logs WHERE member_id = 999');
    testDb.exec('DELETE FROM repertoire_items WHERE id = 999');
  });

  describe('GET /api/practice-calendar/member/:memberId/date', () => {
    it('deve retornar práticas de uma data específica usando query param', async () => {
      const response = await app.request(
        '/api/practice-calendar/member/999/date?date=2026-03-16'
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.practices).toBeArray();
      expect(data.practices.length).toBeGreaterThan(0);
      expect(data.practices[0].musica_nome).toBe('Música Teste');
    });

    it('deve retornar erro quando date não é fornecido', async () => {
      const response = await app.request(
        '/api/practice-calendar/member/999/date'
      );
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('obrigatório');
    });

    it('deve retornar erro quando formato da data é inválido', async () => {
      const response = await app.request(
        '/api/practice-calendar/member/999/date?date=16-03-2026'
      );
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('YYYY-MM-DD');
    });

    it('deve retornar lista vazia quando não há práticas na data', async () => {
      const response = await app.request(
        '/api/practice-calendar/member/999/date?date=2026-03-20'
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.practices).toBeArray();
      expect(data.practices.length).toBe(0);
    });
  });
});
