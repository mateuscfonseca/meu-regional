# Scraper Service - Web Scraping Isolado

Serviço standalone para web scraping que roda em um container separado, isolando o browser headless da aplicação principal.

## 🎯 Arquitetura

```
┌─────────────────┐     HTTP      ┌─────────────────┐
│   Backend API   │ ────────────▶ │  Scraper API    │
│   (port 3000)   │               │  (port 4000)    │
│                 │               │                 │
│  - Hono         │               │  - Hono         │
│  - SQLite       │               │  - Playwright   │
│  - JWT          │               │  - Chrome       │
└─────────────────┘               └─────────────────┘
```

## 📋 Pré-requisitos

- **Docker** (recomendado) ou **Bun** para desenvolvimento local
- **Conta Spotify** válida (email e senha)
- Mínimo de **512MB** de memória RAM disponível

## 🚀 Como Rodar

### Opção 1: Docker (Recomendado)

```bash
# Na raiz do projeto, inicie todos os serviços
docker-compose up -d

# Ou apenas o scraper
docker-compose up -d scraper
```

O serviço estará disponível em `http://localhost:4000`

### Opção 2: Desenvolvimento Local

```bash
# Entrar no diretório
cd scraper

# Instalar dependências
bun install

# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env com suas credenciais do Spotify
nano .env  # ou use seu editor preferido

# Rodar serviço
bun run dev
```

O serviço estará em `http://localhost:4000`

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório | Padrão |
|----------|-----------|-------------|--------|
| `PORT` | Porta do serviço | Não | 4000 |
| `HEADLESS` | Modo headless do browser (`true`/`false`) | Não | `true` |
| `SPOTIFY_EMAIL` | Email da conta Spotify | **Sim** | - |
| `SPOTIFY_PASSWORD` | Senha da conta Spotify | **Sim** | - |

### Exemplo de `.env`

```env
PORT=4000
HEADLESS=true
SPOTIFY_EMAIL=seu-email@exemplo.com
SPOTIFY_PASSWORD=sua-senha-aqui
```

## 📡 API Endpoints

### Health Checks

#### Health do Serviço
```bash
GET /health
```

**Resposta:**
```json
{
  "status": "ok",
  "service": "scraper",
  "timestamp": "2026-03-10T23:00:00.000Z"
}
```

#### Health do Browser
```bash
GET /browser/health
```

**Resposta:**
```json
{
  "browser": "running",
  "context": "active",
  "isLoggedIn": true
}
```

---

### Autenticação

#### Spotify Login
```bash
POST /spotify/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso"
}
```

---

### Busca de Músicas

#### Spotify Search (Completo)
```bash
POST /spotify/search
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
    },
    {
      "nome": "Brasileirinho",
      "autor": "Paulo Bellinati",
      "album": "Afro Brasileirinho",
      "ano": "2006"
    }
  ],
  "total": 2
}
```

#### Spotify Search First (Primeiro Resultado)
```bash
POST /spotify/search-first
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

---

### Metadados por URL

#### Spotify Metadata by URL
```bash
POST /spotify/metadata
Content-Type: application/json

{
  "url": "https://open.spotify.com/track/4uLU6hMCxMI75M1A2ATKU4"
}
```

**Resposta:**
```json
{
  "url": "https://open.spotify.com/track/4uLU6hMCxMI75M1A2ATKU4",
  "metadata": {
    "nome": "Brasileirinho",
    "autor": "Waldir Azevedo",
    "album": "Choro Brasileiro",
    "ano": "1949",
    "thumbnail": "https://i.scdn.co/image/ab67616d0000b273..."
  }
}
```

---

### Manutenção

#### Close Browser
```bash
POST /browser/close
```

Útil para manutenção e limpeza de memória.

**Resposta:**
```json
{
  "success": true,
  "message": "Browser fechado"
}
```

## 🧪 Testes Rápidos

```bash
# Health check
curl http://localhost:4000/health

# Testar busca
curl -X POST http://localhost:4000/spotify/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Brasileirinho"}'

# Testar login
curl -X POST http://localhost:4000/spotify/login \
  -H "Content-Type: application/json" \
  -d '{"email": "seu-email", "password": "sua-senha"}'
```

## 🐳 Docker

### Build Manual

```bash
docker build -t meu-regional-scraper ./scraper
```

### Rodar Container

```bash
docker run -d \
  -p 4000:4000 \
  -e SPOTIFY_EMAIL=seu-email \
  -e SPOTIFY_PASSWORD=sua-senha \
  --name scraper \
  meu-regional-scraper
