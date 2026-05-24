/**
 * Testes para o serviço de busca no Acervo Casa do Choro
 */

import { describe, it, expect } from 'bun:test';
import { searchAcervo } from '../services/casa-do-choro.service';

describe('Casa do Choro Service', () => {
  it('deve retornar resultados para busca por "escorregando"', async () => {
    const result = await searchAcervo('escorregando');

    expect(result.query).toBe('escorregando');
    expect(result.page).toBe(1);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);

    // Verificar se Escorregando de Ernesto Nazareth está nos resultados
    const escorregando = result.results.find(
      r => r.nome.toLowerCase().includes('escorregando')
    );
    expect(escorregando).toBeDefined();
    expect(escorregando!.autor).toBe('Ernesto Nazareth');
  });

  it('deve retornar resultados com nome, autor e genero', async () => {
    const result = await searchAcervo('escorregando');

    for (const item of result.results) {
      expect(item.nome).toBeTruthy();
      expect(typeof item.nome).toBe('string');
      expect(item.autor).toBeTruthy();
      expect(typeof item.autor).toBe('string');
      expect(item.genero).toBeDefined();
      expect(typeof item.genero).toBe('string');
    }
  });

  it('deve suportar paginação', async () => {
    const result = await searchAcervo('choro', 1);
    expect(result.page).toBe(1);
    expect(Array.isArray(result.results)).toBe(true);
  });

  it('deve retornar array vazio para busca sem resultados', async () => {
    const result = await searchAcervo('xyz123_nada_aqui_987');

    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
  });
});
