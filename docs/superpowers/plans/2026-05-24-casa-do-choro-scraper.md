# Casa do Choro Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Spotify Playwright scraper with a direct HTTP scraper for the Acervo Casa do Choro, running inside the backend without a separate container.

**Architecture:** Remove the `scraper/` container (Playwright, Hono, Dockerfile) and its backend/frontend integration. Create a new `casa-do-choro.service.ts` that uses Bun's native `fetch()` to call `acervo.casadochoro.com.br/Works/index?title=QUERY` and parses the HTML with regex. Frontend modals replace "Buscar no Spotify" with "Buscar no Acervo Casa do Choro".

**Tech Stack:** Bun fetch (no new dependencies), regex HTML parsing, Hono route

---

### Task 1: Create `casa-do-choro.service.ts`

**Goal:** Service that fetches and parses search results from the Acervo Casa do Choro.

**Files:**
- Create: `back/src/services/casa-do-choro.service.ts`

The service makes a GET request to `https://acervo.casadochoro.com.br/Works/index?title={query}&page={page}`.
Each result in the HTML has the format: `<li> * Nome da Música * Autor * ∙ Gênero </li>`
Regex to extract: `/^\s*\*\s*(.+?)\s*\*\s*(.+?)\s*\*\s*∙\s*(.+?)\s*$/`

- [ ] Create the file with the service implementation

```typescript
export interface AcervoSearchResult {
  nome: string
  autor: string
  genero: string
}

export interface AcervoSearchResponse {
  query: string
  page: number
  results: AcervoSearchResult[]
  total: number
}

const RESULT_REGEX = /^\s*\*\s*(.+?)\s*\*\s*(.+?)\s*\*\s*∙\s*(.+?)\s*$/

export async function searchAcervo(query: string, page: number = 1): Promise<AcervoSearchResponse> {
  const url = `https://acervo.casadochoro.com.br/Works/index?title=${encodeURIComponent(query)}&page=${page}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Erro ao buscar no Acervo Casa do Choro: ${response.status}`)
  }

  const html = await response.text()

  // Extrair todos os <li>...</li>
  const liRegex = /<li>(.*?)<\/li>/gs
  const results: AcervoSearchResult[] = []
  let match

  while ((match = liRegex.exec(html)) !== null) {
    const text = match[1].trim()
    const parsed = text.match(RESULT_REGEX)
    if (parsed) {
      results.push({
        nome: parsed[1].trim(),
        autor: parsed[2].trim(),
        genero: parsed[3].trim(),
      })
    }
  }

  return {
    query,
    page,
    results,
    total: results.length,
  }
}
```

---

### Task 2: Create `casa-do-choro.routes.ts`

**Goal:** Hono route that exposes the search endpoint.

**Files:**
- Create: `back/src/routes/casa-do-choro.ts`

- [ ] Create the route file

```typescript
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
    const result = await searchAcervo(parsed.query, parsed.page)
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
```

---

### Task 3: Register route in `back/src/index.ts`

**Files:**
- Modify: `back/src/index.ts`

- [ ] Add import and route registration

Find the line `app.route('/api/scraper', scraperRoutes)` and replace it with the new route:

```typescript
import { casaDoChoroRoutes } from './routes/casa-do-choro'

// Replace this line:
// app.route('/api/scraper', scraperRoutes)

// With:
app.route('/api/scraper/casa-do-choro', casaDoChoroRoutes)
```

---

### Task 4: Remove Spotify backend code

**Files:**
- Delete: `back/src/services/scraper-client.service.ts`
- Delete: `back/src/services/spotify-scraper.service.ts`
- Delete: `back/src/services/scraper.service.ts`
- Delete: `back/src/routes/scraper.ts`

Also remove the import/registration of scraperRoutes from `back/src/index.ts` if not already done in Task 3.

- [ ] Delete the 4 files
- [ ] Verify no remaining imports reference them

---

### Task 5: Create `useAcervoSearch` composable

**Goal:** Frontend composable that calls the new backend endpoint.

**Files:**
- Create: `app/src/composables/useAcervoSearch.ts`

- [ ] Create the composable

```typescript
import api from '../services/api'
import { ref, readonly } from 'vue'

export interface AcervoResult {
  nome: string
  autor: string
  genero: string
}

