<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Repertório</h2>
      <div class="flex gap-2">
        <button
          @click="showAddModal = true"
          class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors touch-manipulation"
        >
          <span class="mdi mdi-plus w-5 h-5"></span>
          <span class="hidden sm:inline">Adicionar Música</span>
          <span class="sm:hidden">Adicionar</span>
        </button>
        <button
          @click="showImportModal = true"
          class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors touch-manipulation"
        >
          <span class="mdi mdi-download w-5 h-5"></span>
          <span class="hidden sm:inline">Importar Lista</span>
          <span class="sm:hidden">Importar</span>
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow p-4 mb-6">
      <div class="flex items-center gap-2 mb-3">
        <span class="mdi mdi-filter-variant text-gray-600"></span>
        <h3 class="font-semibold text-gray-900">Filtros</h3>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Limpar filtros
        </button>
      </div>

      <!-- Filtros de Dias -->
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-600 mb-2">
          Não praticadas há (dias)
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="days in [2, 3, 7, 14]"
            :key="days"
            @click="toggleDaysFilter(days)"
            :class="filters.nao_praticadas_ha === days
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors touch-manipulation"
          >
            {{ days }} dias
          </button>
        </div>
      </div>

      <!-- Filtros de Nível -->
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-600 mb-2">
          Nível de Fluência
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="nivel in niveisFluencia"
            :key="nivel.value"
            @click="toggleNivelFilter(nivel.value)"
            :class="filters.nivel_fluencia?.includes(nivel.value)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors touch-manipulation"
          >
            {{ nivel.label }}
          </button>
        </div>
      </div>

      <!-- Filtros de Características -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Introdução -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">
            Introdução
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="toggleBooleanFilter('tem_introducao', true)"
              :class="filters.tem_introducao === true
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation"
            >
              Tem
            </button>
            <button
              @click="toggleBooleanFilter('introducao_aprendida', true)"
              :class="filters.introducao_aprendida === true
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation"
            >
              Aprendida
            </button>
          </div>
        </div>

        <!-- Terças -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">
            Terças
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="toggleBooleanFilter('tem_tercas', true)"
              :class="filters.tem_tercas === true
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation"
            >
              Tem
            </button>
            <button
              @click="toggleBooleanFilter('tercas_aprendidas', true)"
              :class="filters.tercas_aprendidas === true
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation"
            >
              Aprendidas
            </button>
          </div>
        </div>

        <!-- Arranjo 6 Cordas -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">
            Arranjo 6 Cordas
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="toggleBooleanFilter('tem_arranjo_6_cordas', true)"
              :class="filters.tem_arranjo_6_cordas === true
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation"
            >
              Tem
            </button>
            <button
              @click="toggleBooleanFilter('arranjo_6_cordas_aprendido', true)"
              :class="filters.arranjo_6_cordas_aprendido === true
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation"
            >
              Aprendido
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de músicas -->
    <div v-if="loadingRepertoire" class="flex flex-col items-center justify-center p-12">
      <span class="mdi mdi-loading mdi-spin text-5xl text-blue-600 mb-4"></span>
      <span class="text-gray-600 font-medium">Carregando repertório...</span>
    </div>
    
    <div v-else-if="filteredItems.length === 0" class="bg-white rounded-xl shadow p-8 text-center">
      <span class="mdi mdi-music text-6xl text-gray-300 mb-4 block"></span>
      <p class="text-gray-500 mb-4">Nenhum item no repertório.</p>
      <p class="text-gray-400 text-sm">Importe uma lista ou adicione manualmente.</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(item, index) in filteredItems"
        :key="item.id"
        class="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-blue-500 ring-offset-2': sequentialMode && editingIndex === index }"
      >
        <!-- Cabeçalho do card -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="min-w-0 flex-1">
            <h3 class="font-semibold text-gray-900 truncate text-sm sm:text-base">{{ item.nome }}</h3>
            <p v-if="item.autor" class="text-xs sm:text-sm text-gray-500 truncate">
              <span class="mdi mdi-account text-xs mr-1"></span>
              {{ item.autor }}
            </p>
          </div>
          <div class="flex-shrink-0">
            <span class="mdi mdi-music text-blue-600 w-6 h-6"></span>
          </div>
        </div>

        <!-- Badges de informação -->
        <div class="flex flex-wrap gap-1 mb-3">
          <span
            v-if="item.tonalidade"
            class="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded font-medium"
          >
            {{ item.tonalidade }}
          </span>
          <span
            :class="getNivelFluenciaClass((item as any).member_data?.nivel_fluencia || 'precisa_aprender')"
            class="px-2 py-0.5 text-xs rounded font-medium"
          >
            {{ getNivelFluenciaLabel((item as any).member_data?.nivel_fluencia || 'precisa_aprender') }}
          </span>
        </div>

        <!-- Informações de prática -->
        <div class="mb-3 space-y-1">
          <div v-if="item.tem_introducao" class="flex items-center gap-2 text-xs">
            <span class="mdi mdi-music-note text-gray-400"></span>
            <span :class="(item as any).member_data?.introducao_aprendida ? 'text-green-600' : 'text-gray-600'">
              Introdução {{ (item as any).member_data?.introducao_aprendida ? '✓' : '' }}
            </span>
          </div>
          <div v-if="item.tem_tercas" class="flex items-center gap-2 text-xs">
            <span class="mdi mdi-music-note text-gray-400"></span>
            <span :class="(item as any).member_data?.tercas_aprendidas ? 'text-green-600' : 'text-gray-600'">
              Terças {{ (item as any).member_data?.tercas_aprendidas ? '✓' : '' }}
            </span>
          </div>
          <div v-if="item.tem_arranjo_6_cordas" class="flex items-center gap-2 text-xs">
            <span class="mdi mdi-music-note text-gray-400"></span>
            <span :class="(item as any).member_data?.arranjo_6_cordas_aprendido ? 'text-green-600' : 'text-gray-600'">
              6 cordas {{ (item as any).member_data?.arranjo_6_cordas_aprendido ? '✓' : '' }}
            </span>
          </div>
        </div>

        <!-- Última prática -->
        <div v-if="item.ultima_pratica" class="mb-3 text-xs text-gray-500">
          <span class="mdi mdi-calendar text-xs mr-1"></span>
          Praticada em {{ formatDate(item.ultima_pratica) }}
        </div>

        <!-- Links -->
        <div v-if="parseLinks(item.links as any).length > 0" class="flex flex-wrap gap-2 mb-4">
          <a
            v-for="(link, idx) in parseLinks(item.links as any)"
            :key="idx"
            :href="link"
            target="_blank"
            class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition-colors"
          >
            <span :class="getLinkIcon(link) + ' w-3 h-3'"></span>
            <span class="hidden sm:inline">{{ getLinkLabel(link) }}</span>
          </a>
        </div>

        <!-- Ações -->
        <div class="flex gap-2 pt-3 border-t border-gray-100">
          <button
            @click="openEditModal(item, index)"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors touch-manipulation"
          >
            <span class="mdi mdi-pencil w-4 h-4"></span>
            <span class="hidden sm:inline">Editar</span>
          </button>
          <button
            @click="confirmDelete(item.id)"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors touch-manipulation"
          >
            <span class="mdi mdi-delete w-4 h-4"></span>
            <span class="hidden sm:inline">Excluir</span>
          </button>
        </div>

        <!-- Indicador de edição em sequência -->
        <div v-if="sequentialMode && editingIndex === index" class="mt-3 pt-3 border-t border-blue-200">
          <div class="flex items-center justify-center gap-2 text-xs text-blue-600 font-medium">
            <span class="mdi mdi-circle-small mdi-spin"></span>
            Editando...
          </div>
        </div>
      </div>
    </div>

    <!-- Modais -->
    <AddMusicModal
      v-model="showAddModal"
      @submit="handleAddMusic"
    />

    <!-- Modal de edição sequencial (padrão) -->
    <EditMusicSequentialModal
      v-model="showEditModal"
      :item="editingItem"
      :current-index="editingIndex + 1"
      :total-items="filteredItems.length"
      :show-progress="sequentialMode"
      :loading="saving"
      @submit="handleEditMusic"
      @submit-continue="handleEditMusicContinue"
    />

    <ImportListModal
      v-model="showImportModal"
      @submit="handleImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRepertoire, type RepertoireItem } from '../composables/useRepertoire'
