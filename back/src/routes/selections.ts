import { Hono } from 'hono';
import { selectionsService } from '../services/selections.service';
import { z } from 'zod';

const createSelectionSchema = z.object({
  regional_id: z.number(),
  nome: z.string().min(1),
  descricao: z.string().optional(),
  data_evento: z.string().optional(),
  max_musicas: z.number().default(30),
  criada_por: z.number(),
});

const voteSchema = z.object({
  repertoire_item_id: z.number(),
  member_id: z.number(),
});

export const selectionsRoutes = new Hono();

// Listar seleções de uma regional
selectionsRoutes.get('/regional/:regionalId', async (c) => {
  const regionalId = c.req.param('regionalId');
  const selections = await selectionsService.findByRegional(parseInt(regionalId));
  return c.json({ selections });
});

// Obter seleção por ID com detalhes
selectionsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const detail = await selectionsService.findDetailById(parseInt(id));

  if (!detail) {
    return c.json({ error: 'Seleção não encontrada' }, 404);
  }

  return c.json(detail);
});

// Criar nova seleção
selectionsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const validated = createSelectionSchema.parse(body);

    const selection = await selectionsService.create(validated);

    return c.json({ selection }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro ao criar seleção:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Votar em uma música para seleção
selectionsRoutes.post('/:id/vote', async (c) => {
  try {
    const selectionId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const validated = voteSchema.parse(body);

    await selectionsService.vote({
      selection_id: selectionId,
      member_id: validated.member_id,
      repertoire_item_id: validated.repertoire_item_id,
    });

    return c.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro ao votar:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Remover voto
selectionsRoutes.delete('/:id/vote/:memberId', async (c) => {
  const selectionId = parseInt(c.req.param('id'));
  const memberId = parseInt(c.req.param('memberId'));
  const { repertoire_item_id } = c.req.query();

  if (!repertoire_item_id) {
    return c.json({ error: 'repertoire_item_id é obrigatório' }, 400);
  }

  await selectionsService.removeVote(selectionId, memberId, parseInt(repertoire_item_id));

  return c.json({ success: true });
});

// Finalizar seleção (calcular mais votadas)
selectionsRoutes.post('/:id/finalize', async (c) => {
  try {
    const selectionId = parseInt(c.req.param('id'));
    const { max_musicas } = await c.req.json();

    const total = await selectionsService.finalize(selectionId, max_musicas);

    return c.json({ success: true, total });
  } catch (error: any) {
    console.error('Erro ao finalizar seleção:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Reabrir votação
selectionsRoutes.post('/:id/reopen', async (c) => {
  const selectionId = c.req.param('id');

  await selectionsService.reopen(parseInt(selectionId));

  return c.json({ success: true });
});
