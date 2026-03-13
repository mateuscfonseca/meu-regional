import { Hono } from 'hono';
import { regionaisService } from '../services/regionais.service';
import { z } from 'zod';

const createRegionalSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
});

export const regionaisRoutes = new Hono();

// Listar regionais (para admin ou listagem geral)
regionaisRoutes.get('/', async (c) => {
  const regionais = await regionaisService.findAll();
  return c.json({ regionais });
});

// Obter regional por ID
regionaisRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const regional = await regionaisService.findById(parseInt(id));

  if (!regional) {
    return c.json({ error: 'Regional não encontrado' }, 404);
  }

  return c.json({ regional });
});

// Criar nova regional
regionaisRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const validated = createRegionalSchema.parse(body);

    const regional = await regionaisService.create(validated);

    return c.json({ regional }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro ao criar regional:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Atualizar regional
regionaisRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = createRegionalSchema.partial().parse(body);

    const regional = await regionaisService.update(parseInt(id), validated);

    if (!regional) {
      return c.json({ error: 'Regional não encontrado' }, 404);
    }

    return c.json({ regional });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro ao atualizar regional:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});