import { useMemberRepertoire } from '../composables/useMemberRepertoire'
import { memberRepertoireService } from '../services/memberRepertoire'
import AddMusicModal from '../components/base/AddMusicModal.vue'
import EditMusicSequentialModal from '../components/base/EditMusicSequentialModal.vue'
import ImportListModal from '../components/base/ImportListModal.vue'

const auth = useAuth()
const user = auth.state.user
const { items, loadRepertoire, importList, deleteItem, createItem, updateItem, updateMemberPracticeFields, parseLinks, getLinkLabel } = useRepertoire()
const { initializeIfNeeded } = useMemberRepertoire()

// Estado das modais
const showAddModal = ref(false)
const showEditModal = ref(false)
const showImportModal = ref(false)
const editingItem = ref<RepertoireItem | null>(null)

// Estado para edição em sequência
const editingIndex = ref<number>(-1)
const sequentialMode = ref(false)

// Estado de loading/saving
const saving = ref(false)
const loadingRepertoire = ref(false)

// Estado dos filtros
const filters = ref<{
  nao_praticadas_ha?: number
  nivel_fluencia: string[]
  tem_introducao?: boolean
  introducao_aprendida?: boolean
  tem_tercas?: boolean
  tercas_aprendidas?: boolean
  tem_arranjo_6_cordas?: boolean
  arranjo_6_cordas_aprendido?: boolean
}>({
  nivel_fluencia: [],
})

