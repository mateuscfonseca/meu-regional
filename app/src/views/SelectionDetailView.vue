<template>
  <div>
    <!-- Voltar -->
    <div class="mb-4 sm:mb-6">
      <router-link to="/selections" class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
        <span class="mdi mdi-arrow-left w-4 h-4"></span>
        Voltar para Seleções
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-12">
      <span class="mdi mdi-loading mdi-spin text-4xl text-blue-600 block mb-2"></span>
      <p class="text-gray-500">Carregando...</p>
    </div>

    <div v-else-if="selection">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div class="flex-1">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-900">{{ selection.nome }}</h2>
            <p v-if="selection.descricao" class="text-gray-600 mt-1 text-sm">{{ selection.descricao }}</p>
          </div>
          <span
            class="px-3 py-1 text-xs sm:text-sm font-medium rounded-full self-start inline-flex items-center gap-1"
            :class="selection.status === 'votacao'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'"
          >
            <span :class="selection.status === 'votacao' ? 'mdi mdi-check-circle' : 'mdi mdi-flag-checkered'"></span>
            {{ selection.status === 'votacao' ? 'Em Votação' : 'Finalizada' }}
          </span>
        </div>

        <div class="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-500">
          <div v-if="selection.data_evento" class="flex items-center gap-1">
            <span class="mdi mdi-calendar"></span> {{ formatDate(selection.data_evento) }}
          </div>
          <div class="flex items-center gap-1">
            <span class="mdi mdi-music"></span> Máx: {{ selection.max_musicas }}
          </div>
          <div class="flex items-center gap-1">
            <span class="mdi mdi-account"></span> {{ selection.criadora_nome }}
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mb-4 sm:mb-6">
        <div class="border-b border-gray-200 overflow-x-auto">
          <nav class="-mb-px flex gap-2 sm:gap-6 min-w-max">
            <button
              @click="activeTab = 'votacao'"
              class="py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap inline-flex items-center gap-2"
              :class="activeTab === 'votacao'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            >
              <span class="mdi mdi-hand-back-right"></span>
              Votação
            </button>
            <button
              @click="activeTab = 'resultados'"
              class="py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap inline-flex items-center gap-2"
              :class="activeTab === 'resultados'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            >
              <span class="mdi mdi-trophy"></span>
              Resultados
            </button>
          </nav>
        </div>
      </div>

      <!-- Conteúdo da Tab -->
      <div v-if="activeTab === 'votacao'">
        <!-- Form de Votação -->
        <div class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <span class="mdi mdi-ballot"></span>
            Votar em Música
          </h3>

          <div class="flex flex-col sm:flex-row gap-3">
            <select
              v-model="selectedMusicId"
              class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 sm:py-3 border text-base sm:text-sm touch-manipulation"
            >
              <option value="">Selecione uma música...</option>
              <option
                v-for="item in repertoireItems"
                :key="item.id"
                :value="item.id"
              >
                {{ item.nome }}{{ item.autor ? ` - ${item.autor}` : '' }}
              </option>
            </select>
            <button
              @click="handleVote"
              :disabled="!selectedMusicId || voting"
              class="px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium touch-manipulation inline-flex items-center justify-center gap-2"
            >
              <span class="mdi mdi-check"></span>
              {{ voting ? 'Votando...' : 'Votar' }}
            </button>
          </div>

          <div v-if="voteError" class="text-red-600 text-sm mt-2 bg-red-50 py-2 px-3 rounded inline-flex items-center gap-2">
            <span class="mdi mdi-alert"></span>
            {{ voteError }}
          </div>
        </div>

        <!-- Músicas já votadas - Lista Mobile First -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-4 sm:px-6 py-4 border-b">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
              <span class="mdi mdi-list-box"></span>
              Músicas Votadas
            </h3>
          </div>
          
          <div v-if="votes.length === 0" class="p-8 text-center text-gray-500">
            <span class="mdi mdi-music text-4xl text-gray-300 block mb-2"></span>
            Nenhuma música votada ainda.
          </div>

          <div v-else class="divide-y divide-gray-200">
            <div
              v-for="vote in votes"
              :key="vote.repertoire_item_id"
              class="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-gray-900 text-sm sm:text-base truncate">{{ vote.musica_nome }}</div>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-xs sm:text-sm text-gray-500 truncate">
                      <span class="mdi mdi-account text-xs"></span>
                      {{ vote.autor || '-' }}
                    </span>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                      <span class="mdi mdi-hand-back-right"></span>
                      {{ vote.total_votos }} voto{{ vote.total_votos !== 1 ? 's' : '' }}
                    </span>
                  </div>
                </div>
                <button
                  @click="removeVoteWrapper(vote.repertoire_item_id)"
                  class="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                  title="Remover voto"
                >
                  <span class="mdi mdi-delete w-5 h-5"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Finalizar seleção -->
        <div v-if="selection.status === 'votacao' && user?.id === selection.criada_por" class="mt-6">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 class="text-yellow-800 font-medium mb-2 text-sm sm:text-base inline-flex items-center gap-2">
              <span class="mdi mdi-flag-checkered"></span>
              Finalizar Seleção
            </h4>
            <p class="text-yellow-700 text-sm mb-4">
              Isso irá calcular as {{ selection.max_musicas }} músicas mais votadas e finalizar a seleção.
            </p>
            <button
              @click="finalizeSelection"
              :disabled="finalizing"
              class="px-4 py-2 sm:py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium touch-manipulation inline-flex items-center gap-2"
            >
              <span class="mdi mdi-trophy"></span>
              {{ finalizing ? 'Finalizando...' : 'Finalizar Seleção' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Resultados - Cards de Ranking -->
      <div v-if="activeTab === 'resultados' && results.length > 0">
        <div class="bg-white rounded-lg shadow">
          <div class="px-4 sm:px-6 py-4 border-b">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
              <span class="mdi mdi-trophy"></span>
              Músicas Selecionadas
            </h3>
          </div>
          
          <div class="divide-y divide-gray-200">
            <div
              v-for="result in results"
              :key="result.repertoire_item_id"
              class="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center gap-3 sm:gap-4">
                <!-- Posição -->
                <div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base"
                  :class="getResultPositionClass(result.posicao)"
                >
                  {{ result.posicao }}{{ getOrdinalSuffix(result.posicao) }}
                </div>
                
                <!-- Informações da música -->
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-gray-900 text-sm sm:text-base truncate">{{ result.musica_nome }}</div>
                  <div class="text-xs sm:text-sm text-gray-500 mt-1">
                    <span class="mdi mdi-account text-xs"></span>
                    {{ result.autor || '-' }}
                  </div>
                </div>
                
                <!-- Votos -->
                <div class="flex-shrink-0 text-right">
                  <div class="text-xs sm:text-sm text-gray-500">Votos</div>
                  <div class="text-lg sm:text-xl font-bold text-blue-600">{{ result.total_votos }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'resultados' && results.length === 0" class="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
        <span class="mdi mdi-trophy text-4xl text-gray-300 block mb-2"></span>
        Resultados ainda não disponíveis. A seleção precisa ser finalizada.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSelections } from '../composables/useSelections'
import { useRepertoire } from '../composables/useRepertoire'

const route = useRoute()
const auth = useAuth()
const user = auth.state.user
const { loadSelectionDetail, vote, removeVote, finalizeSelection: finalizeSelectionApi } = useSelections()
const { items: repertoireItems, loadRepertoire } = useRepertoire()

const selection = ref<any>(null)
const votes = ref<any[]>([])
const results = ref<any[]>([])
const selectedMusicId = ref<number | ''>('')
const activeTab = ref('votacao')
const loading = ref(true)
const voting = ref(false)
const voteError = ref('')
const finalizing = ref(false)

async function loadData() {
  loading.value = true

  try {
    const data = await loadSelectionDetail(Number(route.params.id))
    selection.value = data.selection
    votes.value = data.votes || []
    results.value = data.results || []

    if (user?.regional_id) {
      await loadRepertoire(user.regional_id)
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

async function handleVote() {
  voteError.value = ''
  voting.value = true

  try {
    await vote(selection.value.id, selectedMusicId.value as number, user?.id || 0)
    selectedMusicId.value = ''
    await loadData()
  } catch (err: any) {
    voteError.value = err.response?.data?.error || 'Erro ao votar'
  } finally {
    voting.value = false
  }
}

async function removeVoteWrapper(repertoireItemId: number) {
  try {
    await removeVote(selection.value.id, user?.id || 0, repertoireItemId)
    await loadData()
  } catch (error) {
    console.error('Erro ao remover voto:', error)
  }
}

async function finalizeSelection() {
  if (!confirm('Tem certeza que deseja finalizar esta seleção?')) return

  finalizing.value = true

  try {
    await finalizeSelectionApi(selection.value.id)
    await loadData()
    activeTab.value = 'resultados'
  } catch (error) {
    console.error('Erro ao finalizar:', error)
  } finally {
    finalizing.value = false
  }
}

// Classes para posição no ranking
function getResultPositionClass(posicao: number): string {
  if (posicao === 1) return 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
  if (posicao === 2) return 'bg-gray-100 text-gray-700 border-2 border-gray-400'
  if (posicao === 3) return 'bg-orange-100 text-orange-700 border-2 border-orange-400'
  return 'bg-gray-50 text-gray-600 border border-gray-200'
}

// Sufixo ordinal (1º, 2º, 3º)
function getOrdinalSuffix(posicao: number): string {
  const ultimo = posicao % 10
  if (ultimo === 1) return 'º'
  if (ultimo === 2) return 'ª'
  return 'º'
}

onMounted(loadData)
</script>
