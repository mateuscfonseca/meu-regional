import { Hono } from 'hono';
import { repertoireService } from '../services/repertoire.service';
import { authService } from '../services/auth.service';
import { getDb } from '../db-provider';
import { z } from 'zod';

const createRepertoireSchema = z.object({
  regional_id: z.number(),
  nome: z.string().min(1),
  autor: z.string().optional(),
  descricao: z.string().optional(),
  links: z.array(z.string().url()).optional(),
  metadados: z.record(z.any()).optional(),
  // Campos de prática GERAIS (caracterização da música)
  tonalidade: z.string().optional(),
  notas: z.string().optional(),
  tem_introducao: z.boolean().optional(),
  tem_tercas: z.boolean().optional(),
  tem_arranjo_6_cordas: z.boolean().optional(),
});

/**
 * Middleware de autenticação
 * Verifica token JWT e injeta usuário no contexto
 */
async function authMiddleware(c: any, next: any) {
  const cookie = c.req.header('cookie');
  const tokenMatch = cookie?.match(/token=([^;]+)/);

  if (!tokenMatch) {
    return c.json({ error: 'Usuário não autenticado' }, 401);
  }

  try {
    const payload = await authService.verifyToken(tokenMatch[1]);
    c.set('user', payload);
    await next();
  } catch (error: any) {
    return c.json({ error: 'Token inválido' }, 401);
  }
}

const updateRepertoireSchema = z.object({
  nome: z.string().min(1).optional(),
  autor: z.string().optional(),
  descricao: z.string().optional(),
  links: z.array(z.string().url()).optional(),
  metadados: z.record(z.any()).optional(),
  // Campos de prática GERAIS (caracterização da música)
  tonalidade: z.string().optional(),
  notas: z.string().optional(),
  tem_introducao: z.boolean().optional(),
  tem_tercas: z.boolean().optional(),
  tem_arranjo_6_cordas: z.boolean().optional(),
});

const practiceFiltersSchema = z.object({
  // Filtros de características gerais (repertoire_items)
  tem_introducao: z.coerce.boolean().optional(),
  tem_tercas: z.coerce.boolean().optional(),
  tem_arranjo_6_cordas: z.coerce.boolean().optional(),
  
  // Filtros de proficiência do usuário (member_repertoire)
  member_id: z.coerce.number().optional(),
  nao_praticadas_ha: z.coerce.number().int().positive().optional(),
  nivel_fluencia: z.string().optional(),
  introducao_aprendida: z.coerce.boolean().optional(),
  tercas_aprendidas: z.coerce.boolean().optional(),
  arranjo_6_cordas_aprendido: z.coerce.boolean().optional(),
});

const suggestionsSchema = z.object({
  q: z.string().min(1),
  limit: z.number().int().positive().max(20).optional().default(10),
});

export const repertoireRoutes = new Hono();

/**
 * GET /api/repertoire/regional/:regionalId
 * Lista repertório de uma regional
 *
 * Sempre retorna TODAS as músicas com dados de proficiência do usuário (se member_id fornecido).
 * Filtros são aplicados no frontend para simplicidade e performance.
 * 
 * Nota: ultima_pratica vem de study_logs, não de member_repertoire.
 */
repertoireRoutes.get('/regional/:regionalId', async (c) => {
  const regionalId = c.req.param('regionalId');
  const memberId = c.req.query('member_id');
  const db = getDb();

  // Query simples - JOIN para trazer member_data
  let sql = `
    SELECT 
      ri.id, ri.regional_id, ri.nome, ri.autor, ri.descricao, ri.links, ri.metadados,
      ri.tonalidade, ri.notas,
      ri.tem_introducao, ri.tem_tercas, ri.tem_arranjo_6_cordas,
      ri.criado_em, ri.atualizado_em,
      COALESCE(mr.nivel_fluencia, 'precisa_aprender') as nivel_fluencia,
      COALESCE(mr.introducao_aprendida, 0) as introducao_aprendida,
      COALESCE(mr.tercas_aprendidas, 0) as tercas_aprendidas,
      COALESCE(mr.arranjo_6_cordas_aprendido, 0) as arranjo_6_cordas_aprendido,
      COALESCE(mr.notas_pessoais, NULL) as notas_pessoais,
      (
        SELECT MAX(sl.estudado_em)
        FROM study_logs sl
        WHERE sl.repertoire_item_id = ri.id
          AND sl.member_id = ?
      ) as ultima_pratica
    FROM repertoire_items ri
    LEFT JOIN member_repertoire mr 
      ON mr.repertoire_item_id = ri.id 
      AND mr.member_id = ?
    WHERE ri.regional_id = ?
    ORDER BY ri.nome ASC
  `;

  const params = memberId ? [memberId, memberId, regionalId] : [regionalId];
  const rows = db.prepare(sql).all(...params) as any[];

  // Formatar resultados
  const items = rows.map(row => {
    const item: any = {
      id: row.id,
      regional_id: row.regional_id,
      nome: row.nome,
      autor: row.autor,
      descricao: row.descricao,
      links: row.links ? (typeof row.links === 'string' ? JSON.parse(row.links) : row.links) : null,
      metadados: row.metadados ? (typeof row.metadados === 'string' ? JSON.parse(row.metadados) : row.metadados) : null,
      tonalidade: row.tonalidade,
      notas: row.notas,
      tem_introducao: Boolean(row.tem_introducao),
      tem_tercas: Boolean(row.tem_tercas),
      tem_arranjo_6_cordas: Boolean(row.tem_arranjo_6_cordas),
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };

    // Adicionar member_data se member_id foi fornecido
    if (memberId) {
      item.member_data = {
        id: row.id,
        member_id: memberId,
        repertoire_item_id: row.id,
        nivel_fluencia: row.nivel_fluencia,
        introducao_aprendida: Boolean(row.introducao_aprendida),
        tercas_aprendidas: Boolean(row.tercas_aprendidas),
        arranjo_6_cordas_aprendido: Boolean(row.arranjo_6_cordas_aprendido),
        notas_pessoais: row.notas_pessoais,
        ultima_pratica: row.ultima_pratica,
      };
    }

    return item;
  });

  return c.json({ items });
});

