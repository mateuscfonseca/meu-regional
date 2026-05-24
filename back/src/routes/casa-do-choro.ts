import { Hono } from 'hono'
import { z } from 'zod'
import { searchAcervo } from '../services/casa-do-choro.service'

const casaDoChoroRoutes = new Hono()

const searchSchema = z.object({
  query: z.string().min(1, 'query é obrigatória'),
  page: z.number().int().positive().optional().default(1),
})

casaDoChoroRoutes.post('/search', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = searchSchema.parse(body)
    console.log(`[CasaDoChoro] POST /search: query="${parsed.query}", page=${parsed.page}`)
    const result = await searchAcervo(parsed.query, parsed.page)
    console.log(`[CasaDoChoro] Resultado: ${result.results.length} resultados`)
    return c.json(result)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json({ error: 'Dados inválidos', details: err.errors }, 400)
    }
    console.error('[CasaDoChoro] Erro na busca:', err)
    return c.json({ error: 'Erro ao buscar no Acervo Casa do Choro' }, 500)
  }
})

export { casaDoChoroRoutes }
