<template>
  <div>
    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6 inline-flex items-center gap-2">
      <span class="mdi mdi-school"></span>
      Acompanhar Estudos
    </h2>

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
      <div class="px-4 sm:px-6 py-4 border-b">
        <h3 class="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
          <span class="mdi mdi-history"></span>
          Histórico de Estudos
        </h3>
      </div>

      <div v-if="logs.length === 0" class="p-8 text-center text-gray-500">
        <span class="mdi mdi-book-open text-4xl text-gray-300 block mb-2"></span>
        Nenhum estudo registrado ainda.
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

                <!-- Data -->
                <span class="text-xs text-gray-500 inline-flex items-center gap-1">
                  <span class="mdi mdi-calendar"></span>
                  {{ formatDate(log.estudado_em) }}
                </span>
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useStudyLogs } from '../composables/useStudyLogs'

const { state } = useAuth()
const { logs, stats, loadLogs, loadStats, formatDate } = useStudyLogs()

const user = state.user

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
    await loadLogs(user.id)
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  }
}

onMounted(loadData)
</script>
