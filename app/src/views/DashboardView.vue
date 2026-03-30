<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <button
        @click="loadAllData"
        :disabled="loading"
        class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Atualizar dados"
      >
        <span class="mdi mdi-refresh" :class="{ 'mdi-spin': loading }"></span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !loaded" class="flex items-center justify-center py-12">
      <span class="mdi mdi-loading mdi-spin text-4xl text-blue-600"></span>
      <span class="ml-3 text-gray-600">Carregando dados...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasData" class="text-center py-12 bg-white rounded-lg shadow">
      <span class="mdi mdi-music text-6xl text-gray-300"></span>
      <h3 class="mt-4 text-lg font-semibold text-gray-900">Nenhuma música cadastrada</h3>
      <p class="mt-2 text-gray-500">Comece adicionando músicas ao seu repertório</p>
      <button
        @click="$router.push('/repertoire')"
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Ir para Repertório
      </button>
    </div>

    <div v-else class="space-y-6">
      <!-- Filtro Individual/Grupo/Todos -->
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

      <!-- Calendário de Ensaios -->
      <CalendarWidget
        :member-id="user?.id || 0"
        title="Calendário de Ensaios"
        :filter-type="filterType"
        @select-date="openPracticeModal"
      />

      <!-- Cards de Estatísticas Gerais -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total de Músicas -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total de Músicas</p>
              <p class="text-3xl font-bold text-blue-600">{{ totalMusicas }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="mdi mdi-music text-blue-600 text-2xl"></span>
            </div>
          </div>
        </div>

        <!-- Total de Estudos -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Estudos Realizados</p>
              <p class="text-3xl font-bold text-purple-600">{{ totalEstudos }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span class="mdi mdi-school text-purple-600 text-2xl"></span>
            </div>
          </div>
        </div>

        <!-- Estudos na Semana -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Estudos na Semana</p>
              <p class="text-3xl font-bold text-green-600">{{ estudosNaSemana }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span class="mdi mdi-calendar-week text-green-600 text-2xl"></span>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">últimos 7 dias</p>
        </div>

        <!-- Média de Estudos por Música -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Média de Estudos</p>
              <p class="text-3xl font-bold text-orange-600">{{ mediaEstudosPorMusica }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span class="mdi mdi-chart-bar text-orange-600 text-2xl"></span>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">por música</p>
        </div>
      </div>

      <!-- Frequência de Estudos -->
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">📅 Frequência de Estudos</h2>
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            @click="openFrequencyModal('semana')"
            class="bg-white rounded-lg shadow p-4 text-center cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <div class="flex items-center justify-center gap-1 mb-1">
              <span class="mdi mdi-calendar text-green-600 text-sm"></span>
              <div class="text-sm text-gray-600">Semana</div>
            </div>
            <div class="text-2xl font-bold text-green-600">{{ estudosNaSemana }}</div>
            <div class="text-xs text-gray-500 mt-1">estudos</div>
          </div>
          <div
            @click="openFrequencyModal('mes')"
            class="bg-white rounded-lg shadow p-4 text-center cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <div class="flex items-center justify-center gap-1 mb-1">
              <span class="mdi mdi-calendar-month text-blue-600 text-sm"></span>
              <div class="text-sm text-gray-600">Mês</div>
            </div>
            <div class="text-2xl font-bold text-blue-600">{{ estudosNoMes }}</div>
            <div class="text-xs text-gray-500 mt-1">estudos</div>
          </div>
          <div
            @click="openFrequencyModal('trimestre')"
            class="bg-white rounded-lg shadow p-4 text-center cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <div class="flex items-center justify-center gap-1 mb-1">
              <span class="mdi mdi-calendar-multiselect text-purple-600 text-sm"></span>
              <div class="text-sm text-gray-600">Trimestre</div>
            </div>
            <div class="text-2xl font-bold text-purple-600">{{ estudosNoTrimestre }}</div>
            <div class="text-xs text-gray-500 mt-1">estudos</div>
          </div>
          <div
            @click="openFrequencyModal('semestre')"
            class="bg-white rounded-lg shadow p-4 text-center cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <div class="flex items-center justify-center gap-1 mb-1">
              <span class="mdi mdi-calendar-range text-orange-600 text-sm"></span>
              <div class="text-sm text-gray-600">Semestre</div>
            </div>
            <div class="text-2xl font-bold text-orange-600">{{ estudosNoSemestre }}</div>
            <div class="text-xs text-gray-500 mt-1">estudos</div>
          </div>
          <div
            @click="openFrequencyModal('ano')"
            class="bg-white rounded-lg shadow p-4 text-center cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <div class="flex items-center justify-center gap-1 mb-1">
              <span class="mdi mdi-calendar-star text-red-600 text-sm"></span>
              <div class="text-sm text-gray-600">Ano</div>
            </div>
            <div class="text-2xl font-bold text-red-600">{{ estudosNoAno }}</div>
            <div class="text-xs text-gray-500 mt-1">estudos</div>
          </div>
        </div>
      </div>

      <!-- Músicas Diferentes por Período -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-gray-900">Músicas Estudadas na Semana</h3>
            <span class="mdi mdi-music-box text-blue-600"></span>
          </div>
          <div class="text-3xl font-bold text-blue-600">{{ musicasDiferentesSemana }}</div>
          <p class="text-sm text-gray-500 mt-1">músicas diferentes</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-gray-900">Músicas Estudadas no Mês</h3>
            <span class="mdi mdi-music-box text-green-600"></span>
          </div>
          <div class="text-3xl font-bold text-green-600">{{ musicasDiferentesMes }}</div>
          <p class="text-sm text-gray-500 mt-1">músicas diferentes</p>
        </div>
      </div>

      <!-- Progresso de Aprendizado -->
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Progresso de Aprendizado</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Introduções -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium text-gray-900">Introduções</h3>
              <span class="mdi mdi-music text-blue-600"></span>
            </div>
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {{ introducoesAprendidas }}/{{ totalComIntroducao }}
            </div>
            <p class="text-sm text-gray-500 mb-3">Aprendidas</p>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: percentualIntroducoes + '%' }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ percentualIntroducoes.toFixed(0) }}% concluído</p>
          </div>

          <!-- Terças -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium text-gray-900">Terças</h3>
              <span class="mdi mdi-music text-green-600"></span>
            </div>
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {{ tercasAprendidas }}/{{ totalComTercas }}
            </div>
            <p class="text-sm text-gray-500 mb-3">Aprendidas</p>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-green-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: percentualTercas + '%' }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ percentualTercas.toFixed(0) }}% concluído</p>
          </div>

          <!-- Arranjos 6 Cordas -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium text-gray-900">Arranjos 6 Cordas</h3>
              <span class="mdi mdi-guitar-pick text-orange-600"></span>
            </div>
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {{ arranjosAprendidos }}/{{ totalComArranjos }}
            </div>
            <p class="text-sm text-gray-500 mb-3">Aprendidos</p>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-orange-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: percentualArranjos + '%' }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ percentualArranjos.toFixed(0) }}% concluído</p>
          </div>
        </div>
      </div>

      <!-- Distribuição por Nível de Fluência -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Distribuição por Nível de Fluência</h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="nivel in niveisFluenciaData"
            :key="nivel.value"
            class="text-center p-4 rounded-lg"
            :class="nivel.bgClass"
          >
            <div class="text-3xl font-bold" :class="nivel.textClass">{{ nivel.count }}</div>
            <div class="text-sm font-medium mt-1" :class="nivel.labelClass">{{ nivel.label }}</div>
          </div>
        </div>
      </div>

      <!-- Músicas Mais Estudadas -->
      <div v-if="musicasMaisEstudadas.length > 0" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">🏆 Músicas Mais Estudadas</h2>
        <div class="space-y-3">
          <div
            v-for="(musica, index) in musicasMaisEstudadas"
            :key="musica.nome"
            class="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
              :class="getMedalClass(index)"
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ musica.nome }}</div>
              <div v-if="musica.autor" class="text-sm text-gray-500">{{ musica.autor }}</div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-purple-600">{{ musica.total_estudos }}</div>
              <div class="text-xs text-gray-500">estudos</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estudos Recentes -->
      <div v-if="ultimosEstudos.length > 0" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">📚 Estudos Recentes</h2>
        <div class="space-y-3">
          <div
            v-for="estudo in ultimosEstudos"
            :key="estudo.id"
            class="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="estudo.tipo === 'individual' ? 'bg-blue-100' : 'bg-green-100'"
            >
              <span
                class="mdi"
                :class="estudo.tipo === 'individual' ? 'mdi-account text-blue-600' : 'mdi-account-group text-green-600'"
              ></span>
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ estudo.musica_nome }}</div>
              <div class="text-sm text-gray-500">
                {{ formatarData(estudo.data) }}
                <span class="mx-2">•</span>
                <span :class="estudo.tipo === 'individual' ? 'text-blue-600' : 'text-green-600'">
                  {{ estudo.tipo === 'individual' ? 'Individual' : 'Em Grupo' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Práticas por Data -->
    <PracticeCalendarModal
      v-model="showPracticeModal"
      :member-id="user?.id || 0"
      :date="selectedPracticeDate"
    />

    <!-- Modal de Frequência de Estudos -->
    <StudyFrequencyModal
      v-model="showFrequencyModal"
      :periodo="selectedFrequencyPeriod"
      :member-id="user?.id || 0"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRepertoire } from '../composables/useRepertoire'
import { useStudyLogs, type StudyLog } from '../composables/useStudyLogs'
import CalendarWidget from '../components/dashboard/CalendarWidget.vue'
import PracticeCalendarModal from '../components/base/PracticeCalendarModal.vue'
import StudyFrequencyModal from '../components/base/StudyFrequencyModal.vue'

const { state: authState } = useAuth()
const { items: repertoire, loadRepertoire } = useRepertoire()
const { stats, loadStats, logs, loadLogs } = useStudyLogs()

const user = authState.user
const loading = ref(false)
const loaded = ref(false)
const filterType = ref<'todos' | 'individual' | 'grupo'>('todos')
const showPracticeModal = ref(false)
const selectedPracticeDate = ref<string | null>(null)
const showFrequencyModal = ref(false)
const selectedFrequencyPeriod = ref<'semana' | 'mes' | 'trimestre' | 'semestre' | 'ano'>('semana')

// Carregar todos os dados
async function loadAllData() {
  if (!authState.user?.regional_id || !authState.user?.id) return

  loading.value = true
  try {
    await Promise.all([
      loadRepertoire(authState.user.regional_id, authState.user.id),
      loadStats(authState.user.id),
      loadLogs(authState.user.id),
    ])
    loaded.value = true
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error)
  } finally {
    loading.value = false
  }
}

