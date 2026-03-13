# Meu Regional - Contexto do Projeto

## 📋 Visão Geral

**Meu Regional** é um sistema de gestão de repertório para regionais musicais (grupos de música regional brasileira). A aplicação permite que membros de um regional gerenciem músicas, criem setlists para shows/ensaios, votem nas músicas desejadas e acompanhem seus estudos.

### Funcionalidades Principais

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Cadastro de Regional e Membros | ✅ | Crie seu regional e convide membros |
| Gestão de Repertório | ✅ | CRUD completo com importação de listas |
| Web Scraping Spotify | ✅ | Preenchimento automático de metadados |
| Criação de Seleções/Setlists | ✅ | Monte setlists para shows e ensaios |
| Sistema de Votação | ✅ | Cada membro vota nas músicas desejadas |
| Acompanhamento de Estudos | ✅ | Registre estudos individuais e em grupo |
| Estatísticas | ✅ | Acompanhe evolução e músicas mais estudadas |
| Sugestões por Repetição Espaçada | 🔄 | Baseado em neurociência |
| Integração YouTube/Tidal | 🔄 | Em desenvolvimento |

---

## 🏗️ Arquitetura

### Diagrama de Containers

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │
│   (Vue 3)       │────▶│   (Hono/Bun)    │
│   port 5173     │     │   port 3000     │
└─────────────────┘     └────────┬────────┘
                                 │ HTTP
                                 ▼
                        ┌─────────────────┐
                        │   Scraper       │
                        │   (Playwright)  │
                        │   port 4000     │
                        └─────────────────┘
```

### Stack Técnico

| Camada | Tecnologias |
|--------|-------------|
| **Backend** | Bun + Hono + TypeScript + SQLite |
| **Frontend** | Vue 3 + Tailwind CSS v4 + TypeScript |
| **Web Scraping** | Playwright (container separado) |
| **Infra** | Docker Compose (3 containers) |

---

## 📁 Estrutura do Projeto

```
meu-regional/
├── back/                       # Backend API
│   ├── src/
│   │   ├── routes/             # Rotas da API (auth, members, repertoire, etc.)
│   │   ├── services/           # Lógica de negócio (scraper.service.ts)
│   │   ├── migrations/         # Migrações do banco
│   │   ├── db-provider.ts      # Database provider (singleton)
│   │   ├── db.ts               # Wrapper de compatibilidade
│   │   ├── migration-runner.ts # Runner de migrações
│   │   ├── migrate.ts          # Script CLI de migração
│   │   ├── schema.sql          # Schema do banco
│   │   └── index.ts            # Entry point
│   ├── data/                   # SQLite database (gerado)
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── app/                        # Frontend
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   │   └── base/           # Componentes base
│   │   │       ├── BaseModal.vue       # Modal genérico
│   │   │       ├── AddMusicModal.vue   # Modal de adicionar música
│   │   │       ├── EditMusicModal.vue  # Modal de editar música
│   │   │       ├── ImportListModal.vue # Modal de importar lista
│   │   │       └── index.ts            # exports
│   │   ├── views/              # Telas/Páginas
│   │   ├── composables/        # Lógica reutilizável (useAuth, useMembers, etc.)
│   │   ├── services/           # API clients (api.ts, scraper.ts)
│   │   ├── router/             # Configuração de rotas
│   │   ├── layouts/            # Layouts de página
│   │   ├── App.vue             # Componente raiz
│   │   ├── main.ts             # Entry point
│   │   └── style.css           # Estilos globais + Tailwind
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── scraper/                    # Serviço de Web Scraping
│   ├── src/
│   │   └── index.ts            # Scraper API (Hono + Playwright)
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
├── docs/
│   ├── IdeiaInicial.md         # Documentação inicial do projeto
│   └── spotify-scraping.md     # Guia técnico do scraping
│
├── docker-compose.yml          # Orquestração dos 3 containers
├── README.md                   # Documentação principal
└── QWEN.md                     # Este arquivo
```

---

## 🚀 Como Rodar

### Docker (Recomendado)

```bash
# Construir e iniciar todos os containers
docker-compose up --build

# Backend:  http://localhost:3000
# Frontend: http://localhost:5173
# Scraper:  http://localhost:4000
```

### Desenvolvimento Local

```bash
# Backend
cd back
bun install
cp .env.example .env
bun run migrate
bun run dev

