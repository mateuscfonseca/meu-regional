import { Hono } from 'hono';
import { practiceCalendarService } from '../services/practice-calendar.service';

export const practiceCalendarRoutes = new Hono();

// Dados do calendário de práticas (grupo) para um mês específico
practiceCalendarRoutes.get('/member/:memberId/:year/:month', async (c) => {
  const memberId = parseInt(c.req.param('memberId'));
  const year = parseInt(c.req.param('year'));
  const month = parseInt(c.req.param('month'));

  // Validar mês (1-12)
  if (month < 1 || month > 12) {
    return c.json({ error: 'Mês deve ser entre 1 e 12' }, 400);
  }

  // Validar ano (razoável)
  if (year < 2020 || year > 2100) {
    return c.json({ error: 'Ano inválido' }, 400);
  }

  try {
    const calendarData = await practiceCalendarService.getCalendarData(memberId, year, month);
    return c.json(calendarData);
  } catch (error: any) {
    console.error('Erro ao buscar calendário de práticas:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Práticas de uma data específica (usada ao clicar no dia do calendário)
practiceCalendarRoutes.get('/member/:memberId/date/:date', async (c) => {
  const memberId = parseInt(c.req.param('memberId'));
  const date = c.req.param('date');

  // Validar formato da data (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return c.json({ error: 'Data deve estar no formato YYYY-MM-DD' }, 400);
  }

  try {
    const practices = await practiceCalendarService.getPracticesByDate(memberId, date);
    return c.json({ practices });
  } catch (error: any) {
    console.error('Erro ao buscar práticas da data:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});
