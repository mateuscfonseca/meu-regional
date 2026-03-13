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
          <span class="mdi mdi-clock"></span>
          Tempo Total
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{{ stats?.tempo_total_minutos || 0 }} min</div>
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

              <!-- Duração e Notas (mobile) -->
              <div class="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                <span class="inline-flex items-center gap-1">
                  <span class="mdi mdi-clock"></span>
                  {{ log.duracao_minutos || '-' }} min
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
