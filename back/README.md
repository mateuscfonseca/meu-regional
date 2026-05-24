# Meu Regional - Backend

Backend da aplicação Meu Regional, um sistema de gestão de repertório para regionais musicais.

## 🚀 Tecnologias

- **Runtime**: [Bun](https://bun.sh/) (JavaScript/TypeScript runtime)
- **Framework**: [Hono](https://hono.dev/) (Web framework leve e rápido)
- **Banco de Dados**: SQLite com [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Validação**: [Zod](https://zod.dev/) (TypeScript-first schema validation)
- **Autenticação**: JWT (JSON Web Tokens)

## 📦 Instalação

### Pré-requisitos

- [Bun](https://bun.sh/) instalado (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 18+ (opcional, para compatibilidade)

### Instalação local

```bash
# Instalar dependências
bun install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações
```

### Variáveis de Ambiente

```env
# JWT para autenticação
JWT_SECRET=sua-chave-secreta-aqui

# Banco de dados
DATABASE_PATH=/app/data/meu-regional.db

# Ambiente
NODE_ENV=development
```

## 🏃 Como Rodar

### Desenvolvimento

```bash
# Rodar com hot-reload
bun run dev

# O servidor estará em http://localhost:3000
```

### Produção

```bash
# Build e start
bun run start
```

### Docker (Recomendado)

```bash
# Na raiz do projeto
docker-compose up --build

# Backend: http://localhost:3000
```

## 🗄️ Banco de Dados

### Migrações

O sistema usa migrações incrementais para gerenciar o schema do banco:

```bash
# Aplicar todas as migrações pendentes
bun run migrate

# Reverter última migração
bun run migrate:rollback

# Listar status das migrações
bun run migrate:list
```

### Estrutura do Banco

- `regionais` - Informações do regional (nome, descrição)
- `members` - Membros do regional (username, password_hash, instrumento)
- `repertoire_items` - Músicas do repertório
- `selections` - Seleções/setlists para eventos
- `selection_votes` - Votos dos membros nas seleções
- `selection_results` - Resultados finalizados das seleções
- `study_logs` - Registro de estudos das músicas
- `migrations` - Controle de migrações aplicadas
- `scraper_cache` - Cache de scraping

## 📡 API Endpoints

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
| GET | `/api/members/regional/:id` | Listar membros de uma regional |
| GET | `/api/members/:id` | Obter membro |
| POST | `/api/members` | Criar membro |
| PUT | `/api/members/:id` | Atualizar membro |
| DELETE | `/api/members/:id` | Deletar membro |

### Repertório

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/repertoire/regional/:id` | Listar repertório |
| GET | `/api/repertoire/:id` | Obter item |
| POST | `/api/repertoire` | Criar item |
| PUT | `/api/repertoire/:id` | Atualizar item |
| DELETE | `/api/repertoire/:id` | Deletar item |
| POST | `/api/repertoire/import` | Importar lista de músicas |

### Seleções

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/selections/regional/:id` | Listar seleções |
| GET | `/api/selections/:id` | Obter seleção com votos |
| POST | `/api/selections` | Criar seleção |
| POST | `/api/selections/:id/vote` | Votar em música |
| DELETE | `/api/selections/:id/vote/:memberId` | Remover voto |
| POST | `/api/selections/:id/finalize` | Finalizar seleção |
| POST | `/api/selections/:id/reopen` | Reabrir votação |

### Estudos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/study-logs/member/:id` | Histórico de estudos |
| GET | `/api/study-logs/member/:id/stats` | Estatísticas |
| GET | `/api/study-logs/repertoire/:id` | Estudos de uma música |
| POST | `/api/study-logs` | Registrar estudo |

## 📁 Estrutura de Pastas

```
back/
├── src/
│   ├── routes/           # Rotas da API
│   │   ├── auth.ts
│   │   ├── members.ts
│   │   ├── regionais.ts
│   │   ├── repertoire.ts
│   │   ├── selections.ts
│   │   └── studyLogs.ts
│   ├── migrations/       # Migrações do banco
│   │   └── 001-initial-schema.ts
│   ├── db-provider.ts    # Provedor do banco de dados
│   ├── db.ts             # Wrapper de compatibilidade
│   ├── migration-runner.ts # Runner de migrações
│   ├── migrate.ts        # Script de migração
│   ├── schema.sql        # Schema de referência
│   └── index.ts          # Entry point
├── data/                 # Banco de dados (gerado)
├── Dockerfile
├── package.json
└── .env.example
```

## 🧪 Testes

```bash
# Rodar testes (em desenvolvimento)
bun test
```

## 🔧 Desenvolvimento

### Adicionar Nova Migração

1. Crie um arquivo em `src/migrations/` com nome numerado:
   ```bash
   # Ex: 002-add-column-to-members.ts
   ```

2. Exporte as funções `up` e `down`:
   ```typescript
   export async function up(db: Database) {
     // Sua migração aqui
   }

   export async function down(db: Database) {
     // Reversão aqui
   }
   ```

3. Rode a migração:
   ```bash
   bun run migrate
   ```

### Adicionar Nova Rota

1. Crie o arquivo em `src/routes/`
2. Registre em `src/index.ts`

## 📝 Licença

MIT
