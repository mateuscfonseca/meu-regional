# Spotify Web Scraping

Documentação técnica sobre o sistema de web scraping do Spotify para extração de metadados de músicas.

## 🎯 Visão Geral

O sistema utiliza [Playwright](https://playwright.dev/) para automatizar um browser headless que:

1. Faz login no Spotify com credenciais configuradas
2. Busca músicas por nome/query
3. Extrai metadados de páginas de músicas
4. Cacheia resultados para performance

## ⚙️ Configuração

### 1. Criar Conta Spotify

Você precisa de uma conta Spotify válida (pode ser a free):

1. Acesse [Spotify](https://www.spotify.com/)
2. Crie uma conta ou use uma existente

### 2. Configurar Credenciais

No arquivo `.env` do backend:

```env
SPOTIFY_EMAIL=seu-email@exemplo.com
SPOTIFY_PASSWORD=sua-senha-aqui
SCRAPER_HEADLESS=true
```

### 3. Reiniciar o Backend

```bash
# Local
bun run dev

# Docker
docker-compose restart backend
```

## 🔍 Como Funciona

### Fluxo de Login

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Primeira   │────▶│  Navega para │────▶│  Preenche   │
│  Requisição │     │  login       │     │  formulário │
└─────────────┘     └──────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Browser    │◀────│  Redireciona │◀────│  Clica em   │
│  fecha      │     │  open.spotify│     │  login      │
└─────────────┘     └──────────────┘     └─────────────┘
```

**Nota**: O login é feito apenas uma vez por sessão. O browser permanece aberto para requisições subsequentes.

### Metadados Extraídos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `nome` | string | Nome da música |
| `autor` | string | Nome do(s) artista(s) |
| `album` | string? | Nome do álbum |
| `ano` | string? | Ano de lançamento |
| `thumbnail` | string? | URL da capa do álbum |

## 📡 Endpoints da API

### Health Check

Verifica se o scraper está configurado:

```bash
GET /api/scraper/health
```

**Resposta:**
```json
{
  "status": "ok",
  "spotify": {
    "configured": true,
    "headless": true
  }
}
```

### Buscar por Query

```bash
POST /api/scraper/spotify/search
Content-Type: application/json

{
  "query": "Brasileirinho"
}
```

**Resposta:**
```json
{
  "query": "Brasileirinho",
  "results": [
    {
      "nome": "Brasileirinho",
      "autor": "Waldir Azevedo",
      "album": "Choro Brasileiro",
      "ano": "1949"
    }
  ],
  "total": 1
}
```

### Buscar Primeiro Resultado

Útil para autocomplete:

```bash
POST /api/scraper/spotify/search-first
Content-Type: application/json

{
  "query": "Brasileirinho"
}
```

**Resposta:**
```json
{
  "query": "Brasileirinho",
  "result": {
    "nome": "Brasileirinho",
    "autor": "Waldir Azevedo",
    "album": "Choro Brasileiro",
    "ano": "1949"
  }
}
```

### Extrair de URL

```bash
POST /api/scraper/spotify/metadata
Content-Type: application/json

{
  "url": "https://open.spotify.com/track/4uLU6hMCxMI75M1o2JTpkT"
}
```

**Resposta:**
```json
{
  "url": "https://open.spotify.com/track/4uLU6hMCxMI75M1o2JTpkT",
  "metadata": {
    "nome": "Brasileirinho",
    "autor": "Waldir Azevedo",
    "album": "Choro Brasileiro",
    "ano": "1949",
    "thumbnail": "https://i.scdn.co/image/ab67616d0000b273..."
  }
}
```

## 💾 Cache

O sistema implementa cache para:

- Evitar requisições repetidas
- Melhorar performance
- Reduzir risco de rate limiting

### Duração do Cache

- **TTL**: 24 horas (86400 segundos)
- **Armazenamento**: Banco de dados SQLite
- **Tabela**: `scraper_cache`

### Gerenciando Cache

```bash
# Ver status do cache
GET /api/scraper/cache/status

# Limpar cache
POST /api/scraper/cache/clear
```

## ⚠️ Limitações e Cuidados

### 1. Rate Limiting

O Spotify pode limitar requisições excessivas. O cache ajuda a mitigar isso.

### 2. Captcha/Verificação

Em casos raros, o Spotify pode solicitar verificação adicional:

- Use credenciais de uma conta real
- Evite muitas requisições em curto período
- Em produção, use `SCRAPER_HEADLESS=false` para debug

### 3. Mudanças no Layout

O scraper depende do layout atual do Spotify. Se o Spotify mudar:

- Atualizar seletores CSS no código
- Atualizar `spotify-scraper.service.ts`

### 4. Conta Free vs Premium

Funciona com ambos, mas:

- **Free**: Pode ter anúncios que interferem no scraping
- **Premium**: Experiência mais limpa

## 🐛 Troubleshooting

### Erro: "Credenciais inválidas"

```
Falha no login: credenciais inválidas ou verificação necessária
```

**Soluções:**
1. Verifique email e senha no `.env`
2. Tente logar manualmente no Spotify para verificar a conta
3. Se houver verificação 2FA, resolva manualmente primeiro

### Erro: "Timeout"

```
Timeout 30000 exceeded
```

**Soluções:**
1. Aumente o timeout no `.env`: `SCRAPER_TIMEOUT=60000`
2. Verifique conexão com internet
3. Spotify pode estar lento - tente novamente

### Erro: "Element not found"

```
Track list não encontrado
```

**Soluções:**
1. O layout do Spotify pode ter mudado
2. Atualizar seletores em `spotify-scraper.service.ts`
3. Reporte o issue para manutenção

### Browser não fecha após requisições

```
Browser permanece aberto consumindo memória
```

**Solução:**
```bash
# Reinicie o backend
docker-compose restart backend
```

## 🔧 Desenvolvimento

### Modo Debug

Para ver o browser em ação (útil para debug):

```env
SCRAPER_HEADLESS=false
```

O browser será visível e você poderá ver o login e busca acontecendo.

### Adicionar Novo Scraper (YouTube, Tidal)

Siga o padrão do Spotify:

1. Crie `src/services/youtube-scraper.service.ts`
2. Estenda `BaseScraper`
3. Implemente `search()` e `getMetadataByUrl()`
4. Registre em `scraper.routes.ts`

Exemplo:
```typescript
import { BaseScraper, ScrapedMetadata } from './scraper.service';

export class YouTubeScraper extends BaseScraper {
  async search(query: string): Promise<ScrapedMetadata[]> {
    // Implementação
  }

  async getMetadataByUrl(url: string): Promise<ScrapedMetadata | null> {
    // Implementação
  }
}
```

## 📊 Métricas

### Tabela scraper_cache

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER | Primary key |
| `source` | TEXT | Origem (spotify, youtube, etc.) |
| `query` | TEXT | Query ou URL buscada |
| `result` | TEXT | JSON com resultados |
| `created_at` | DATETIME | Quando foi cacheado |
| `expires_at` | DATETIME | Quando expira |

### Queries Úteis

```sql
-- Ver tamanho do cache
SELECT COUNT(*) FROM scraper_cache;

-- Ver cache por fonte
SELECT source, COUNT(*) FROM scraper_cache GROUP BY source;

-- Limpar cache expirado
DELETE FROM scraper_cache WHERE expires_at <= datetime('now');

-- Limpar todo cache
DELETE FROM scraper_cache;
```

## 📝 Considerações Legais

### Termos de Serviço

O web scraping pode violar os Termos de Serviço do Spotify. Use com responsabilidade:

- Apenas para uso pessoal
- Não faça requisições em massa
- Respeite rate limits

### Alternativa Oficial

Se precisar de uso em produção em larga escala, considere a [API Oficial do Spotify](https://developer.spotify.com/documentation/web-api):

1. Crie um app em [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Obtenha Client ID e Client Secret
3. Use OAuth para autenticação

## 📚 Referências

- [Playwright Documentation](https://playwright.dev/)
- [Spotify Web Player](https://open.spotify.com/)
- [Spotify Developer](https://developer.spotify.com/)
