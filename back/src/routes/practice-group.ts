import { Hono } from 'hono';
import { practiceGroupService } from '../services/practice-group.service';
import { z } from 'zod';

const practiceDateSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
});

export const practiceGroupRoutes = new Hono();

// Estatísticas de práticas em grupo
practiceGroupRoutes.get('/member/:memberId/stats', async (c) => {
  const memberId = c.req.param('memberId');
  const stats = await practiceGroupService.getGroupStats(parseInt(memberId));
  return c.json(stats);
});

// Histórico de práticas em grupo
practiceGroupRoutes.get('/member/:memberId/logs', async (c) => {
  const memberId = c.req.param('memberId');
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 100;
  const logs = await practiceGroupService.getGroupLogs(parseInt(memberId), limit);
  return c.json({ logs });
});

// Práticas por data específica
practiceGroupRoutes.get('/member/:memberId/by-date', async (c) => {
  const memberId = c.req.param('memberId');
  const data = c.req.query('data');

  if (!data) {
    return c.json({ error: 'Parâmetro data é obrigatório' }, 400);
  }

  try {
    const validated = practiceDateSchema.parse({ data });
    const practices = await practiceGroupService.getPracticesByDate(parseInt(memberId), validated.data);
    return c.json(practices);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    return c.json({ error: error.message }, 500);
  }
});
