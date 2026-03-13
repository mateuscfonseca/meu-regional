# Meu Regional

Sistema de gestão de repertório para regionais musicais.

## 🎯 Funcionalidades

### Implementadas

- ✅ **Cadastro de Regional e Membros** - Crie seu regional e convide membros
- ✅ **Gestão de Repertório** - CRUD completo com importação de listas
- ✅ **Web Scraping Spotify** - Preenchimento automático de metadados
- ✅ **Criação de Seleções/Setlists** - Monte setlists para shows e ensaios
- ✅ **Sistema de Votação** - Cada membro vota nas músicas desejadas
- ✅ **Acompanhamento de Estudos** - Registre estudos individuais e em grupo
- ✅ **Estatísticas** - Acompanhe evolução e músicas mais estudadas

### Em Desenvolvimento

- 🔄 Sugestões de estudo baseadas em neurociência (repetição espaçada)
- 🔄 Integração com YouTube e Tidal
- 🔄 Design Mobile First aprimorado

## 🚀 Stack Técnico

| Camada | Tecnologias |
|--------|-------------|
| **Backend** | Bun + Hono + TypeScript + SQLite |
| **Frontend** | Vue 3 + Tailwind CSS v4 + TypeScript |
| **Web Scraping** | Playwright (container separado) |
| **Infra** | Docker Compose (3 containers) |

## 📦 Como Rodar

### Produção com Docker (Recomendado)

```bash
# Copiar arquivo de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Rodar deploy
./deploy.sh deploy
```

**Acesso:**
- Frontend: http://localhost:7000
- Domínio: https://meureg.mateusfonseca.me
- Backend e Scraper: rede interna (não expostos)

**Comandos disponíveis:**
```bash
./deploy.sh deploy    # Deploy completo
./deploy.sh restart   # Reinicia containers
./deploy.sh stop      # Para containers
./deploy.sh logs      # Logs em tempo real
./deploy.sh status    # Status dos containers
```

### Arquitetura de Containers

```
┌─────────────────────────────────────────┐
│   Frontend (Caddy + Vue 3 build)        │
│   port 7000                             │
│  ┌─────────────────────────────────┐    │
│  │  Caddy                          │    │
│  │  - Serve estático               │    │
│  │  - Proxy /api/* → backend:3000  │    │
│  └─────────────────────────────────┘    │
└─────────────────┬───────────────────────┘
                  │ HTTP (rede interna)
                  ▼
┌─────────────────────────────────────────┐
│   Backend (Hono/Bun)                    │
│   port 3000 (interno)                   │
└─────────────────┬───────────────────────┘
                  │ HTTP (rede interna)
                  ▼
┌─────────────────────────────────────────┐
│   Scraper (Playwright)                  │
│   port 4000 (interno)                   │
└─────────────────────────────────────────┘
```

### Desenvolvimento Local

```bash
# Backend
cd back
bun install
cp .env.example .env  # Configure SPOTIFY_EMAIL e SPOTIFY_PASSWORD
bun run migrate       # Rodar migrações do banco
bun run dev           # http://localhost:3000

# Frontend
cd app
bun install
bun run dev           # http://localhost:5173
```

### Deploy em Produção

No seu servidor, configure o Caddy externo para fazer proxy reverso:

**Caddyfile do servidor:**
```caddy
meureg.mateusfonseca.me {
    reverse_proxy localhost:7000
}
```

**Primeiro deploy:**
```bash
# Clonar repositório
git clone <repo> meu-regional
cd meu-regional

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com JWT_SECRET e credenciais Spotify

# Rodar deploy
./deploy.sh deploy
```

**Deploys seguintes:**
```bash
# Apenas rodar o script (pull + build + deploy)
./deploy.sh deploy
```

O script usa `rsync` para sincronizar arquivos para `~/deploys/meu-regional`, preservando o `.env` configurado.

## 📁 Estrutura do Projeto

```
meu-regional/
├── back/                       # Backend
│   ├── src/
│   │   ├── routes/             # Rotas da API
│   │   ├── services/           # Lógica de negócio (scraper)
│   │   ├── migrations/         # Migrações do banco
│   │   ├── db-provider.ts      # Database provider
│   │   ├── migration-runner.ts # Runner de migrações
│   │   └── index.ts            # Entry point
│   ├── README.md               # Docs do backend
│   └── Dockerfile
├── app/                        # Frontend
│   ├── src/
│   │   ├── views/              # Telas
│   │   ├── composables/        # Lógica reutilizável
│   │   ├── services/           # API clients
│   │   └── router/             # Rotas
│   ├── Caddyfile               # Configuração do Caddy
│   ├── README.md               # Docs do frontend
│   └── Dockerfile
├── docs/
│   └── spotify-scraping.md     # Docs do scraping
├── deploy.sh                   # Script de deploy
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔌 API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta (regional + membro) |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Verificar autenticação |

### Repertório
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/repertoire/regional/:id` | Listar repertório |
| POST | `/api/repertoire` | Criar item |
| POST | `/api/repertoire/import` | Importar lista |
| POST | `/api/scraper/spotify/search` | Buscar no Spotify |
| POST | `/api/scraper/spotify/metadata` | Extrair metadata de URL |