# Frontend
cd app
bun install
bun run dev
```

---

## 🔧 Comandos Principais

### Backend (`back/`)

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Desenvolvimento com hot-reload |
| `bun run start` | Produção |
| `bun run migrate` | Aplicar migrações pendentes |
| `bun run migrate:rollback` | Reverter última migração |
| `bun run migrate:list` | Listar status das migrações |

### Frontend (`app/`)

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Desenvolvimento com Vite |
| `bun run build` | Build de produção |
| `bun run preview` | Preview do build |

### Scraper (`scraper/`)

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Desenvolvimento com hot-reload |
| `bun run start` | Produção |

---

## 📡 API Endpoints (Backend)

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta (regional + membro) |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Verificar autenticação |

### Regionais
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/regionais` | Listar regionais |
| GET | `/api/regionais/:id` | Obter regional |
| POST | `/api/regionais` | Criar regional |
| PUT | `/api/regionais/:id` | Atualizar regional |

### Membros
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/members/regional/:id` | Listar membros |
| GET | `/api/members/:id` | Obter membro |
| POST | `/api/members` | Criar membro |
| PUT | `/api/members/:id` | Atualizar membro |
| DELETE | `/api/members/:id` | Deletar membro |

### Repertório
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/repertoire/regional/:id` | Listar repertório |
| POST | `/api/repertoire` | Criar item |
| PUT | `/api/repertoire/:id` | Atualizar item |
| DELETE | `/api/repertoire/:id` | Deletar item |
| POST | `/api/repertoire/import` | Importar lista de músicas |

### Seleções
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/selections/regional/:id` | Listar seleções |
| POST | `/api/selections` | Criar seleção |
| POST | `/api/selections/:id/vote` | Votar em música |
| DELETE | `/api/selections/:id/vote/:memberId` | Remover voto |
| POST | `/api/selections/:id/finalize` | Finalizar seleção |

### Estudos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/study-logs/member/:id` | Histórico de estudos |
| POST | `/api/study-logs` | Registrar estudo |

### Scraper (Spotify)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/scraper/health` | Health check |
| POST | `/api/scraper/spotify/search` | Buscar por query |
| POST | `/api/scraper/spotify/search-first` | Buscar primeiro resultado |
| POST | `/api/scraper/spotify/metadata` | Extrair metadata de URL |

---

## 🗄️ Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `regionais` | Informações do regional |
| `members` | Membros do regional |
| `repertoire_items` | Músicas do repertório |
| `selections` | Seleções/setlists |
| `selection_votes` | Votos dos membros |
| `selection_results` | Resultados finalizados |
| `study_logs` | Registro de estudos |
| `scraper_cache` | Cache do scraping (24h TTL) |
| `migrations` | Controle de migrações |

### Migrações

As migrações são arquivos TypeScript em `back/src/migrations/`:

```typescript
// Ex: 001-initial-schema.ts
export async function up(db: Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS regionais (...)`);
}

export async function down(db: Database) {
  db.exec(`DROP TABLE IF EXISTS regionais`);
}
```

---

## 🔐 Autenticação

- **JWT** para autenticação de estado
- **bcryptjs** para hash de senhas
- Middleware de autenticação em rotas protegidas
- Sessão persistida no frontend via composables

---

## 🎨 Frontend

### Composables Principais

| Composable | Descrição |
|------------|-----------|
| `useAuth()` | Autenticação (login, registro, logout) |
| `useMembers()` | Gerenciamento de membros |
| `useRepertoire()` | Gerenciamento de repertório |
| `useSelections()` | Criação e votação em seleções |
| `useStudyLogs()` | Registro e acompanhamento de estudos |

### Componentes Base

Componentes reutilizáveis para consistência de UI/UX:

| Componente | Descrição | Props Principais |
|------------|-----------|------------------|
| `BaseModal` | Modal genérico com backdrop glassy, animação slide-up, full-screen mobile | `modelValue`, `title`, `size`, `showClose`, `closeOnOverlay`, `fullscreenOnMobile` |
| `AddMusicModal` | Modal de adicionar música com busca Spotify | `modelValue` |
| `EditMusicModal` | Modal de editar música com busca Spotify | `modelValue`, `item` |
| `ImportListModal` | Modal de importar lista de músicas | `modelValue` |

**Exemplo de uso do BaseModal:**

```vue
<BaseModal
  v-model="showModal"
  title="Título da Modal"
  size="md"
  @close="handleClose"