function openPracticeModal(date: string) {
  selectedPracticeDate.value = date
  showPracticeModal.value = true
}

function openFrequencyModal(periodo: 'semana' | 'mes' | 'trimestre' | 'semestre' | 'ano') {
  selectedFrequencyPeriod.value = periodo
  showFrequencyModal.value = true
}

// Verificar se tem dados
const hasData = computed(() => repertoire.value.length > 0)

// Estatísticas gerais
const totalMusicas = computed(() => repertoire.value.length)
const totalEstudos = computed(() => {
  if (filterType.value === 'todos') return stats.value?.total_estudos || 0
  
  // Filtrar por tipo
  const tipo = filterType.value === 'individual' ? 'individual' : 'grupo'
  const estudoTipo = stats.value?.estudos_por_tipo?.find(e => e.tipo === tipo)
  return estudoTipo?.total || 0
})

// Frequência de estudos por período (filtrada por tipo)
const estudosNaSemana = computed(() => {
  // Nota: idealmente teríamos estatísticas separadas por tipo no backend
  // Por enquanto, usamos as estatísticas gerais para 'todos' e 'individual'
  if (filterType.value === 'grupo') return 0
  return stats.value?.estudos_na_semana || 0
})
const estudosNoMes = computed(() => {
  if (filterType.value === 'grupo') return 0
  return stats.value?.estudos_no_mes || 0
})
const estudosNoTrimestre = computed(() => {
  if (filterType.value === 'grupo') return 0
  return stats.value?.estudos_no_trimestre || 0
})
const estudosNoSemestre = computed(() => {
  if (filterType.value === 'grupo') return 0
  return stats.value?.estudos_no_semestre || 0
})
const estudosNoAno = computed(() => {
  if (filterType.value === 'grupo') return 0
  return stats.value?.estudos_no_ano || 0
})

