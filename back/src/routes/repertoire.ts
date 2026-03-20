import { Hono } from 'hono';
import { repertoireService } from '../services/repertoire.service';
import { authService } from '../services/auth.service';
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
  tonalidade_modo: z.string().optional(),
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
  tonalidade_modo: z.string().optional(),
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

  try {
    // Parsear filtros da query string
    const filters: any = {};
    
    if (memberId) {
      filters.memberId = parseInt(memberId, 10);
    }
    
    if (c.req.query('nao_praticadas_ha')) {
      filters.nao_praticadas_ha = parseInt(c.req.query('nao_praticadas_ha')!, 10);
    }
    
    if (c.req.query('nivel_fluencia')) {
      filters.nivel_fluencia = c.req.query('nivel_fluencia');
    }
    
    if (c.req.query('tem_introducao')) {
      filters.tem_introducao = c.req.query('tem_introducao') === 'true';
    }
    
    if (c.req.query('introducao_aprendida')) {
      filters.introducao_aprendida = c.req.query('introducao_aprendida') === 'true';
    }
    
    if (c.req.query('tercas_aprendidas')) {
      filters.tercas_aprendidas = c.req.query('tercas_aprendidas') === 'true';
    }
    
    if (c.req.query('arranjo_6_cordas_aprendido')) {
      filters.arranjo_6_cordas_aprendido = c.req.query('arranjo_6_cordas_aprendido') === 'true';
    }

    const items = await repertoireService.findByRegionalWithFilters(
      parseInt(regionalId),
      filters
    );

    return c.json({ items });
  } catch (error: any) {
    console.error('[RepertoireRoutes] Erro ao listar repertório:', error);
    return c.json({ error: error.message || 'Erro ao buscar repertório' }, 500);
  }
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

    // Buscar sugestões
    const suggestions = await repertoireService.findSuggestions(
      regionalId,
      validated.q,
      validated.limit
    );

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
