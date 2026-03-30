<template>
  <BaseModal
    v-model="isOpen"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    size="lg"
    @close="handleClose"
  >
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="mdi mdi-loading mdi-spin text-4xl text-blue-600"></span>
      <span class="ml-3 text-gray-600">Carregando...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasData" class="text-center py-12">
      <span class="mdi mdi-calendar-remove text-6xl text-gray-300"></span>
      <h3 class="mt-4 text-lg font-semibold text-gray-900">Nenhum estudo neste período</h3>
      <p class="mt-2 text-gray-500">
        {{ emptyStateMessage }}
      </p>
    </div>

    <!-- Conteúdo -->
    <div v-else class="space-y-4">
      <!-- Filtro por Tipo -->
      <div class="flex gap-2">
        <button
          @click="filterType = 'todos'"
          :class="filterType === 'todos'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          class="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          Todos
        </button>
        <button
          @click="filterType = 'individual'"
          :class="filterType === 'individual'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          class="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <span class="mdi mdi-account mr-1"></span>
          Individual
        </button>
        <button
          @click="filterType = 'grupo'"
          :class="filterType === 'grupo'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          class="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <span class="mdi mdi-account-group mr-1"></span>
          Grupo
        </button>
      </div>

      <!-- Lista de Músicas -->
      <div class="space-y-2">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <!-- Ícone do Tipo -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            :class="item.tipo === 'individual' ? 'bg-blue-100' : 'bg-green-100'"
          >
            <span
              class="mdi"
              :class="item.tipo === 'individual' ? 'mdi-account text-blue-600' : 'mdi-account-group text-green-600'"
            ></span>
          </div>

          <!-- Informações da Música -->
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 truncate">{{ item.musica_nome }}</div>
            <div v-if="item.autor" class="text-sm text-gray-500 truncate">{{ item.autor }}</div>
            <div class="text-xs text-gray-400 mt-1">
              {{ formatDate(item.data) }}
              <span class="mx-1">•</span>
              <span :class="item.tipo === 'individual' ? 'text-blue-600' : 'text-green-600'">
                {{ item.tipo === 'individual' ? 'Individual' : 'Em Grupo' }}
              </span>
            </div>
          </div>

          <!-- Badge de Contagem (se houver múltiplos estudos da mesma música) -->
          <div v-if="item.contagem && item.contagem > 1" class="text-right">
            <div class="text-sm font-bold text-purple-600">{{ item.contagem }}</div>
            <div class="text-xs text-gray-500">estudos</div>
          </div>
        </div>
      </div>

      <!-- Resumo -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">
            <span class="mdi mdi-music-box mr-2"></span>
            Músicas diferentes:
          </span>
          <span class="font-bold text-gray-900">{{ musicasDiferentes }}</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-2">
          <span class="text-gray-600">
            <span class="mdi mdi-school mr-2"></span>
            Total de estudos:
          </span>
          <span class="font-bold text-gray-900">{{ totalEstudos }}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <button
        @click="handleClose"
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
      >
        Fechar
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import BaseModal from './BaseModal.vue'
import { useStudyLogs, type StudyLog } from '../../composables/useStudyLogs'

interface Props {
  modelValue: boolean
  periodo: 'semana' | 'mes' | 'trimestre' | 'semestre' | 'ano'
  memberId: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  periodo: 'semana',
  memberId: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { logs, loadLogs, formatDate } = useStudyLogs()

const filterType = ref<'todos' | 'individual' | 'grupo'>('todos')
const loading = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Títulos e descrições dinâmicas
const modalTitle = computed(() => {
  const titulos: Record<string, string> = {
    semana: '📅 Músicas Estudadas na Semana',
    mes: '📅 Músicas Estudadas no Mês',
    trimestre: '📅 Músicas Estudadas no Trimestre',
    semestre: '📅 Músicas Estudadas no Semestre',
    ano: '📅 Músicas Estudadas no Ano',
  }
  return titulos[props.periodo] || 'Músicas Estudadas'
})

const modalSubtitle = computed(() => {
  const descricoes: Record<string, string> = {
    semana: 'Últimos 7 dias',
    mes: 'Últimos 30 dias',
    trimestre: 'Últimos 3 meses',
    semestre: 'Últimos 6 meses',
    ano: 'Últimos 12 meses',
  }
  return descricoes[props.periodo] || ''
})

const emptyStateMessage = computed(() => {
  const mensagens: Record<string, string> = {
    semana: 'Que tal começar a estudar algumas músicas esta semana?',
    mes: 'Aproveite o mês para praticar seu repertório!',
    trimestre: 'Bora estabelecer uma rotina de estudos neste trimestre?',
    semestre: 'Que tal planejar seus estudos para este semestre?',
    ano: 'Comece o ano com o pé direito e pratique bastante!',
  }
  return mensagens[props.periodo] || 'Registre seus estudos para ver as estatísticas aqui.'
})

// Filtrar logs por período
const filteredLogs = computed(() => {
  const now = new Date()
  let daysAgo = 0

  switch (props.periodo) {
    case 'semana':
      daysAgo = 7
      break
    case 'mes':
      daysAgo = 30
      break
    case 'trimestre':
      daysAgo = 90
      break
    case 'semestre':
      daysAgo = 180
      break
    case 'ano':
      daysAgo = 365
      break
  }

  const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

  return logs.value.filter(log => {
    const logDate = new Date(log.data)
    return logDate >= cutoffDate
  })
})

// Filtrar por tipo
const filteredItems = computed(() => {
  let items = filteredLogs.value

  if (filterType.value === 'individual') {
    items = items.filter(log => log.tipo === 'individual')
  } else if (filterType.value === 'grupo') {
    items = items.filter(log => log.tipo === 'grupo')
  }

  // Agrupar por música e contar estudos
  const grouped: Record<number, StudyLog & { contagem: number }> = {}

  items.forEach(log => {
    const key = log.repertoire_item_id
    if (!grouped[key]) {
      grouped[key] = { ...log, contagem: 1 }
    } else {
      grouped[key].contagem += 1
    }
  })

  // Ordenar por data (mais recente primeiro)
  return Object.values(grouped).sort((a, b) => {
    return new Date(b.data).getTime() - new Date(a.data).getTime()
  })
})

const hasData = computed(() => filteredItems.value.length > 0)

const musicasDiferentes = computed(() => filteredItems.value.length)

const totalEstudos = computed(() => {
  return filteredItems.value.reduce((sum, item) => sum + (item.contagem || 1), 0)
})

async function loadData() {
  if (!props.memberId) return

  loading.value = true
  try {
    // Carregar logs suficientes para cobrir o período máximo (ano)
    await loadLogs(props.memberId, 1000)
  } catch (error) {
    console.error('Erro ao carregar logs:', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  isOpen.value = false
  filterType.value = 'todos'
}

// Recarregar dados quando o período mudar
watch(() => props.periodo, () => {
  if (props.modelValue && props.memberId) {
    loadData()
  }
})

// Carregar dados ao abrir a modal
watch(() => props.modelValue, (newValue) => {
  if (newValue && props.memberId) {
    loadData()
  }
})

onMounted(() => {
  if (props.modelValue && props.memberId) {
    loadData()
  }
})
</script>

<style scoped>
/* Custom scrollbar para a lista */
.space-y-2::-webkit-scrollbar {
  width: 0.5rem;
}

.space-y-2::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 0.25rem;
}

.space-y-2::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 0.25rem;
}

.space-y-2::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