### Seleções
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/selections/regional/:id` | Listar seleções |
| POST | `/api/selections/:id/vote` | Votar em música |
| POST | `/api/selections/:id/finalize` | Finalizar seleção |

### Estudos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/study-logs/member/:id` | Histórico de estudos |
| GET | `/api/study-logs/member/:id/stats` | Estatísticas |
| POST | `/api/study-logs` | Registrar estudo |

Veja todos os endpoints em [back/README.md](back/README.md)

## 🎸 Funcionalidades Principais

### 1. Cadastro de Regional

- Crie um regional com nome e descrição
- Primeiro membro é cadastrado junto com o regional
- Cada membro tem username, senha e instrumento

### 2. Repertório com Spotify

- **Importar lista**: Cole uma lista de músicas (uma por linha)
- **Buscar no Spotify**: Auto-complete com metadados reais
- **Extrair de URL**: Cole URL do Spotify e preencha automaticamente
- **Metadados**: Nome, autor, álbum, ano

### 3. Seleções e Votação

- Crie seleções para shows, ensaios ou temas
- Cada membro vota nas músicas desejadas
- Sistema calcula as mais votadas
- Resultado final com ranking

### 4. Estudos

- Registre estudos individuais ou em grupo
- Adicione duração e notas
- Veja estatísticas e histórico
- Acompanhe músicas mais estudadas

## ⚙️ Configuração do Spotify Scraper

Para usar o preenchimento automático de metadados:

1. Edite `back/.env`:
   ```env
   SPOTIFY_EMAIL=seu-email@exemplo.com
   SPOTIFY_PASSWORD=sua-senha-aqui
   ```

2. Reinicie o backend:
   ```bash
   docker-compose restart backend
   ```

Veja mais em [docs/spotify-scraping.md](docs/spotify-scraping.md)

## 🗄️ Banco de Dados

O sistema usa SQLite com migrações incrementais:

```bash
# Aplicar migrações
bun run migrate

# Ver status
bun run migrate:list

# Reverter última
bun run migrate:rollback
```

### Tabelas Principais

- `regionais` - Informações do regional
- `members` - Membros do regional
- `repertoire_items` - Músicas do repertório
- `selections` - Seleções/setlists
- `selection_votes` - Votos dos membros
- `study_logs` - Registro de estudos
- `scraper_cache` - Cache do Spotify

## 📱 Mobile First

O design é desenvolvido com abordagem mobile first:

- Layouts responsivos
- Menus adaptáveis
- Touch-friendly
- Tabelas com scroll horizontal em mobile

## 🧪 Testes

```bash
# Backend
cd back
bun test

# Frontend
cd app
bun test
```

## 📊 Roadmap

### Fase 1: Setup e Autenticação ✅
- [x] Estrutura do projeto
- [x] Docker Compose
- [x] Autenticação JWT
- [x] Cadastro de regional e membros
- [x] Db Provider (padrão marcio natural)
- [x] Sistema de migrações

### Fase 2: Repertório ✅
- [x] CRUD de repertório
- [x] Importação de listas (parsing de texto)
- [x] Web scraping Spotify com Playwright

### Fase 3: Seleções e Votação ✅
- [x] CRUD de seleções
- [x] Sistema de votação
- [x] Finalização com ranking

### Fase 4: Estudos ✅
- [x] Registro de estudos
- [x] Histórico e estatísticas
- [ ] Sugestões baseadas em repetição espaçada

### Fase 5: Melhorias (Em Progresso)
- [ ] Integração YouTube
- [ ] Integração Tidal
- [ ] Design Mobile First completo
- [ ] Dashboard de evolução

### Fase 6: Neurociência (Futuro)
- [ ] Algoritmo de repetição espaçada
- [ ] Sugestões inteligentes de estudo
- [ ] Lembretes de estudo

## 📚 Documentação

- [Backend README](back/README.md) - Detalhes do backend
- [Frontend README](app/README.md) - Detalhes do frontend
- [Spotify Scraping](docs/spotify-scraping.md) - Guia do scraping

## 🔧 Desenvolvimento

### Adicionar Nova Migração

```bash
# Criar arquivo em back/src/migrations/
# Ex: 002-add-column.ts

# Rodar migração
bun run migrate
```

### Variáveis de Ambiente

**Backend (.env):**
```env
JWT_SECRET=sua-chave-secreta
DATABASE_PATH=/app/data/meu-regional.db
SPOTIFY_EMAIL=email@exemplo.com
SPOTIFY_PASSWORD=senha
SCRAPER_HEADLESS=true
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000
```

**Produção (.env):**
```env
JWT_SECRET=chave-secreta-forte  # Gerar com: openssl rand -base64 32
DATABASE_PATH=/app/data/meu-regional.db
NODE_ENV=production
SCRAPER_API_URL=http://scraper:4000
SPOTIFY_EMAIL=seu-email@exemplo.com
SPOTIFY_PASSWORD=sua-senha
SCRAPER_HEADLESS=true
```

## 📝 Licença

MIT
