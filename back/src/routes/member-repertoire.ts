/**
 * Member Repertoire Routes
 *
 * Rotas para gerenciar dados de proficiência de membros para itens do repertório.
 * Cada membro tem seu próprio status de aprendizado para cada música.
 */

import { Hono } from 'hono';
import { memberRepertoireService } from '../services/member-repertoire.service';
import { authService } from '../services/auth.service';
import { z } from 'zod';

/**
 * Middleware de autenticação
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

// Schema para criar/atualizar dados de membro no repertório
const upsertMemberRepertoireSchema = z.object({
  nivel_fluencia: z.enum(['precisa_aprender', 'tirada', 'tocando_bem', 'tirando_onda']).optional(),
  introducao_aprendida: z.boolean().optional(),
  tercas_aprendidas: z.boolean().optional(),
  arranjo_6_cordas_aprendido: z.boolean().optional(),
  notas_pessoais: z.string().optional(),
});

// Schema para filtros de busca
const filtersSchema = z.object({
  nivel_fluencia: z.string().optional(),
  introducao_aprendida: z.coerce.boolean().optional(),
  tercas_aprendidas: z.coerce.boolean().optional(),
  arranjo_6_cordas_aprendido: z.coerce.boolean().optional(),
});

export const memberRepertoireRoutes = new Hono();

/**
 * GET /api/member-repertoire/regional/:regionalId
 * Lista todos os itens do repertório de uma regional com status de um membro específico
 * Query params: member_id (obrigatório)
 */
memberRepertoireRoutes.get('/regional/:regionalId', authMiddleware, async (c) => {
  try {
    const regionalId = parseInt(c.req.param('regionalId'));
    const memberIdParam = c.req.query('member_id');

    if (!memberIdParam) {
      return c.json({ error: 'member_id é obrigatório' }, 400);
    }

    const memberId = parseInt(memberIdParam);

    // Buscar dados do membro para os itens do repertório
    const memberData = await memberRepertoireService.findByMemberWithItems(memberId, regionalId);

    return c.json({
      items: memberData,
      total: memberData.length,
    });
  } catch (error: any) {
    console.error('[MemberRepertoireRoutes] Erro ao listar:', error);
    return c.json({ error: error.message || 'Erro ao listar dados' }, 500);
  }
});

/**
 * GET /api/member-repertoire/item/:itemId/member/:memberId
 * Obtém dados de um membro para um item específico do repertório
 */
memberRepertoireRoutes.get('/item/:itemId/member/:memberId', authMiddleware, async (c) => {
  try {
    const itemId = parseInt(c.req.param('itemId'));
    const memberId = parseInt(c.req.param('memberId'));

    const data = await memberRepertoireService.findByMemberAndItem(memberId, itemId);

    if (!data) {
      return c.json({ error: 'Dados não encontrados' }, 404);
    }

    return c.json({ data });
  } catch (error: any) {
    console.error('[MemberRepertoireRoutes] Erro ao buscar:', error);
    return c.json({ error: error.message || 'Erro ao buscar dados' }, 500);
  }
});

/**
 * GET /api/member-repertoire/member/:memberId
 * Lista todos os dados de repertório de um membro
 */
memberRepertoireRoutes.get('/member/:memberId', authMiddleware, async (c) => {
  try {
    const memberId = parseInt(c.req.param('memberId'));

    // Query params para filtros
    const query = c.req.query();
    const filters = filtersSchema.safeParse(query);

    if (!filters.success) {
      return c.json({ error: 'Parâmetros inválidos' }, 400);
    }

    const data = await memberRepertoireService.findByMember(memberId);

    // Aplicar filtros se existirem
    let filteredData = data;
    if (filters.data.nivel_fluencia) {
      filteredData = filteredData.filter(item => item.nivel_fluencia === filters.data.nivel_fluencia);
    }
    if (filters.data.introducao_aprendida !== undefined) {
      filteredData = filteredData.filter(item => item.introducao_aprendida === filters.data.introducao_aprendida);
    }
    if (filters.data.tercas_aprendidas !== undefined) {
      filteredData = filteredData.filter(item => item.tercas_aprendidas === filters.data.tercas_aprendidas);
    }
    if (filters.data.arranjo_6_cordas_aprendido !== undefined) {
      filteredData = filteredData.filter(item => item.arranjo_6_cordas_aprendido === filters.data.arranjo_6_cordas_aprendido);
    }

    return c.json({
      data: filteredData,
      total: filteredData.length,
    });
  } catch (error: any) {
    console.error('[MemberRepertoireRoutes] Erro ao listar:', error);
    return c.json({ error: error.message || 'Erro ao listar dados' }, 500);
  }
});