export function useAcervoSearch() {
  const results = ref<AcervoResult[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function search(query: string) {
    if (!query || query.length < 2) return

    loading.value = true
    error.value = null
    results.value = []

    try {
      const response = await api.post('/scraper/casa-do-choro/search', { query })
      results.value = response.data.results || []
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao buscar no Acervo'
      results.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearResults() {
    results.value = []
    error.value = null
  }

  return {
    results: readonly(results),
    loading: readonly(loading),
    error: readonly(error),
    search,
    clearResults,
  }
}
```

---

### Task 6: Update `AddMusicModal.vue`

**Files:**
- Modify: `app/src/components/base/AddMusicModal.vue`

Replace Spotify search section with Acervo search.

- [ ] In the `<script>` section:
  - Remove `import { useScraper } from '../../services/scraper'`
  - Add `import { useAcervoSearch } from '../../composables/useAcervoSearch'`
  - Replace `const { searchSpotifyApi, ... } = useScraper()` with `const { results: acervoResults, loading: searching, search: searchAcervo, clearResults } = useAcervoSearch()`

- [ ] In the template section:
  - Replace section title "Buscar no Spotify" with "Buscar no Acervo Casa do Choro"
  - Remove the input for "URL do Spotify" and its "Preencher" button
  - Update the search results binding from spotify results to `acervoResults`

- [ ] In the search handler:
  - Replace `searchSpotifyApi(query)` call with `searchAcervo(query)`

**Key change in the search input:** The Spotify search used debounce with `searchSpotifyApi`. The Acervo search uses the same pattern but calls `searchAcervo()` instead. Keep the same debounce logic (500ms, minimum 3 characters).

---

### Task 7: Update `EditMusicModal.vue`

**Files:**
- Modify: `app/src/components/base/EditMusicModal.vue`

Identical changes to Task 6, but in the single-edit modal.

- [ ] Same import replacement: `useScraper` → `useAcervoSearch`
- [ ] Same template changes: label, remove URL input, bind to `acervoResults`
- [ ] Same handler change: `searchSpotifyApi` → `searchAcervo`

---

### Task 8: Update `EditMusicSequentialModal.vue`

**Files:**
- Modify: `app/src/components/base/EditMusicSequentialModal.vue`

Identical changes to Task 6, but in the sequential-edit modal.

- [ ] Same import replacement: `useScraper` → `useAcervoSearch`
- [ ] Same template changes: label, remove URL input, bind to `acervoResults`
- [ ] Same handler change: `searchSpotifyApi` → `searchAcervo`

---

### Task 9: Remove Spotify frontend code

**Files:**
- Delete: `app/src/services/scraper.ts`
- Delete: `app/src/views/SettingsSpotifyView.vue`
- Modify: `app/src/views/IntegrationsView.vue` — remove Spotify tab/section
- Modify: `app/src/router/index.ts` — remove `/integrations/spotify` route

- [ ] Delete `app/src/services/scraper.ts`
- [ ] Delete `app/src/views/SettingsSpotifyView.vue`

- [ ] In `IntegrationsView.vue`:
  Remove the Spotify tab and its content. If the page has no other integrations, simplify to show a message like "Nenhuma integração disponível no momento."

- [ ] In `router/index.ts`:
  Remove the child route for `/integrations/spotify`:
  ```typescript
  // Remove this block:
  // {
  //   path: 'spotify',
  //   name: 'settings-spotify',
  //   component: () => import('../views/SettingsSpotifyView.vue'),
  // },
  ```

---

### Task 10: Remove Spotify from infraestrutura

**Files:**
- Modify: `docker-compose.yml`
- Modify: `deploy.sh`
- Modify: `.env.example` (raiz)
- Modify: `back/Dockerfile`

- [ ] In `docker-compose.yml`:
  - Remove the `scraper` service block entirely
  - Remove `SCRAPER_API_URL` from the `backend` service environment

- [ ] In `deploy.sh`:
  - Remove the line `docker compose build scraper` (or similar)

- [ ] In `.env.example` (raiz):
  - Remove `SCRAPER_API_URL=http://scraper:4000`
  - Remove `SCRAPER_HEADLESS=true`
  - Remove `SPOTIFY_EMAIL=`
  - Remove `SPOTIFY_PASSWORD=`

- [ ] In `back/Dockerfile`:
  - Remove `ENV SCRAPER_HEADLESS=true`

---

### Task 11: Update documentation

**Files:**
- Delete: `docs/spotify-scraping.md`
- Modify: `README.md` (raiz)
- Modify: `back/README.md`
- Modify: `app/README.md`

- [ ] Delete `docs/spotify-scraping.md`

- [ ] In `README.md` (raiz):
  - Remove Spotify from stack description
  - Remove Spotify scraper endpoints from API table
  - Remove "Configuração do Spotify Scraper" section
  - Remove Spotify env vars from setup instructions

- [ ] In `back/README.md`:
  - Remove Spotify scraper sections

- [ ] In `app/README.md`:
  - Remove `useScraper()` usage example

---

### Task 12: Build and test

- [ ] Run `cd back && bun run check` (or `bun run test`) to verify backend compiles
- [ ] Run `cd app && bun run build` to verify frontend builds without errors
- [ ] Fix any compilation errors found
