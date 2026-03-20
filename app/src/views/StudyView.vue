<template>
  <div>
    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6 inline-flex items-center gap-2">
      <span class="mdi mdi-school"></span>
      Acompanhar Estudos
    </h2>

    <!-- Filtro Individual/Grupo -->
    <div class="flex gap-2 mb-6">
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
          ? 'bg-purple-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        class="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
      >
        <span class="mdi mdi-account mr-1"></span>
        Individual
      </button>
      <button
        @click="filterType = 'grupo'"
        :class="filterType === 'grupo'
          ? 'bg-green-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        class="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
      >
        <span class="mdi mdi-account-group mr-1"></span>
        Grupo
      </button>
    </div>

    <!-- Calendário de Estudos -->
    <CalendarWidget
      :member-id="user?.id || 0"
      :filter-type="filterType"
      @select-date="openPracticeModal"
      class="mb-6"
    />

    <!-- Estudos de Hoje -->
    <div v-if="estudosHoje.length > 0" class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-4 sm:p-6 mb-6 border-2 border-blue-200">
      <div class="flex items-center gap-2 mb-3">
        <span class="mdi mdi-calendar-today text-blue-600 text-xl"></span>
        <h3 class="text-lg font-semibold text-blue-900">Estudos de Hoje</h3>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div class="bg-white rounded-lg p-3 shadow-sm">
          <div class="text-xs text-gray-500">Total</div>
          <div class="text-xl font-bold text-blue-600">{{ estudosHoje.length }}</div>
        </div>
        <div class="bg-white rounded-lg p-3 shadow-sm">
          <div class="text-xs text-gray-500">Individuais</div>
          <div class="text-lg font-bold text-purple-600">{{ estudosHoje.filter(e => e.tipo === 'individual').length }}</div>
        </div>
        <div class="bg-white rounded-lg p-3 shadow-sm">
          <div class="text-xs text-gray-500">Grupo</div>
          <div class="text-lg font-bold text-green-600">{{ estudosHoje.filter(e => e.tipo === 'grupo').length }}</div>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-blue-200">
        <div class="text-sm font-medium text-blue-900 mb-2">Músicas estudadas:</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="estudo in estudosHoje"
            :key="estudo.id"
            class="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700 border border-blue-100"
          >
            {{ estudo.musica_nome }}
          </span>
        </div>
      </div>
    </div>

    <!-- Estatísticas -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-book-open"></span>
          Total de Estudos
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">{{ stats?.total_estudos || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-calendar-week"></span>
          Esta Semana
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{{ stats?.estudos_na_semana || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-account"></span>
          Individuais
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-purple-600 mt-2">{{ individualCount }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-account-group"></span>
          Em Grupo
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-orange-600 mt-2">{{ grupoCount }}</div>
      </div>
    </div>

    <!-- Frequência de Estudos -->
    <div class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
        <span class="mdi mdi-calendar-clock"></span>
        Frequência de Estudos
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div class="text-center p-3 rounded-lg bg-green-50">
          <div class="text-sm text-gray-600 mb-1">Semana</div>
          <div class="text-xl sm:text-2xl font-bold text-green-600">{{ stats?.estudos_na_semana || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">estudos</div>
        </div>
        <div class="text-center p-3 rounded-lg bg-blue-50">
          <div class="text-sm text-gray-600 mb-1">Mês</div>
          <div class="text-xl sm:text-2xl font-bold text-blue-600">{{ stats?.estudos_no_mes || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">estudos</div>
        </div>
        <div class="text-center p-3 rounded-lg bg-purple-50">
          <div class="text-sm text-gray-600 mb-1">Trimestre</div>
          <div class="text-xl sm:text-2xl font-bold text-purple-600">{{ stats?.estudos_no_trimestre || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">estudos</div>
        </div>
        <div class="text-center p-3 rounded-lg bg-orange-50">
          <div class="text-sm text-gray-600 mb-1">Semestre</div>
          <div class="text-xl sm:text-2xl font-bold text-orange-600">{{ stats?.estudos_no_semestre || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">estudos</div>
        </div>
        <div class="text-center p-3 rounded-lg bg-red-50">
          <div class="text-sm text-gray-600 mb-1">Ano</div>
          <div class="text-xl sm:text-2xl font-bold text-red-600">{{ stats?.estudos_no_ano || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">estudos</div>
        </div>
      </div>
    </div>

    <!-- Músicas Diferentes -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-music-box"></span>
          Músicas Estudadas na Semana
        </div>
        <div class="text-xl sm:text-2xl font-bold text-blue-600 mt-2">{{ stats?.musicas_diferentes_estudadas_semana || 0 }}</div>
        <div class="text-xs text-gray-500 mt-1">músicas diferentes</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-music-box"></span>
          Músicas Estudadas no Mês
        </div>
        <div class="text-xl sm:text-2xl font-bold text-green-600 mt-2">{{ stats?.musicas_diferentes_estudadas_mes || 0 }}</div>
        <div class="text-xs text-gray-500 mt-1">músicas diferentes</div>
      </div>
    </div>

    <!-- Histórico - Lista Mobile First -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 class="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
          <span class="mdi mdi-history"></span>
          Histórico de Estudos
        </h3>
        
        <!-- Filtro de quantidade -->
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Mostrar:</label>
          <select
            v-model="logsLimit"
            @change="loadLogsLimit"
            class="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:border-green-500 focus:ring-green-500"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="15">15</option>
            <option :value="100">Todos</option>
          </select>
        </div>
      </div>

      <div v-if="logsFiltrados.length === 0" class="p-8 text-center text-gray-500">
        <span class="mdi mdi-book-open text-4xl text-gray-300 block mb-2"></span>
        Nenhum estudo registrado ainda.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="log in logsFiltrados"
          :key="log.id"
          class="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <!-- Informações principais -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-2">
                <!-- Tipo (badge) -->
                <span
                  class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0"
                  :class="log.tipo === 'individual'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-orange-100 text-orange-800'"
                >
                  <span :class="log.tipo === 'individual' ? 'mdi mdi-account' : 'mdi mdi-account-group'"></span>
                  {{ log.tipo }}
                </span>

                <!-- Data com botão de editar -->
                <div class="flex items-center gap-1">
                  <span class="text-xs text-gray-500 inline-flex items-center gap-1">
                    <span class="mdi mdi-calendar"></span>
                    {{ formatDate(log.estudado_em) }}
                  </span>
                  <button
                    @click="openEditDateModal(log)"
                    type="button"
                    class="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                    aria-label="Editar data"
                    title="Editar data"
                  >
                    <span class="mdi mdi-pencil text-xs"></span>
                  </button>
                </div>
              </div>

              <!-- Música -->
              <div class="font-medium text-gray-900 text-sm sm:text-base truncate">
                <span class="mdi mdi-music text-xs mr-1"></span>
                {{ log.musica_nome }}
              </div>

              <!-- Notas (mobile) -->
              <div class="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                <span v-if="log.notas" class="inline-flex items-center gap-1 truncate max-w-full">
                  <span class="mdi mdi-note-text"></span>
                  <span class="truncate">{{ log.notas }}</span>
                </span>
              </div>
            </div>

            <!-- Botão de excluir -->
            <button
              @click="confirmDelete(log)"
              type="button"
              class="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors self-end sm:self-center"
              aria-label="Excluir estudo"
            >
              <span class="mdi mdi-delete text-lg"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <BaseModal
      v-model="showDeleteModal"
      title="Excluir Estudo"
      size="sm"
    >
      <div class="py-4">
        <div class="flex items-center gap-3 mb-4">
          <span class="mdi mdi-alert-circle text-red-600 text-3xl"></span>
          <p class="text-gray-700">Tem certeza que deseja excluir este registro de estudo?</p>
        </div>
        <p class="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
      </div>

      <template #footer>
        <button
          @click="showDeleteModal = false"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          @click="confirmDeleteLog"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Excluir
        </button>
      </template>
    </BaseModal>

    <!-- Modal de Práticas por Data -->
    <PracticeCalendarModal
      v-model="showPracticeModal"
      :member-id="user?.id || 0"
      :date="selectedPracticeDate"
    />

    <!-- Modal de Edição de Data -->
    <EditDateModal
      v-model="showEditDateModal"
      :item="logToEdit"
      @save="handleEditDate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useStudyLogs } from '../composables/useStudyLogs'
import CalendarWidget from '../components/dashboard/CalendarWidget.vue'
import PracticeCalendarModal from '../components/base/PracticeCalendarModal.vue'
import BaseModal from '../components/base/BaseModal.vue'
import EditDateModal from '../components/base/EditDateModal.vue'

const { state } = useAuth()
const { logs, stats, loadLogs, loadStats, formatDate, deleteLog, updateLogDate } = useStudyLogs()

const user = state.user
const logsLimit = ref(10)
const showDeleteModal = ref(false)
const logToDelete = ref<any>(null)
const filterType = ref<'todos' | 'individual' | 'grupo'>('todos')
const showPracticeModal = ref(false)
const selectedPracticeDate = ref<string | null>(null)
const showEditDateModal = ref(false)
const logToEdit = ref<any>(null)

function openPracticeModal(date: string) {
  selectedPracticeDate.value = date
  showPracticeModal.value = true
}

// Estudos de hoje
const estudosHoje = computed(() => {
  const hoje = new Date().toISOString().split('T')[0]
  return logs.value.filter(log => log.data === hoje)
})

// Logs filtrados por tipo
const logsFiltrados = computed(() => {
  if (filterType.value === 'todos') return logs.value
  return logs.value.filter(log => log.tipo === filterType.value)
})

const individualCount = computed(() => {
  const individual = stats.value?.estudos_por_tipo?.find((e: any) => e.tipo === 'individual')
  return individual?.total || 0
})

const grupoCount = computed(() => {
  const grupo = stats.value?.estudos_por_tipo?.find((e: any) => e.tipo === 'grupo')
  return grupo?.total || 0
})

async function loadData() {
  if (!user?.id || !user?.regional_id) return

  try {
    await loadStats(user.id)
    await loadLogs(user.id, logsLimit.value)
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  }
}

function loadLogsLimit() {
  if (!user?.id) return
  loadLogs(user.id, logsLimit.value)
}

function confirmDelete(log: any) {
  logToDelete.value = log
  showDeleteModal.value = true
}

async function confirmDeleteLog() {
  if (!logToDelete.value || !user?.id) return

  try {
    await deleteLog(logToDelete.value.id, user.id)
    showDeleteModal.value = false
    logToDelete.value = null
  } catch (error) {
    console.error('Erro ao excluir estudo:', error)
  }
}

function openEditDateModal(log: any) {
  logToEdit.value = log
  showEditDateModal.value = true
}

async function handleEditDate(data: { id: number; data: string }) {
  if (!user?.id) return
  
  try {
    await updateLogDate(data.id, data.data, user.id)
    showEditDateModal.value = false
    logToEdit.value = null
  } catch (error) {
    console.error('Erro ao atualizar data:', error)
    alert('Erro ao atualizar data. Tente novamente.')
  }
}

onMounted(loadData)
</script>
