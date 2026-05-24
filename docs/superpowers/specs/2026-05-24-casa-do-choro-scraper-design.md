# Substituir Scraper Spotify → Acervo Casa do Choro

**Data:** 2026-05-24
**Status:** Aprovado

## Motivação

O scraper do Spotify está sendo bloqueado pelo Spotify. Como o foco do aplicativo
"Meu Regional" é o estudo de repertório de choro, faz mais sentido buscar
diretamente no maior acervo de choro do Brasil: o
[Acervo Casa do Choro](https://acervo.casadochoro.com.br/).

## Arquitetura

```
[Frontend Vue] --POST /api/scraper/casa-do-choro/search--> [Backend Hono]
                                                              |
                                                     fetch() direto
                                                              |
                                              acervo.casadochoro.com.br
```

Diferente da arquitetura anterior (com container Playwright separado), o novo
scraper roda **dentro do backend** — sem container extra, sem navegador
headless, sem dependências novas. O site do Acervo retorna HTML puro
(estático), então `fetch()` nativo do Bun + regex é suficiente.

## Formato da Resposta do Acervo

URL de busca:
```
https://acervo.casadochoro.com.br/Works/index?title={query}&page={page}
```

HTML retornado (cada resultado):
```html
<li> * Nome da Música * Autor * ∙ Gênero </li>
```

Paginação via parâmetro `&page=N`.

## Componentes

### Backend: `back/src/services/casa-do-choro.service.ts`

Serviço sem dependências externas.

```typescript
interface AcervoResult {
  nome: string
  autor: string
  genero: string
}

async function search(query: string, page?: number): Promise<{
  results: AcervoResult[]
  page: number
  total: number
}>
```

- Usa `fetch()` nativo do Bun
- Regex: `/^\s*\*\s*(.+?)\s*\*\s*(.+?)\s*\*\s*∙\s*(.+?)\s*$/`
- `total` calculado pelo número de `<li>` retornados

### Backend: `back/src/routes/casa-do-choro.ts`

| Método | Rota | Input | Output |
|--------|------|-------|--------|
| POST | `/api/scraper/casa-do-choro/search` | `{ query: string, page?: number }` | `{ query, page, results: AcervoResult[], total }` |

### Frontend: `app/src/composables/useAcervoSearch.ts`

Composable leve que substitui `useScraper()`:

```typescript
function useAcervoSearch() {
  async function search(query: string) { ... }
  return { search }
}
```

### Modais (3 arquivos)

- `AddMusicModal.vue`
- `EditMusicModal.vue`
- `EditMusicSequentialModal.vue`

Em cada um: substituir seção "Buscar no Spotify" por "Buscar no Acervo Casa do
Choro". O comportamento visual é idêntico — input de busca com debounce,
resultados clicáveis que preenchem nome/autor. Remove o campo de URL do Spotify.

## Remoções

### Container scraper (`scraper/` — 11 arquivos)

Diretório inteiro removido: servidor Hono, Playwright, Dockerfile, scripts de
teste, documentação, lockfile.

### Backend (5 arquivos)

| Arquivo | Motivo |
|---------|--------|
| `back/src/services/scraper-client.service.ts` | Cliente HTTP para container removido |
| `back/src/services/spotify-scraper.service.ts` | Facade Spotify |
| `back/src/services/scraper.service.ts` | Classe base abstrata não utilizada |
| `back/src/routes/scraper.ts` | Rotas Spotify |
| `back/src/index.ts` (linha do scraper) | Registro de rota |

### Frontend (3 arquivos + 3 modais)

| Arquivo | Motivo |
|---------|--------|
| `app/src/services/scraper.ts` | Serviço useScraper |
| `app/src/views/SettingsSpotifyView.vue` | Página de configuração |
| `app/src/views/IntegrationsView.vue` | Aba Spotify removida |
| `app/src/router/index.ts` | Rota `/integrations/spotify` |

### Infraestrutura

| Item | Mudança |
|------|---------|
| `docker-compose.yml` | Remove serviço `scraper` e `SCRAPER_API_URL` do backend |
| `deploy.sh` | Remove `docker compose build scraper` |
| `.env.example` | Remove `SPOTIFY_EMAIL`, `SPOTIFY_PASSWORD`, `SCRAPER_API_URL`, `SCRAPER_HEADLESS` |
| `back/Dockerfile` | Remove `ENV SCRAPER_HEADLESS` |

### Documentação

- `docs/spotify-scraping.md` — removido
- `README.md` (raiz, back, app) — remove menções ao Spotify

## Testes

- Teste unitário do serviço `casa-do-choro.service.ts` com HTML mockado
- Teste de integração da rota `POST /api/scraper/casa-do-choro/search`
- Teste manual: buscar "treme" e confirmar que retorna "Treme-treme" de Jacob do Bandolim
