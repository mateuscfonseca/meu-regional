import { Hono } from 'hono';
import { authService } from '../services/auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  regionalNome: z.string().min(1),
  regionalDescricao: z.string().optional(),
  membroNome: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6),
  instrumento: z.string().min(1),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const authRoutes = new Hono();

// Registro de regional e primeiro membro
authRoutes.post('/register', async (c) => {
  // Verificar se registro está desabilitado
  if (process.env.DISABLE_REGISTRATION === 'true') {
    return c.json({ error: 'Registro temporariamente desabilitado' }, 403);
  }

  try {
    const body = await c.req.json();
    const validated = registerSchema.parse(body);

    const result = await authService.register(validated);

    c.header('Set-Cookie', `token=${result.token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);

    return c.json({ user: result.user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro no registro:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const validated = loginSchema.parse(body);

    const result = await authService.login(validated);

    c.header('Set-Cookie', `token=${result.token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);

    return c.json({ user: result.user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Erro no login:', error);
    return c.json({ error: error.message || 'Erro interno do servidor' }, 500);
  }
});

// Logout
authRoutes.post('/logout', (c) => {
  c.header('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');
  return c.json({ success: true });
});

// Verificar autenticação
authRoutes.get('/me', async (c) => {
  try {
    const cookie = c.req.header('cookie');
    const tokenMatch = cookie?.match(/token=([^;]+)/);

    if (!tokenMatch) {
      return c.json({ error: 'Não autenticado' }, 401);
    }

    const user = await authService.me(tokenMatch[1]);

    return c.json({ user });
  } catch (error: any) {
    console.error('Erro ao verificar autenticação:', error);
    return c.json({ error: error.message || 'Token inválido' }, 401);
  }
});