/**
 * Buscar sugestões de músicas (autocomplete)
 * Busca músicas já cadastradas no repertório da regional
 *
 * GET /api/repertoire/suggestions?q=Brasileirinho&limit=10
 */
repertoireRoutes.get('/suggestions', async (c) => {
  try {
    const query = c.req.query('q');
    const limitParam = c.req.query('limit');
    const regionalIdParam = c.req.query('regional_id');

    // Validar parâmetros
    const validated = suggestionsSchema.parse({
      q: query,
      limit: limitParam ? parseInt(limitParam, 10) : 10,
    });

    if (!regionalIdParam) {
      return c.json({ error: 'regional_id é obrigatório' }, 400);
    }

    const regionalId = parseInt(regionalIdParam, 10);
    const db = getDb();

    // Buscar músicas que contenham a query
    const searchPattern = `%${validated.q}%`;

    const rows = db.prepare(`
      SELECT id, nome, autor
      FROM repertoire_items
      WHERE regional_id = ?
        AND nome LIKE ?
      ORDER BY nome
      LIMIT ?
    `).all(regionalId, searchPattern, validated.limit) as { id: number; nome: string; autor: string | null }[];

    // Formatrar sugestões
    const suggestions = rows.map(row => ({
      id: row.id,
      nome: row.nome,
      autor: row.autor,
      label: `${row.nome}${row.autor ? ` - ${row.autor}` : ''}`,
    }));

    return c.json({
      query: validated.q,
      suggestions,
      total: suggestions.length,
    });
  } catch (error: any) {
    console.error('[RepertoireRoutes] Erro na busca de sugestões:', error);

    if (error instanceof z.ZodError) {
      return c.json({ error: 'Parâmetros inválidos' }, 400);
    }

    return c.json({ error: error.message || 'Erro ao buscar sugestões' }, 500);
  }
});

// Criar novo item no repertório
repertoireRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const validated = createRepertoireSchema.parse(body);

    const item = await repertoireService.create(validated);

    return c.json({ item }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro ao criar item:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Atualizar item do repertório
repertoireRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = updateRepertoireSchema.parse(body);

    const item = await repertoireService.update(parseInt(id), validated);

    if (!item) {
      return c.json({ error: 'Item não encontrado' }, 404);
    }

    return c.json({ item });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro ao atualizar item:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Deletar item do repertório
repertoireRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const deleted = await repertoireService.delete(parseInt(id));

  if (!deleted) {
    return c.json({ error: 'Item não encontrado' }, 404);
  }

  return c.json({ success: true });
});

// Obter item do repertório por ID (depois de PUT e DELETE para evitar conflitos)
repertoireRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const item = await repertoireService.findById(parseInt(id));

  if (!item) {
    return c.json({ error: 'Item não encontrado' }, 404);
  }

  return c.json({ item });
});

// Importar lista de músicas (parsing de texto)
repertoireRoutes.post('/import', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { texto } = body;

    if (!texto) {
      return c.json({ error: 'Dados inválidos' }, 400);
    }

    // Usa o regional_id do usuário autenticado
    const result = await repertoireService.importList(user.regional_id, texto);

    return c.json(result);
  } catch (error: any) {
    console.error('Erro na importação:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});