// Computed para filtrar itens
const filteredItems = computed(() => {
  let result = items.value
  
  // Filtro: nível de fluência
  if (filters.value.nivel_fluencia.length > 0) {
    result = result.filter(item => 
      filters.value.nivel_fluencia.includes(item.member_data?.nivel_fluencia || 'precisa_aprender')
    )
  }
  
  // Filtro: não praticadas há X dias
  if (filters.value.nao_praticadas_ha) {
    const days = filters.value.nao_praticadas_ha
    result = result.filter(item => {
      if (!item.member_data?.ultima_pratica) return true // nunca praticada = inclui
      const lastPractice = new Date(item.member_data.ultima_pratica)
      const diffDays = Math.floor((Date.now() - lastPractice.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays >= days
    })
  }
  
  // Filtro: introdução (característica geral)
  if (filters.value.tem_introducao !== undefined) {
    result = result.filter(item => item.tem_introducao === filters.value.tem_introducao)
  }
  
  // Filtro: introdução aprendida (dados do usuário)
  if (filters.value.introducao_aprendida !== undefined) {
    result = result.filter(item => 
      (item.member_data?.introducao_aprendida || false) === filters.value.introducao_aprendida
    )
  }
  
  // Filtro: terças (característica geral)
  if (filters.value.tem_tercas !== undefined) {
    result = result.filter(item => item.tem_tercas === filters.value.tem_tercas)
  }
  
  // Filtro: terças aprendidas (dados do usuário)
  if (filters.value.tercas_aprendidas !== undefined) {
    result = result.filter(item => 
      (item.member_data?.tercas_aprendidas || false) === filters.value.tercas_aprendidas
    )
  }
  
  // Filtro: arranjo 6 cordas (característica geral)
  if (filters.value.tem_arranjo_6_cordas !== undefined) {
    result = result.filter(item => item.tem_arranjo_6_cordas === filters.value.tem_arranjo_6_cordas)
  }
  
  // Filtro: arranjo 6 cordas aprendido (dados do usuário)
  if (filters.value.arranjo_6_cordas_aprendido !== undefined) {
    result = result.filter(item => 
      (item.member_data?.arranjo_6_cordas_aprendido || false) === filters.value.arranjo_6_cordas_aprendido
    )
  }
  
  return result
})

const niveisFluencia = [
  { value: 'precisa_aprender', label: 'Precisa Aprender' },
  { value: 'tirada', label: 'Tirada' },
  { value: 'tocando_bem', label: 'Tocando Bem' },
  { value: 'tirando_onda', label: 'Tirando Onda' },
]

// Verifica se há filtros ativos
const hasActiveFilters = computed(() => {
  return (
    filters.value.nao_praticadas_ha !== undefined ||
    filters.value.nivel_fluencia.length > 0 ||
    filters.value.tem_introducao !== undefined ||
    filters.value.introducao_aprendida !== undefined ||
    filters.value.tem_tercas !== undefined ||
    filters.value.tercas_aprendidas !== undefined ||
    filters.value.tem_arranjo_6_cordas !== undefined ||
    filters.value.arranjo_6_cordas_aprendido !== undefined
  )
})

// Handlers de filtros
function toggleDaysFilter(days: number) {
  if (filters.value.nao_praticadas_ha === days) {
    filters.value.nao_praticadas_ha = undefined
  } else {
    filters.value.nao_praticadas_ha = days
  }
}

function toggleNivelFilter(nivel: string) {
  const index = filters.value.nivel_fluencia.indexOf(nivel)
  if (index > -1) {
    filters.value.nivel_fluencia.splice(index, 1)
  } else {
    filters.value.nivel_fluencia.push(nivel)
  }
}

function toggleBooleanFilter(field: string, value: boolean) {
  const currentValue = (filters.value as any)[field]
  ;(filters.value as any)[field] = currentValue === value ? undefined : value
}

function clearFilters() {
  filters.value = {
    nivel_fluencia: [],
  }
}

// Handlers de UI
function getNivelFluenciaClass(nivel: string): string {
  const classes: Record<string, string> = {
    precisa_aprender: 'bg-red-50 text-red-700',
    tirada: 'bg-yellow-50 text-yellow-700',
    tocando_bem: 'bg-blue-50 text-blue-700',
    tirando_onda: 'bg-green-50 text-green-700',
  }
  return classes[nivel] || 'bg-gray-50 text-gray-700'
}

function getNivelFluenciaLabel(nivel: string): string {
  const nivelObj = niveisFluencia.find(n => n.value === nivel)
  return nivelObj?.label || nivel
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Handlers
async function handleAddMusic(data: { nome: string; autor?: string; links?: string[] }) {
  try {
    await createItem({
      regional_id: user?.regional_id || 0,
      ...data,
    })

    if (user?.regional_id) {
      await loadRepertoire(user.regional_id)
    }
    showAddModal.value = false
  } catch (err: any) {
    console.error('Erro ao adicionar:', err)
    alert(err.response?.data?.error || 'Erro ao adicionar música')
  }
}

async function openEditModal(item: RepertoireItem, index: number) {
  editingItem.value = item
  editingIndex.value = index
  sequentialMode.value = true
  
  // Buscar dados de proficiência do usuário para esta música
  if (user?.id) {
    try {
      const memberData = await memberRepertoireService.getByItem(user.id, item.id)
      if (memberData) {
        editingItem.value = {
          ...item,
          member_data: memberData
        }
      }
    } catch (err) {
      console.log('Sem dados de proficiência para esta música')
    }
  }
  
  showEditModal.value = true
}

// Handler para "Salvar e Fechar"
async function handleEditMusic(data: { 
  id: number
  nome: string
  autor?: string
  links?: string[]
  tonalidade?: string
  notas?: string
  tem_introducao?: boolean
  tem_tercas?: boolean
  tem_arranjo_6_cordas?: boolean
  introducao_aprendida?: boolean
  tercas_aprendidas?: boolean
  arranjo_6_cordas_aprendido?: boolean
  nivel_fluencia?: string
  notas_pessoais?: string
}) {
  saving.value = true
  
  try {
    // 1. Atualizar dados gerais (caracterização da música)
    await updateItem(data.id, {
      nome: data.nome,
      autor: data.autor,
      links: data.links,
      tonalidade: data.tonalidade,
      notas: data.notas,
      tem_introducao: data.tem_introducao,
      tem_tercas: data.tem_tercas,
      tem_arranjo_6_cordas: data.tem_arranjo_6_cordas,
    })

    // 2. Inicializar registro em member_repertoire se não existir
    await initializeIfNeeded(data.id)

    // 3. Atualizar dados do usuário (proficiência)
    await updateMemberPracticeFields(data.id, {
      introducao_aprendida: data.introducao_aprendida,
      tercas_aprendidas: data.tercas_aprendidas,
      arranjo_6_cordas_aprendido: data.arranjo_6_cordas_aprendido,
      nivel_fluencia: data.nivel_fluencia,
      notas_pessoais: data.notas_pessoais,
    })

    // Recarrega o repertório para pegar os dados atualizados
    if (user?.regional_id && user?.id) {
      loadingRepertoire.value = true
      await loadRepertoire(user.regional_id, user.id)
      loadingRepertoire.value = false
    }

    // Fecha o modal e reseta estado
    showEditModal.value = false
    editingItem.value = null
    editingIndex.value = -1
    sequentialMode.value = false
  } catch (err: any) {
    console.error('Erro ao editar:', err)
    alert(err.response?.data?.error || 'Erro ao atualizar música')
  } finally {
    saving.value = false
  }
}

// Handler para "Salvar e Continuar"
async function handleEditMusicContinue(data: {
  id: number
  nome: string
  autor?: string
  links?: string[]
  tonalidade?: string
  notas?: string
  tem_introducao?: boolean
  tem_tercas?: boolean
  tem_arranjo_6_cordas?: boolean
  introducao_aprendida?: boolean
  tercas_aprendidas?: boolean
  arranjo_6_cordas_aprendido?: boolean
  nivel_fluencia?: string
  notas_pessoais?: string
}) {
  console.log('[handleEditMusicContinue] INÍCIO - Data:', data)
  console.log('[handleEditMusicContinue] editingIndex:', editingIndex.value)
  console.log('[handleEditMusicContinue] items.value.length:', items.value.length)
  console.log('[handleEditMusicContinue] user:', user)
  
  saving.value = true

  try {
    // 1. Salva dados gerais (caracterização da música)
    console.log('[handleEditMusicContinue] 1. Salvando dados gerais...')
    await updateItem(data.id, {
      nome: data.nome,
      autor: data.autor,
      links: data.links,
      tonalidade: data.tonalidade,
      notas: data.notas,
      tem_introducao: data.tem_introducao,
      tem_tercas: data.tem_tercas,
      tem_arranjo_6_cordas: data.tem_arranjo_6_cordas,
    })
    console.log('[handleEditMusicContinue] 1. Dados gerais salvos')

    // 2. Inicializar registro em member_repertoire se não existir
    console.log('[handleEditMusicContinue] 2. Inicializando member_repertoire...')
    await initializeIfNeeded(data.id)
    console.log('[handleEditMusicContinue] 2. member_repertoire inicializado')

    // 3. Salva dados do usuário (proficiência)
    console.log('[handleEditMusicContinue] 3. Salvando dados do usuário...')
    await updateMemberPracticeFields(data.id, {
      introducao_aprendida: data.introducao_aprendida,
      tercas_aprendidas: data.tercas_aprendidas,
      arranjo_6_cordas_aprendido: data.arranjo_6_cordas_aprendido,
      nivel_fluencia: data.nivel_fluencia,
      notas_pessoais: data.notas_pessoais,
    })
    console.log('[handleEditMusicContinue] 3. Dados do usuário salvos')

    // Salvar referência do próximo item ANTES de recarregar
    const nextIndex = editingIndex.value + 1
    const hasNext = nextIndex < filteredItems.value.length
    const nextItemId = hasNext ? filteredItems.value[nextIndex].id : null

    console.log('[handleEditMusicContinue] 4. nextIndex:', nextIndex, 'hasNext:', hasNext, 'nextItemId:', nextItemId)

    // Recarrega o repertório
    if (user?.regional_id && user?.id) {
      console.log('[handleEditMusicContinue] 5. Recarregando repertório...')
      loadingRepertoire.value = true
      await loadRepertoire(user.regional_id, user.id)
      loadingRepertoire.value = false
      console.log('[handleEditMusicContinue] 5. Repertório recarregado - items.value.length:', items.value.length)
    }

    if (hasNext && nextItemId) {
      console.log('[handleEditMusicContinue] 6. Buscando próximo item:', nextItemId)
      // Buscar próximo item do array atualizado pelo ID
      const nextItem = items.value.find((i: any) => i.id === nextItemId)
      console.log('[handleEditMusicContinue] 6. nextItem:', nextItem)
      
      if (nextItem) {
        editingIndex.value = nextIndex
        editingItem.value = nextItem
        console.log('[handleEditMusicContinue] 7. editingItem atualizado')

        // Carregar dados de proficiência da próxima música
        if (user?.id) {
          const memberData = await memberRepertoireService.getByItem(user.id, nextItem.id)
          console.log('[handleEditMusicContinue] 8. memberData:', memberData)
          if (memberData) {
            editingItem.value = {
              ...nextItem,
              member_data: memberData
            }
          }
        }
        
        console.log('[handleEditMusicContinue] ✅ SUCESSO')
      }
    } else {
      console.log('[handleEditMusicContinue] 6. Última música - fechando modal')
      // Chegou na última música, fecha o modal
      showEditModal.value = false
      editingItem.value = null
      editingIndex.value = -1
      sequentialMode.value = false
    }
  } catch (err: any) {
    console.error('[handleEditMusicContinue] ❌ ERRO:', err)
    alert(err.response?.data?.error || 'Erro ao atualizar música')
  } finally {
    saving.value = false
    console.log('[handleEditMusicContinue] FIM')
  }
}

async function handleImport(texto: string) {
  try {
    await importList(texto)

    if (user?.regional_id) {
      await loadRepertoire(user.regional_id)
    }
    showImportModal.value = false
  } catch (err: any) {
    console.error('Erro ao importar:', err)
    alert(err.response?.data?.error || 'Erro ao importar lista')
  }
}

function confirmDelete(id: number) {
  if (confirm('Tem certeza que deseja excluir esta música?')) {
    deleteItem(id)
  }
}

// Retorna ícone MDI baseado na URL do link
function getLinkIcon(url: string): string {
  if (url.includes('spotify.com')) return 'mdi mdi-spotify'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'mdi mdi-youtube'
  if (url.includes('soundcloud.com')) return 'mdi mdi-soundcloud'
  return 'mdi mdi-link'
}

onMounted(() => {
  console.log('[RepertoireView] onMounted - User:', user)
  
  if (user?.regional_id && user?.id) {
    // Sempre carregar repertório com dados de proficiência do usuário
    console.log('[RepertoireView] Carregando repertório para regional:', user.regional_id, 'member:', user.id)
    loadRepertoire(user.regional_id, user.id)
      .then(() => {
        console.log('[RepertoireView] Repertório carregado com sucesso')
      })
      .catch(err => {
        console.error('[RepertoireView] Erro ao carregar repertório:', err)
      })
  } else {
    console.error('[RepertoireView] Usuário não autenticado ou sem regional')
  }
})
</script>