// Músicas diferentes por período
const musicasDiferentesSemana = computed(() => stats.value?.musicas_diferentes_estudadas_semana || 0)
const musicasDiferentesMes = computed(() => stats.value?.musicas_diferentes_estudadas_mes || 0)

const mediaEstudosPorMusica = computed(() => {
  if (totalMusicas.value === 0) return 0
  return (totalEstudos.value / totalMusicas.value).toFixed(1)
})

// Características - Total
const totalComIntroducao = computed(() =>
  repertoire.value.filter(i => i.tem_introducao).length
)
const totalComTercas = computed(() =>
  repertoire.value.filter(i => i.tem_tercas).length
)
const totalComArranjos = computed(() =>
  repertoire.value.filter(i => i.tem_arranjo_6_cordas).length
)

// Características - Aprendidas
const introducoesAprendidas = computed(() =>
  repertoire.value.filter(i => i.member_data?.introducao_aprendida).length
)
const tercasAprendidas = computed(() =>
  repertoire.value.filter(i => i.member_data?.tercas_aprendidas).length
)
const arranjosAprendidos = computed(() =>
  repertoire.value.filter(i => i.member_data?.arranjo_6_cordas_aprendido).length
)

// Percentuais
const percentualIntroducoes = computed(() =>
  totalComIntroducao.value > 0
    ? (introducoesAprendidas.value / totalComIntroducao.value) * 100
    : 0
)
const percentualTercas = computed(() =>
  totalComTercas.value > 0
    ? (tercasAprendidas.value / totalComTercas.value) * 100
    : 0
)
const percentualArranjos = computed(() =>
  totalComArranjos.value > 0
    ? (arranjosAprendidos.value / totalComArranjos.value) * 100
    : 0
)

