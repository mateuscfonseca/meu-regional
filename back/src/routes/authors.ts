import { Hono } from 'hono';
import { getDb } from '../db-provider';
import { z } from 'zod';

const suggestionsSchema = z.object({
  q: z.string().min(1),
  limit: z.number().int().positive().max(20).optional().default(10),
});

export const authorsRoutes = new Hono();

/**
 * Buscar sugestões de autores (autocomplete)
 * Busca autores já cadastrados no repertório
 * 
 * GET /api/authors/suggestions?q=Beat&limit=10
 */
authorsRoutes.get('/suggestions', async (c) => {
  try {
    const query = c.req.query('q');
    const limitParam = c.req.query('limit');

    // Validar parâmetros
    const validated = suggestionsSchema.parse({
      q: query,
      limit: limitParam ? parseInt(limitParam, 10) : 10,
    });

    const db = getDb();

    // Buscar autores distintos que contenham a query
    // Usa LIKE para busca parcial (case-insensitive no SQLite)
    const searchPattern = `%${validated.q}%`;

    const rows = db.prepare(`
      SELECT DISTINCT autor 
      FROM repertoire_items 
      WHERE autor IS NOT NULL 
        AND autor != '' 
        AND autor LIKE ?
      ORDER BY autor
      LIMIT ?
    `).all(searchPattern, validated.limit) as { autor: string }[];

    // Extrair apenas os nomes dos autores
    const suggestions = rows.map(row => row.autor);

    return c.json({
      query: validated.q,
      suggestions,
      total: suggestions.length,
    });
  } catch (error: any) {
    console.error('[AuthorsRoutes] Erro na busca de autores:', error);
    
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Parâmetros inválidos' }, 400);
    }
    
    return c.json({ error: error.message || 'Erro ao buscar autores' }, 500);
  }
});

/**
 * Listar todos os autores (paginado)
 * GET /api/authors/list?offset=0&limit=50
 */
authorsRoutes.get('/list', async (c) => {
  try {
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);

    const db = getDb();

    const rows = db.prepare(`
      SELECT DISTINCT autor 
      FROM repertoire_items 
      WHERE autor IS NOT NULL 
        AND autor != ''
      ORDER BY autor
      LIMIT ? OFFSET ?
    `).all(limit, offset) as { autor: string }[];

    // Contar total
    const countResult = db.prepare(`
      SELECT COUNT(DISTINCT autor) as total
      FROM repertoire_items
      WHERE autor IS NOT NULL AND autor != ''
    `).get() as { total: number };

    return c.json({
      authors: rows.map(row => row.autor),
      total: countResult.total,
      offset,
      limit,
    });
  } catch (error: any) {
    console.error('[AuthorsRoutes] Erro ao listar autores:', error);
    return c.json({ error: error.message || 'Erro ao listar autores' }, 500);
  }
});