>
  <p>Conteúdo da modal...</p>
  
  <template #footer>
    <button @click="showModal = false">Cancelar</button>
    <button @click="handleSubmit">Salvar</button>
  </template>
</BaseModal>
```

**Tamanhos disponíveis:** `sm`, `md`, `lg`, `xl`, `full`

**Features do BaseModal:**
- Backdrop com efeito glassy (`backdrop-blur-sm`)
- Animação slide-up com fade
- Full-screen automático em mobile
- Fecha com clique no overlay ou tecla Escape
- Previne scroll do body quando aberto

### Views Principais

| View | Rota | Descrição |
|------|------|-----------|
| `LoginView` | `/login` | Login |
| `RegisterView` | `/register` | Cadastro |
| `DashboardView` | `/dashboard` | Dashboard |
| `RepertoireView` | `/repertoire` | Gestão de repertório |
| `SelectionsView` | `/selections` | Lista de seleções |
| `StudyView` | `/study` | Acompanhamento de estudos |
| `MembersView` | `/members` | Gestão de membros |

### Design

- **Mobile First**: Layouts responsivos
- **Tailwind CSS v4**: Estilização utilitária completa
- **Ícones MDI**: Material Design Icons para todos os ícones
- **Touch-friendly**: Botões e inputs grandes

### 🎨 Diretrizes de UI/UX

#### Tailwind CSS v4

**Importância:** O Tailwind CSS v4 é a base do design do projeto. Utilize toda sua capacidade:

- **Utility-first**: Prefira classes utilitárias do Tailwind a CSS customizado
- **Responsividade**: Use breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) para layouts responsivos
- **Cores**: Utilize a paleta do Tailwind (`bg-blue-500`, `text-gray-700`, `hover:bg-red-600`)
- **Espaçamento**: Padronize com `p-`, `m-`, `gap-` (`p-4`, `mx-auto`, `gap-2`)
- **Flexbox/Grid**: `flex`, `grid`, `flex-col`, `items-center`, `justify-between`
- **Tipografia**: `text-sm`, `font-bold`, `leading-relaxed`, `tracking-wide`
- **Bordas/Sombras**: `rounded-lg`, `border`, `shadow-md`, `ring-2`
- **Estados**: `hover:`, `focus:`, `active:`, `disabled:`
- **Dark mode**: `dark:bg-gray-900`, `dark:text-white`
- **Animações**: `transition`, `duration-300`, `animate-pulse`, `animate-spin`

**Exemplo:**
```vue
<button class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
               hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
               transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
  <span class="mdi mdi-plus"></span>
  Adicionar
</button>
```

#### Ícones MDI (Material Design Icons)

**Importância:** Todos os ícones do projeto devem usar a biblioteca MDI:

- **Formato**: Use a classe `mdi` + nome do ícone (`mdi mdi-home`, `mdi mdi-account`)
- **Tamanhos**: Combine com classes Tailwind (`w-5 h-5`, `text-xl`, `w-8 h-8`)
- **Cores**: Use `text-` do Tailwind (`text-gray-500`, `text-blue-600`)
- **Acessibilidade**: Sempre adicione `aria-hidden="true"` em ícones decorativos

**Ícones comuns:**
| Ícone | Classe | Uso |
|-------|--------|-----|
| Home | `mdi mdi-home` | Dashboard, início |
| Usuário | `mdi mdi-account` | Perfil, membros |
| Música | `mdi mdi-music` | Repertório, músicas |
| Lista | `mdi mdi-list-box` | Setlists, seleções |
| Votação | `mdi mdi-hand-back-right` | Votos, ranking |
| Estudo | `mdi mdi-school` | Estudos, aprendizado |
| Config | `mdi mdi-cog` | Configurações |
| Sair | `mdi mdi-logout` | Logout |
| Adicionar | `mdi mdi-plus` | Criar, adicionar |
| Editar | `mdi mdi-pencil` | Editar, alterar |
| Excluir | `mdi mdi-delete` | Remover, deletar |
| Buscar | `mdi mdi-magnify` | Pesquisa, filtro |
| Menu | `mdi mdi-menu` | Navegação mobile |
| Fechar | `mdi mdi-close` | Modal, fechar |
| Check | `mdi mdi-check` | Sucesso, confirmado |
| Alerta | `mdi mdi-alert` | Warning, erro |
| Info | `mdi mdi-information` | Informações |
| Play | `mdi mdi-play` | Reproduzir |
| Pause | `mdi mdi-pause` | Pausar |
| Spotify | `mdi mdi-spotify` | Link Spotify |

**Exemplo de uso:**
```vue
<!-- Ícone simples -->
<span class="mdi mdi-music text-gray-500"></span>