```

### Logs

```bash
# Logs em tempo real
docker logs -f meu-regional-scraper

# Últimas 50 linhas
docker logs --tail=50 meu-regional-scraper
```

## 📊 Monitoramento

### Health Check Contínuo

```bash
# Com watch (Linux)
watch -n 5 'curl -s http://localhost:4000/health | jq .'

# Com curl simples
while true; do curl -s http://localhost:4000/health; sleep 5; done
```

### Verificar Uso de Memória

```bash
docker stats meu-regional-scraper
```

## ⚠️ Troubleshooting

### Browser não inicia

**Sintoma:** Erros ao fazer login ou buscar músicas

**Solução:** Verifique se as dependências do sistema estão instaladas:

```bash
# O container já inclui todas as dependências
# Se rodar localmente, instale:
apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2
```

### Memória insuficiente

**Sintoma:** Container é encerrado inesperadamente

**Solução:** Aumente o limite de memória no `docker-compose.yml`:

```yaml
scraper:
  deploy:
    resources:
      limits:
        memory: 1G  # Aumente de 512M para 1G
```

### Login falha no Spotify

**Sintoma:** `401 Falha no login`

**Possíveis causas:**
- Credenciais incorretas
- Spotify detectou atividade incomum
- Conta com verificação em duas etapas (2FA)

**Solução:**
1. Verifique credenciais no `.env`
2. Tente login manual no navegador para verificar a conta
3. Se houver 2FA, desative ou use senha de app
4. Aguarde alguns minutos e tente novamente

### Busca retorna lista vazia

**Sintoma:** `total: 0` na resposta

**Possíveis causas:**
- Sessão expirou
- Spotify mudou estrutura da página

**Solução:**
```bash
# Reinicie o container
docker-compose restart scraper

# Ou feche o browser para forçar novo login
curl -X POST http://localhost:4000/browser/close
```

### Timeout nas requisições

**Sintoma:** `Timeout after 30000ms`

**Solução:**
- Verifique sua conexão com a internet
- O Spotify pode estar lento; tente novamente
- Aumente o timeout no código se necessário

## 🔄 Integração com Backend

O backend (Hono + SQLite) se comunica com o scraper via HTTP:

```typescript
// back/src/services/spotify-scraper.service.ts
import { scraperClient } from './scraper-client.service';

// Buscar músicas
const results = await scraperClient.search('Brasileirinho');

// Buscar primeiro resultado
const first = await scraperClient.searchFirst('Tico-Tico');

// Extrair metadata de URL
const metadata = await scraperClient.getMetadataByUrl(url);
```

## 📝 Exemplos de Uso

### Exemplo 1: Buscar e Adicionar ao Repertório

```bash
# 1. Buscar música no Spotify
SEARCH_RESULT=$(curl -s -X POST http://localhost:4000/spotify/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Brasileirinho"}')

# 2. Extrair primeiro resultado
NOME=$(echo $SEARCH_RESULT | jq -r '.results[0].nome')
AUTOR=$(echo $SEARCH_RESULT | jq -r '.results[0].autor')

# 3. Adicionar ao repertório via API do backend
curl -X POST http://localhost:3000/api/repertoire \
  -H "Content-Type: application/json" \
  -d "{
    \"regional_id\": 1,
    \"nome\": \"$NOME\",
    \"autor\": \"$AUTOR\"
  }"
```

### Exemplo 2: Extrair Metadata de Playlist

```bash
# URL de uma track do Spotify
URL="https://open.spotify.com/track/4uLU6hMCxMI75M1A2ATKU4"

# Extrair metadata
curl -X POST http://localhost:4000/spotify/metadata \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}"
```

## 🔒 Segurança

- **Nunca** compartilhe suas credenciais do Spotify
- Use uma conta secundária se possível
- As credenciais são armazenadas apenas em variáveis de ambiente
- Em produção, use um secrets manager (Docker Secrets, AWS Secrets Manager, etc.)

## 📚 Tecnologias

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| [Bun](https://bun.sh/) | Latest | Runtime JavaScript |
| [Hono](https://hono.dev/) | v4 | Framework web |
| [Playwright](https://playwright.dev/) | Latest | Automação de browser |
| [TypeScript](https://www.typescriptlang.org/) | v5 | Tipagem estática |

## 📝 Licença

MIT