/**
 * POST /api/member-repertoire
 * Cria ou atualiza (upsert) dados de um membro para um item do repertório
 */
memberRepertoireRoutes.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Validar dados
    const validated = upsertMemberRepertoireSchema.parse(body);

    // Verificar se repertoire_item_id foi fornecido
    if (!body.repertoire_item_id) {
      return c.json({ error: 'repertoire_item_id é obrigatório' }, 400);
    }

    // Usar member_id do usuário autenticado
    const data = await memberRepertoireService.upsert(
      user.id,
      parseInt(body.repertoire_item_id),
      validated
    );

    return c.json({ data });
  } catch (error: any) {
    console.error('[MemberRepertoireRoutes] Erro ao criar/atualizar:', error);

    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }

    return c.json({ error: error.message || 'Erro ao salvar dados' }, 500);
  }
});

/**
 * PUT /api/member-repertoire/item/:itemId
 * Atualiza dados de um membro para um item específico
 */
memberRepertoireRoutes.put('/item/:itemId', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const itemId = parseInt(c.req.param('itemId'));
    const body = await c.req.json();

    // Validar dados
    const validated = upsertMemberRepertoireSchema.parse(body);

    // Buscar registro existente
    const existing = await memberRepertoireService.findByMemberAndItem(user.id, itemId);

    if (!existing) {
      // Se não existir, criar
      const data = await memberRepertoireService.create({
        member_id: user.id,
        repertoire_item_id: itemId,
        ...validated,
      });
      return c.json({ data });
    }

    // Atualizar existente
    await memberRepertoireService.update(existing.id, validated);
    const data = await memberRepertoireService.findByMemberAndItem(user.id, itemId);

    return c.json({ data });
  } catch (error: any) {
    console.error('[MemberRepertoireRoutes] Erro ao atualizar:', error);

    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }

    return c.json({ error: error.message || 'Erro ao atualizar dados' }, 500);
  }
});

/**
 * DELETE /api/member-repertoire/item/:itemId
 * Remove dados de um membro para um item específico
 */
memberRepertoireRoutes.delete('/item/:itemId', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const itemId = parseInt(c.req.param('itemId'));

    const deleted = await memberRepertoireService.deleteByMemberAndItem(user.id, itemId);

    if (!deleted) {
      return c.json({ error: 'Registro não encontrado' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[MemberRepertoireRoutes] Erro ao excluir:', error);
    return c.json({ error: error.message || 'Erro ao excluir dados' }, 500);
  }
});

/**
 * POST /api/member-repertoire/initialize
 * Cria registro vazio em member_repertoire se não existir
 * Usado quando usuário começa a editar dados pessoais de uma música
 */
memberRepertoireRoutes.post('/initialize', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    if (!body.repertoire_item_id) {
      return c.json({ error: 'repertoire_item_id é obrigatório' }, 400);
    }
    
    if (!user || !user.id) {
      return c.json({ error: 'Usuário não autenticado ou member_id não encontrado' }, 401);
    }

    const repertoireItemId = parseInt(body.repertoire_item_id);

    // Verificar se já existe (user.id é o member_id)
    const existing = await memberRepertoireService.findByMemberAndItem(
      user.id,
      repertoireItemId
    );

    if (existing) {
      return c.json({
        success: true,
        message: 'Registro já existe',
        data: existing
      });
    }

    // Criar registro vazio
    const data = await memberRepertoireService.create({
      member_id: user.id,
      repertoire_item_id: repertoireItemId,
    });

    return c.json({
      success: true,
      message: 'Registro criado com sucesso',
      data
    });
  } catch (error: any) {
    console.error('[MemberRepertoireRoutes] Erro ao inicializar:', error);
    return c.json({ error: error.message || 'Erro ao inicializar dados' }, 500);
  }
});
