import { Hono } from 'hono';
import { studyLogsService } from '../services/studyLogs.service';
import { z } from 'zod';

const studyLogSchema = z.object({
  member_id: z.number(),
  repertoire_item_id: z.number(),
  tipo: z.enum(['individual', 'grupo']),
  duracao_minutos: z.number().optional(),
  notas: z.string().optional(),
  data: z.string().optional(),
});

export const studyLogsRoutes = new Hono();

// Listar logs de estudo de um membro
studyLogsRoutes.get('/member/:memberId', async (c) => {
  const memberId = c.req.param('memberId');
  const logs = await studyLogsService.findByMember(parseInt(memberId));
  return c.json({ logs });
});

// Listar logs de estudo de uma música
studyLogsRoutes.get('/repertoire/:repertoireId', async (c) => {
  const repertoireId = c.req.param('repertoireId');
  const logs = await studyLogsService.findByRepertoire(parseInt(repertoireId));
  return c.json({ logs });
});

// Criar log de estudo
studyLogsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const validated = studyLogSchema.parse(body);

    const log = await studyLogsService.create(validated);

    return c.json({ log }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro ao criar log de estudo:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Estatísticas de estudo de um membro
studyLogsRoutes.get('/member/:memberId/stats', async (c) => {
  const memberId = c.req.param('memberId');
  const stats = await studyLogsService.getStats(parseInt(memberId));

  return c.json(stats);
});
