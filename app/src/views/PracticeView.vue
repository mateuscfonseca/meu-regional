<template>
  <div>
    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6 inline-flex items-center gap-2">
      <span class="mdi mdi-account-group"></span>
      Práticas de Grupo (Ensaios)
    </h2>

    <!-- Calendário de Ensaios -->
    <CalendarWidget
      :member-id="user?.id || 0"
      title="Calendário de Ensaios"
      filter-type="grupo"
      @select-date="openPracticeModal"
      class="mb-6"
    />

    <!-- Estatísticas -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-account-group"></span>
          Total de Ensaios
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{{ stats?.total_ensaios || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-calendar-week"></span>
          Esta Semana
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{{ stats?.ensaios_na_semana || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-calendar"></span>
          Este Mês
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{{ stats?.ensaios_no_mes || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-clock"></span>
          Tempo Total
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">{{ stats?.tempo_total_minutos || 0 }}<span class="text-sm text-gray-500 ml-1">min</span></div>
      </div>
    </div>

    <!-- Frequência de Ensaios -->
    <div class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
        <span class="mdi mdi-calendar-clock"></span>
        Frequência de Ensaios
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div class="text-center p-3 rounded-lg bg-green-50">
          <div class="text-sm text-gray-600 mb-1">Semana</div>
          <div class="text-xl sm:text-2xl font-bold text-green-600">{{ stats?.ensaios_na_semana || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">ensaios</div>
        </div>
        <div class="text-center p-3 rounded-lg bg-blue-50">
          <div class="text-sm text-gray-600 mb-1">Mês</div>
          <div class="text-xl sm:text-2xl font-bold text-blue-600">{{ stats?.ensaios_no_mes || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">ensaios</div>
        </div>
        <div class="text-center p-3 rounded-lg bg-purple-50">
          <div class="text-sm text-gray-600 mb-1">Trimestre</div>
          <div class="text-xl sm:text-2xl font-bold text-purple-600">{{ stats?.ensaios_no_trimestre || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">ensaios</div>
        </div>
        <div class="text-center p-3 rounded-lg bg-orange-50">
          <div class="text-sm text-gray-600 mb-1">Semestre</div>
          <div class="text-xl sm:text-2xl font-bold text-orange-600">{{ stats?.ensaios_no_semestre || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">ensaios</div>
        </div>
        <div class="text-center p-3 rounded-lg bg-red-50">
          <div class="text-sm text-gray-600 mb-1">Ano</div>
          <div class="text-xl sm:text-2xl font-bold text-red-600">{{ stats?.ensaios_no_ano || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">ensaios</div>
        </div>
      </div>
    </div>

    <!-- Músicas Diferentes -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-music-box"></span>
          Músicas Ensaiadas na Semana
        </div>
        <div class="text-xl sm:text-2xl font-bold text-green-600 mt-2">{{ stats?.musicas_diferentes_ensaiadas_semana || 0 }}</div>
        <div class="text-xs text-gray-500 mt-1">músicas diferentes</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 sm:p-6">
        <div class="text-xs sm:text-sm text-gray-600 inline-flex items-center gap-1">
          <span class="mdi mdi-music-box"></span>
          Músicas Ensaiadas no Mês
        </div>
        <div class="text-xl sm:text-2xl font-bold text-blue-600 mt-2">{{ stats?.musicas_diferentes_ensaiadas_mes || 0 }}</div>
        <div class="text-xs text-gray-500 mt-1">músicas diferentes</div>
      </div>
    </div>

    <!-- Último Ensaio -->
    <div v-if="stats?.ultimo_ensaio" class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-2 inline-flex items-center gap-2">
        <span class="mdi mdi-calendar-check"></span>
        Último Ensaio
      </h3>
      <div class="flex items-center gap-4">
        <div class="text-2xl font-bold text-green-600">{{ formatDate(stats.ultimo_ensaio.data) }}</div>
        <div class="text-sm text-gray-600">
          <span class="mdi mdi-music"></span>
          {{ stats.ultimo_ensaio.musicas_count }} {{ stats.ultimo_ensaio.musicas_count === 1 ? 'música' : 'músicas' }}
        </div>
      </div>
    </div>

    <!-- Músicas Mais Ensaiadas -->
    <div v-if="stats?.musicas_mais_ensaiadas && stats.musicas_mais_ensaiadas.length > 0" class="bg-white rounded-lg shadow p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
        <span class="mdi mdi-trophy"></span>
        Músicas Mais Ensaiadas
      </h3>
      <div class="space-y-3">
        <div
          v-for="(musica, index) in stats.musicas_mais_ensaiadas"
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
            <div class="text-lg font-bold text-green-600">{{ musica.total_ensaios }}</div>
            <div class="text-xs text-gray-500">ensaios</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Histórico de Ensaios -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 class="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
          <span class="mdi mdi-history"></span>
          Histórico de Ensaios
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

      <div v-if="logs.length === 0" class="p-8 text-center text-gray-500">
        <span class="mdi mdi-account-group text-4xl text-gray-300 block mb-2"></span>
        Nenhum ensaio registrado ainda.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="log in logs"
          :key="log.id"
          class="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <!-- Informações principais -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-2">
                <!-- Data -->
                <span class="text-xs text-gray-500 inline-flex items-center gap-1">
                  <span class="mdi mdi-calendar"></span>
                  {{ formatDate(log.data) }}
                </span>

                <!-- Badge Grupo -->
                <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex-shrink-0">
                  <span class="mdi mdi-account-group"></span>
                  Grupo
                </span>
              </div>

              <!-- Música -->
              <div class="font-medium text-gray-900 text-sm sm:text-base truncate">
                <span class="mdi mdi-music text-xs mr-1"></span>
                {{ log.musica_nome }}
              </div>

              <!-- Membro e notas -->
              <div class="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                <span class="inline-flex items-center gap-1">
                  <span class="mdi mdi-account"></span>
                  {{ log.membro_nome }}
                </span>
                <span v-if="log.duracao_minutos" class="inline-flex items-center gap-1">
                  <span class="mdi mdi-clock"></span>
                  {{ log.duracao_minutos }} min
                </span>
                <span v-if="log.notas" class="inline-flex items-center gap-1 truncate max-w-full">
                  <span class="mdi mdi-note-text"></span>
                  <span class="truncate">{{ log.notas }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useGroupPractice } from '../composables/useGroupPractice'
import CalendarWidget from '../components/dashboard/CalendarWidget.vue'
import PracticeCalendarModal from '../components/base/PracticeCalendarModal.vue'

const { state } = useAuth()
const { logs, stats, loadLogs, loadStats, formatDate } = useGroupPractice()

const user = state.user
const logsLimit = ref(10)
const showPracticeModal = ref(false)
const selectedPracticeDate = ref<string | null>(null)

function openPracticeModal(date: string) {
  selectedPracticeDate.value = date
  showPracticeModal.value = true
}

async function loadData() {
  if (!user?.id || !user?.regional_id) return

  try {
    await loadStats(user.id)
    await loadLogs(user.id, logsLimit.value)
  } catch (error) {
    console.error('Erro ao carregar dados de ensaios:', error)
  }
}

function loadLogsLimit() {
  if (!user?.id) return
  loadLogs(user.id, logsLimit.value)
}

function getMedalClass(index: number): string {
  if (index === 0) return 'bg-yellow-500'
  if (index === 1) return 'bg-gray-400'
  if (index === 2) return 'bg-orange-500'
  return 'bg-gray-300'
}

onMounted(loadData)
</script>
