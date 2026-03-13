# Meu Regional - Frontend

Frontend da aplicação Meu Regional, um sistema de gestão de repertório para regionais musicais.

## 🚀 Tecnologias

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Roteamento**: [Vue Router](https://router.vuejs.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Gerenciamento de Estado**: Composables (padrão Vue 3)

## 📦 Instalação

### Pré-requisitos

- [Bun](https://bun.sh/) instalado
- Backend rodando em http://localhost:3000

### Instalação local

```bash
# Instalar dependências
bun install

# Copiar arquivo de ambiente (se necessário)
cp .env.example .env
```

### Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:3000
```

## 🏃 Como Rodar

### Desenvolvimento

```bash
# Rodar com hot-reload
bun run dev

# O frontend estará em http://localhost:5173
```

### Build de Produção

```bash
# Build
bun run build

# Preview
bun run preview
```

### Docker (Recomendado)

```bash
# Na raiz do projeto
docker-compose up --build

# Frontend: http://localhost:5173
```

## 📁 Estrutura de Pastas

```
app/
├── src/
│   ├── views/            # Telas/Páginas
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── DashboardView.vue
│   │   ├── RepertoireView.vue
│   │   ├── SelectionsView.vue
│   │   ├── SelectionDetailView.vue
│   │   ├── StudyView.vue
│   │   └── MembersView.vue
│   ├── composables/      # Lógica reutilizável
│   │   ├── useAuth.ts
│   │   ├── useMembers.ts
│   │   ├── useRepertoire.ts
│   │   ├── useSelections.ts
│   │   └── useStudyLogs.ts
│   ├── services/         # API clients
│   │   ├── api.ts
│   │   └── scraper.ts
│   ├── router/           # Configuração de rotas
│   │   └── index.ts
│   ├── components/       # Componentes reutilizáveis (opcional)
│   ├── App.vue           # Componente raiz
│   ├── main.ts           # Entry point
│   └── style.css         # Estilos globais + Tailwind
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🎨 Componentes Principais

### Composables

Os composables são funções que encapsulam lógica reutilizável usando a Composition API do Vue 3:

| Composable | Descrição |
|------------|-----------|
| `useAuth()` | Autenticação (login, registro, logout) |
| `useMembers()` | Gerenciamento de membros |
| `useRepertoire()` | Gerenciamento de repertório |
| `useSelections()` | Criação e votação em seleções |
| `useStudyLogs()` | Registro e acompanhamento de estudos |
| `useScraper()` | Integração com Spotify scraper |

### Views

| View | Rota | Descrição |
|------|------|-----------|
| `LoginView` | `/login` | Login de usuários |
| `RegisterView` | `/register` | Cadastro de regional e primeiro membro |
| `DashboardView` | `/dashboard` | Dashboard principal |
| `RepertoireView` | `/repertoire` | Gestão do repertório |
| `SelectionsView` | `/selections` | Lista de seleções |
| `SelectionDetailView` | `/selections/:id` | Detalhes e votação |
| `StudyView` | `/study` | Acompanhamento de estudos |
| `MembersView` | `/members` | Gestão de membros |

## 🔌 Integração com API

O arquivo `src/services/api.ts` configura o cliente HTTP:

```typescript
import api from './api'

// Fazer requisições
const response = await api.get('/repertoire/regional/1')
const data = await api.post('/repertoire', { nome: 'Brasileirinho' })
```

### Scraper do Spotify

```typescript
import { useScraper } from './services/scraper'

const { search, getMetadataByUrl } = useScraper()

// Buscar músicas
const results = await search('Brasileirinho')

// Extrair metadata de URL
const metadata = await getMetadataByUrl('https://open.spotify.com/track/...')
```

## 🎯 Funcionalidades

### Repertório

- **Listar músicas**: Visualiza todas as músicas do regional
- **Adicionar manualmente**: Adiciona uma música por vez
- **Buscar no Spotify**: Auto-complete com dados do Spotify
- **Extrair de URL**: Preenche automaticamente com URL do Spotify
- **Importar lista**: Importa múltiplas músicas de uma vez (parsing de texto)
- **Editar/Excluir**: Gerencia músicas existentes

### Seleções

- **Criar seleção**: Define nome, data, máximo de músicas
- **Votar**: Cada membro vota nas músicas desejadas
- **Finalizar**: Calcula as mais votadas
- **Acompanhar**: Vê resultados em tempo real

### Estudos

- **Registrar estudo**: Log de estudos individuais ou em grupo
- **Estatísticas**: Total de estudos, tempo, músicas mais estudadas
- **Histórico**: Timeline de todos os estudos

## 📱 Mobile First

O design é desenvolvido com abordagem mobile first:

- Layouts responsivos com Tailwind CSS
- Menus adaptáveis para telas pequenas
- Touch-friendly (botões e inputs grandes)
- Tabelas com scroll horizontal em mobile

## 🔧 Desenvolvimento

### Adicionar Nova View

1. Crie o arquivo em `src/views/`:
   ```vue
   <template>
     <div>
       <h1>Nova Tela</h1>
     </div>
   </template>

   <script setup lang="ts">
   // Sua lógica aqui
   </script>
   ```

2. Registre a rota em `src/router/index.ts`

### Criar Composable

```typescript
// src/composables/useSomething.ts
import { ref } from 'vue'

export function useSomething() {
  const data = ref(null)
  
  async function loadData() {
    // Lógica aqui
  }
  
  return {
    data,
    loadData
  }
}
```

## 🎨 Estilização

O projeto usa Tailwind CSS v4:

```vue
<template>
  <div class="p-4 bg-white rounded-lg shadow hover:shadow-md">
    <h2 class="text-xl font-bold text-gray-900">Título</h2>
  </div>
</template>
```

### Cores do Tema

- **Primária**: Verde (green-600)
- **Secundária**: Azul (blue-600)
- **Sucesso**: Verde (green-600)
- **Erro**: Vermelho (red-600)

## 📝 Licença

MIT
