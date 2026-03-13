import { Hono } from 'hono';
import { membersService } from '../services/members.service';
import { z } from 'zod';

const createMemberSchema = z.object({
  regional_id: z.number(),
  nome: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6),
  instrumento: z.string().min(1),
});

const updateMemberSchema = z.object({
  nome: z.string().min(1).optional(),
  instrumento: z.string().min(1).optional(),
});

export const membersRoutes = new Hono();

// Listar membros de uma regional
membersRoutes.get('/regional/:regionalId', async (c) => {
  const regionalId = c.req.param('regionalId');
  const members = await membersService.findByRegional(parseInt(regionalId));
  return c.json({ members });
});

// Obter membro por ID
membersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const member = await membersService.findById(parseInt(id));

  if (!member) {
    return c.json({ error: 'Membro não encontrado' }, 404);
  }

  return c.json({ member });
});

// Criar novo membro
membersRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const validated = createMemberSchema.parse(body);

    const member = await membersService.create(validated);

    return c.json({ member }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro ao criar membro:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Atualizar membro
membersRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = updateMemberSchema.parse(body);

    const member = await membersService.update(parseInt(id), validated);

    if (!member) {
      return c.json({ error: 'Membro não encontrado' }, 404);
    }

    return c.json({ member });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro ao atualizar membro:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Deletar membro
membersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const deleted = await membersService.delete(parseInt(id));

  if (!deleted) {
    return c.json({ error: 'Membro não encontrado' }, 404);
  }

  return c.json({ success: true });
});