// Distribuição por nível
const niveisFluenciaData = computed(() => {
  const levels = [
    { value: 'precisa_aprender', label: 'Precisa Aprender', bgClass: 'bg-gray-50', textClass: 'text-gray-900', labelClass: 'text-gray-600' },
    { value: 'tirada', label: 'Tirada', bgClass: 'bg-blue-50', textClass: 'text-blue-900', labelClass: 'text-blue-600' },
    { value: 'tocando_bem', label: 'Tocando Bem', bgClass: 'bg-green-50', textClass: 'text-green-900', labelClass: 'text-green-600' },
    { value: 'tirando_onda', label: 'Tirando Onda', bgClass: 'bg-purple-50', textClass: 'text-purple-900', labelClass: 'text-purple-600' },
  ]

  return levels.map(level => ({
    ...level,
    count: repertoire.value.filter(
      i => (i.member_data?.nivel_fluencia || 'precisa_aprender') === level.value
    ).length,
  }))
})

// Músicas mais estudadas
const musicasMaisEstudadas = computed(() =>
  stats.value?.musicas_mais_estudadas?.slice(0, 5) || []
)

function getMedalClass(index: number): string {
  if (index === 0) return 'bg-yellow-500'
  if (index === 1) return 'bg-gray-400'
  if (index === 2) return 'bg-orange-500'
  return 'bg-gray-300'
}

// Últimos estudos (filtrados por tipo)
const ultimosEstudos = computed(() => {
  let filteredLogs = logs.value
  if (filterType.value === 'individual') {
    filteredLogs = logs.value.filter(log => log.tipo === 'individual')
  } else if (filterType.value === 'grupo') {
    filteredLogs = logs.value.filter(log => log.tipo === 'grupo')
  }
  return filteredLogs.slice(0, 5) as StudyLog[]
})

// Estatísticas filtradas por tipo
const estudosFiltrados = computed(() => {
  if (!stats.value) return null

  if (filterType.value === 'todos') {
    return stats.value
  }

  // Para filtros individual/grupo, precisamos buscar estatísticas específicas
  // Por enquanto, retornamos as estatísticas gerais (o ideal seria ter endpoints separados)
  return stats.value
})

function formatarData(dataStr: string): string {
  return new Date(dataStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Carregar dados ao montar
onMounted(() => {
  loadAllData()
})
</script>