<!-- Ícone com tamanho e cor -->
<button class="p-2 hover:bg-gray-100 rounded-full">
  <span class="mdi mdi-pencil w-5 h-5 text-blue-600"></span>
</button>

<!-- Ícone com tooltip -->
<div class="relative group">
  <span class="mdi mdi-delete text-red-600"></span>
  <span class="absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded">
    Excluir
  </span>
</div>
```

---

## 🕷️ Web Scraping (Spotify)

### Configuração

Edite `back/.env` ou use variáveis de ambiente no Docker:

```env
SPOTIFY_EMAIL=seu-email@exemplo.com
SPOTIFY_PASSWORD=sua-senha-aqui
SCRAPER_HEADLESS=true
```

### Funcionamento

1. Playwright abre browser headless
2. Faz login no Spotify
3. Busca músicas por query ou URL
4. Extrai metadados: nome, autor, álbum, ano
5. Cacheia resultados por 24h

### Endpoints do Scraper

```bash
# Health check
GET /health

# Browser health
GET /browser/health

# Login Spotify
POST /spotify/login

# Buscar músicas
POST /spotify/search

# Primeiro resultado
POST /spotify/search-first

# Metadata por URL
POST /spotify/metadata

# Fechar browser (manutenção)
POST /browser/close
```

Veja detalhes em [docs/spotify-scraping.md](docs/spotify-scraping.md)

---

## 🧪 Testes

```bash
# Backend
cd back
bun test

# Frontend
cd app
bun test
```

---

## 📝 Convenções de Desenvolvimento

### Backend

- **Rotas**: Arquivos separados em `src/routes/`
- **Serviços**: Lógica de negócio em `src/services/`
- **Validação**: Zod schemas para validação de entrada
- **Database**: Usar sempre `getDb()` do `db-provider.ts`

### Frontend

- **Composables**: Lógica reutilizável em `src/composables/`
- **Views**: Uma view por página/rota
- **Services**: API clients em `src/services/`
- **TypeScript**: Tipagem estrita sempre que possível

### Git

- Commits descritivos e concisos
- Branches por feature/fix
- PRs para merge na main

---

## ⚙️ Variáveis de Ambiente

### Backend (`.env`)

```env
JWT_SECRET=sua-chave-secreta
DATABASE_PATH=/app/data/meu-regional.db
NODE_ENV=development
SPOTIFY_EMAIL=email@exemplo.com
SPOTIFY_PASSWORD=senha
SCRAPER_HEADLESS=true
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3000
```

### Scraper (`.env`)

```env
PORT=4000
HEADLESS=true
SPOTIFY_EMAIL=email@exemplo.com
SPOTIFY_PASSWORD=senha
```

---

## 📊 Roadmap

### Fase 1: Setup e Autenticação ✅
- [x] Estrutura do projeto
- [x] Docker Compose
- [x] Autenticação JWT
- [x] Cadastro de regional e membros
- [x] Db Provider
- [x] Sistema de migrações

### Fase 2: Repertório ✅
- [x] CRUD de repertório
- [x] Importação de listas
- [x] Web scraping Spotify

### Fase 3: Seleções e Votação ✅
- [x] CRUD de seleções
- [x] Sistema de votação
- [x] Finalização com ranking

### Fase 4: Estudos ✅
- [x] Registro de estudos
- [x] Histórico e estatísticas
- [ ] Sugestões por repetição espaçada

### Fase 5: Melhorias (Em Progresso)
- [ ] Integração YouTube
- [ ] Integração Tidal
- [ ] Design Mobile First completo
- [ ] Dashboard de evolução

### Fase 6: Neurociência (Futuro)
- [ ] Algoritmo de repetição espaçada
- [ ] Sugestões inteligentes de estudo
- [ ] Lembretes de estudo

---

## 🔗 Links Úteis

- [Backend README](back/README.md) - Detalhes do backend
- [Frontend README](app/README.md) - Detalhes do frontend
- [Scraper README](scraper/README.md) - Detalhes do scraper
- [Spotify Scraping](docs/spotify-scraping.md) - Guia técnico do scraping
- [Ideia Inicial](docs/IdeiaInicial.md) - Documentação inicial do projeto

---

## 📝 Licença

MIT
