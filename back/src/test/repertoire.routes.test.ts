/**
 * Testes unitários para Repertoire Routes
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { Hono } from 'hono';
import { dbProvider } from '../../src/db-provider';
import { runMigrations } from './helpers/migration-runner';
import { repertoireRoutes } from '../../src/routes/repertoire';

let testDb: Database;
let app: Hono;

describe('Repertoire Routes', () => {
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
      INSERT INTO regionais (id, nome) VALUES (2, 'Regional 2');
      
      INSERT INTO members (id, regional_id, nome, username, password_hash, instrumento)
      VALUES (1, 1, 'Membro 1', 'membro1', 'hash123', 'Violão');
      
      INSERT INTO repertoire_items (id, regional_id, nome, autor, tonalidade, tonalidade_modo, tem_introducao)
      VALUES
        (1, 1, 'Brasileirinho', 'Waldir Azevedo', 'C', 'maior', 1),
        (2, 1, 'Tico-Tico no Fubá', 'Zequinha de Abreu', 'D', 'maior', 1),
        (3, 1, 'Odeon', 'Ernesto Nazareth', 'F', 'maior', 0),
        (4, 2, 'Música Regional 2', 'Autor 2', 'G', 'maior', 1);
      
      INSERT INTO member_repertoire (member_id, repertoire_item_id, nivel_fluencia, introducao_aprendida, ultima_pratica)
      VALUES
        (1, 1, 'tocando_bem', 1, '2025-01-10'),
        (1, 2, 'tirada', 0, '2025-01-05'),
        (1, 3, 'precisa_aprender', 0, NULL),
        (1, 4, 'tirando_onda', 1, '2025-01-08');
    `);

    app = new Hono();
    app.route('/repertoire', repertoireRoutes);
  });

  afterEach(() => {
    dbProvider.reset();
    testDb.close();
  });

  describe('GET /repertoire/regional/:regionalId', () => {
    it('deve listar repertório de uma regional', async () => {
      const response = await app.request('/repertoire/regional/1');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(3);
    });

    it('deve filtrar por não praticadas há X dias', async () => {
      const response = await app.request('/repertoire/regional/1?nao_praticadas_ha=7');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.items.length).toBeGreaterThan(0);
    });

    it('deve filtrar por nível de fluência', async () => {
      const response = await app.request('/repertoire/regional/1?member_id=1&nivel_fluencia=tirada,tocando_bem');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(2);
    });

    it('deve filtrar por tem_introducao', async () => {
      const response = await app.request('/repertoire/regional/1?tem_introducao=true');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(2);
    });

    it('deve filtrar por introducao_aprendida', async () => {
      const response = await app.request('/repertoire/regional/1?member_id=1&introducao_aprendida=true');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].nome).toBe('Brasileirinho');
    });

    it('deve aplicar múltiplos filtros', async () => {
      const response = await app.request('/repertoire/regional/1?member_id=1&tem_introducao=true&nivel_fluencia=tirada');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].nome).toBe('Tico-Tico no Fubá');
    });
  });

  describe('GET /repertoire/suggestions', () => {
    it('deve buscar sugestões de músicas por nome', async () => {
      const response = await app.request('/repertoire/suggestions?q=Brasileirinho&regional_id=1');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.suggestions).toHaveLength(1);
      expect(data.suggestions[0].nome).toBe('Brasileirinho');
    });

    it('deve buscar sugestões com busca parcial', async () => {
      const response = await app.request('/repertoire/suggestions?q=Tico&regional_id=1');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.suggestions.length).toBeGreaterThan(0);
    });

    it('deve respeitar o limite de resultados', async () => {
      const response = await app.request('/repertoire/suggestions?q=a&regional_id=1&limit=2');
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.suggestions.length).toBeLessThanOrEqual(2);
    });

    it('deve retornar erro se regional_id não for fornecido', async () => {
      const response = await app.request('/repertoire/suggestions?q=Brasileirinho');
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('deve filtrar por regional_id', async () => {
      const response1 = await app.request('/repertoire/suggestions?q=Música&regional_id=1');
      const data1 = await response1.json() as any;

      const response2 = await app.request('/repertoire/suggestions?q=Música&regional_id=2');
      const data2 = await response2.json() as any;

      expect(data1.suggestions).toHaveLength(0);
      expect(data2.suggestions).toHaveLength(1);
      expect(data2.suggestions[0].nome).toBe('Música Regional 2');
    });
  });

  describe('POST /repertoire', () => {
    it('deve criar novo item com campos básicos', async () => {
      const newItem = {
        regional_id: 1,
        nome: 'Nova Música',
        autor: 'Novo Autor',
      };

      const response = await app.request('/repertoire', {
        method: 'POST',
        body: JSON.stringify(newItem),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json() as any;

      expect(response.status).toBe(201);
      expect(data.item.nome).toBe('Nova Música');
      expect(data.item.autor).toBe('Novo Autor');
    });

    it('deve criar novo item com campos de prática', async () => {
      const newItem = {
        regional_id: 1,
        nome: 'Nova Música',
        autor: 'Novo Autor',
        tonalidade: 'C',
        tonalidade_modo: 'maior',
        tem_introducao: true,
        tem_tercas: false,
      };

      const response = await app.request('/repertoire', {
        method: 'POST',
        body: JSON.stringify(newItem),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json() as any;

      expect(response.status).toBe(201);
      expect(data.item.tonalidade).toBe('C');
      expect(data.item.tem_introducao).toBe(true);
      expect(data.item.tem_tercas).toBe(false);
    });

    it('deve retornar erro se nome não for fornecido', async () => {
      const newItem = {
        regional_id: 1,
      };

      const response = await app.request('/repertoire', {
        method: 'POST',
        body: JSON.stringify(newItem),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /repertoire/:id', () => {
    it('deve atualizar item do repertório', async () => {
      const updateData = {
        nome: 'Nome Atualizado',
        autor: 'Autor Atualizado',
      };

      const response = await app.request('/repertoire/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.item.nome).toBe('Nome Atualizado');
      expect(data.item.autor).toBe('Autor Atualizado');
    });

    it('deve atualizar campos de prática', async () => {
      const updateData = {
        tonalidade: 'D',
        tonalidade_modo: 'menor',
        tem_tercas: true,
        tem_introducao: false,
      };

      const response = await app.request('/repertoire/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.item.tonalidade).toBe('D');
      expect(data.item.tonalidade_modo).toBe('menor');
      expect(data.item.tem_tercas).toBe(true);
      expect(data.item.tem_introducao).toBe(false);
    });

    it('deve retornar 404 se item não existir', async () => {
      const response = await app.request('/repertoire/999', {
        method: 'PUT',
        body: JSON.stringify({ nome: 'Teste' }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /repertoire/:id', () => {
    it('deve deletar item do repertório', async () => {
      const response = await app.request('/repertoire/1', {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);

      // Verificar se foi deletado
      const result = testDb.prepare('SELECT * FROM repertoire_items WHERE id = ?').get(1);
      expect(result).toBeNull();
    });

    it('deve retornar 404 se item não existir', async () => {
      const response = await app.request('/repertoire/999', {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});
