<template>
  <BaseModal
    v-model="isOpen"
    title="Registrar Estudo"
    size="lg"
    @close="handleClose"
  >
    <!-- Abas -->
    <div class="border-b border-gray-200 mb-4">
      <nav class="-mb-px flex gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors'
          ]"
        >
          <span class="mdi mr-2" :class="tab.icon"></span>
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Conteúdo das Abas -->
    <div v-if="activeTab === 'registro'">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Campo de Música com Autocomplete -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Música *
          </label>
          <div class="relative">
            <input
              v-model="searchQuery"
              @input="debouncedSearch"
              @focus="showSuggestions = true"
              @blur="hideSuggestions"
              type="text"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
              placeholder="Digite o nome da música..."
              required
            />
            <span class="mdi mdi-magnify absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></span>

            <!-- Sugestões -->
            <div
              v-if="showSuggestions && suggestions.length > 0"
              class="absolute z-10 w-full mt-1 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg"
            >
              <div
                v-for="(suggestion, idx) in suggestions"
                :key="suggestion.id"
                @click="selectSuggestion(suggestion)"
                class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div class="font-medium text-gray-900">{{ suggestion.nome }}</div>
                <div v-if="suggestion.autor" class="text-sm text-gray-500">{{ suggestion.autor }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tipo de Estudo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tipo *
          </label>
          <select
            v-model="form.tipo"
            required
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
          >
            <option value="individual">👤 Individual</option>
            <option value="grupo">👥 Em Grupo</option>
          </select>
        </div>

        <!-- Data do Estudo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Data do Estudo *
          </label>

          <!-- Seleção rápida -->
          <div class="flex gap-2 mb-2">
            <button
              type="button"
              @click="setDataHoje"
              :class="isDataHoje ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Hoje
            </button>
            <button
              type="button"
              @click="setDataOntem"
              :class="isDataOntem ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Ontem
            </button>
          </div>

          <!-- Input de data -->
          <input
            v-model="form.data"
            type="date"
            required
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
          />
        </div>

        <!-- Notas -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Notas
          </label>
          <textarea
            v-model="form.notas"
            rows="3"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
            placeholder="Observações sobre o estudo..."
          />
        </div>

        <!-- Separador -->
        <div class="relative my-4">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Seu Progresso</span>
          </div>
        </div>

        <!-- Nível de Fluência -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nível de Fluência
          </label>
          <select
            v-model="proficiencyForm.nivel_fluencia"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
          >
            <option value="">Selecione...</option>
            <option value="precisa_aprender">Precisa Aprender</option>
            <option value="tirada">Tirada</option>
            <option value="tocando_bem">Tocando Bem</option>
            <option value="tirando_onda">Tirando Onda</option>
          </select>
        </div>

        <!-- Status de Aprendizado -->
        <div v-if="selectedMusic" class="space-y-3">
          <p class="text-sm font-medium text-gray-700">Seu Progresso</p>

          <!-- Introdução -->
          <label v-if="selectedMusic.tem_introducao" class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="proficiencyForm.introducao_aprendida"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">Introdução aprendida</span>
          </label>

          <!-- Terças -->
          <label v-if="selectedMusic.tem_tercas" class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="proficiencyForm.tercas_aprendidas"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">Terças aprendidas</span>
          </label>

          <!-- Arranjo 6 cordas -->
          <label v-if="selectedMusic.tem_arranjo_6_cordas" class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="proficiencyForm.arranjo_6_cordas_aprendido"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">Arranjo 6 cordas aprendido</span>
          </label>
        </div>

        <!-- Notas Pessoais -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Suas Notas Pessoais
          </label>
          <textarea
            v-model="proficiencyForm.notas_pessoais"
            rows="2"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
            placeholder="Anote suas observações pessoais, dicas de estudo..."
          ></textarea>
        </div>
      </form>
    </div>

    <!-- Aba Sugestão -->
    <div v-if="activeTab === 'sugestao'">
      <div class="space-y-4">
        <!-- Botão de Sugestão -->
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-gray-600">
            <span class="mdi mdi-lightbulb-on-outline text-yellow-500 mr-2"></span>
            Receba sugestões de músicas para estudar
          </p>
          <button
            @click="handleSuggestMusic"
            :disabled="suggesting"
            class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <span class="mdi mdi-refresh mr-2" :class="{ 'mdi-spin': suggesting }"></span>
            {{ suggesting ? 'Sugerindo...' : 'Sugerir Música' }}
          </button>
        </div>

        <!-- Filtros (Accordion) -->
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <button
            @click="showFilters = !showFilters"
            class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span class="font-medium text-gray-700">
              <span class="mdi mdi-filter-variant mr-2"></span>
              Filtros de Sugestão
            </span>
            <span class="mdi" :class="showFilters ? 'mdi-chevron-up' : 'mdi-chevron-down'"></span>
          </button>

          <div v-show="showFilters" class="p-4 space-y-4 bg-white">
            <!-- Filtros de Nível -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-2">
                Nível de Fluência
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="nivel in niveisFluencia"
                  :key="nivel.value"
                  @click="toggleNivelFilter(nivel.value)"
                  :class="suggestionFilters.nivel_fluencia?.includes(nivel.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {{ nivel.label }}
                </button>
              </div>
            </div>

            <!-- Filtros Temporais -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-2">
                Não praticadas há (dias)
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="days in [1, 2, 5, 7, 14]"
                  :key="days"
                  @click="toggleDaysFilter(days)"
                  :class="suggestionFilters.nao_praticadas_ha === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {{ days }} dias
                </button>
                <button
                  @click="clearDaysFilter"
                  :class="suggestionFilters.nao_praticadas_ha === undefined
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Todos
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
                    :class="suggestionFilters.tem_introducao === true
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    Tem
                  </button>
                  <button
                    @click="toggleBooleanFilter('introducao_aprendida', true)"
                    :class="suggestionFilters.introducao_aprendida === true
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
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
                    :class="suggestionFilters.tem_tercas === true
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    Tem
                  </button>
                  <button
                    @click="toggleBooleanFilter('tercas_aprendidas', true)"
                    :class="suggestionFilters.tercas_aprendidas === true
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
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
                    :class="suggestionFilters.tem_arranjo_6_cordas === true
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    Tem
                  </button>
                  <button
                    @click="toggleBooleanFilter('arranjo_6_cordas_aprendido', true)"
                    :class="suggestionFilters.arranjo_6_cordas_aprendido === true
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    Aprendido
                  </button>
                </div>
              </div>
            </div>

            <!-- Botão Limpar Filtros -->
            <div class="flex justify-end pt-2">
              <button
                @click="clearSuggestionFilters"
                class="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <span class="mdi mdi-refresh mr-1"></span>
                Limpar filtros
              </button>
            </div>
          </div>
        </div>

        <!-- Resultado da Sugestão -->
        <div v-if="suggestionError" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-700 text-sm">
            <span class="mdi mdi-alert-circle mr-2"></span>
            {{ suggestionError }}
          </p>
        </div>

        <div v-if="currentSuggestion" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0 flex-1">
              <h3 class="font-bold text-gray-900 text-lg">{{ currentSuggestion.nome }}</h3>
              <p v-if="currentSuggestion.autor" class="text-sm text-gray-600 mt-1">
                <span class="mdi mdi-account mr-1"></span>
                {{ currentSuggestion.autor }}
              </p>
            </div>
            <span class="mdi mdi-music text-blue-600 w-8 h-8 flex-shrink-0"></span>
          </div>

          <!-- Badges -->
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              :class="getNivelFluenciaClass(currentSuggestion.member_data?.nivel_fluencia || 'precisa_aprender')"
              class="px-3 py-1 rounded-full text-xs font-medium"
            >
              {{ getNivelFluenciaLabel(currentSuggestion.member_data?.nivel_fluencia || 'precisa_aprender') }}
            </span>
            <span
              v-if="currentSuggestion.tonalidade"
              class="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium"
            >
              {{ currentSuggestion.tonalidade }}
            </span>
          </div>

          <!-- Características -->
          <div class="space-y-2 mb-4">
            <div v-if="currentSuggestion.tem_introducao" class="flex items-center gap-2 text-sm">
              <span :class="currentSuggestion.member_data?.introducao_aprendida ? 'text-green-600' : 'text-gray-600'">
                <span class="mdi" :class="currentSuggestion.member_data?.introducao_aprendida ? 'mdi-check-circle' : 'mdi-music-note'"></span>
                Introdução {{ currentSuggestion.member_data?.introducao_aprendida ? 'aprendida ✓' : '' }}
              </span>
            </div>
            <div v-if="currentSuggestion.tem_tercas" class="flex items-center gap-2 text-sm">
              <span :class="currentSuggestion.member_data?.tercas_aprendidas ? 'text-green-600' : 'text-gray-600'">
                <span class="mdi" :class="currentSuggestion.member_data?.tercas_aprendidas ? 'mdi-check-circle' : 'mdi-music-note'"></span>
                Terças {{ currentSuggestion.member_data?.tercas_aprendidas ? 'aprendidas ✓' : '' }}
              </span>
            </div>
            <div v-if="currentSuggestion.tem_arranjo_6_cordas" class="flex items-center gap-2 text-sm">
              <span :class="currentSuggestion.member_data?.arranjo_6_cordas_aprendido ? 'text-green-600' : 'text-gray-600'">
                <span class="mdi" :class="currentSuggestion.member_data?.arranjo_6_cordas_aprendido ? 'mdi-check-circle' : 'mdi-music-note'"></span>
                6 cordas {{ currentSuggestion.member_data?.arranjo_6_cordas_aprendido ? 'aprendido ✓' : '' }}
              </span>
            </div>
          </div>

          <!-- Última prática -->
          <div v-if="currentSuggestion.member_data?.ultima_pratica" class="text-xs text-gray-500 mb-4">
            <span class="mdi mdi-calendar mr-1"></span>
            Praticada em {{ formatDate(currentSuggestion.member_data.ultima_pratica) }}
          </div>

          <!-- Ações -->
          <div class="flex gap-2">
            <button
              @click="useSuggestion"
              class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span class="mdi mdi-check mr-2"></span>
              Estudar esta música
            </button>
            <button
              @click="handleSuggestMusic(true)"
              :disabled="suggesting"
              class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              <span class="mdi mdi-refresh mr-2"></span>
              Outra
            </button>
          </div>
        </div>

        <!-- Estado vazio -->
        <div v-if="!currentSuggestion && !suggestionError && !suggesting" class="text-center py-12">
          <span class="mdi mdi-music-box text-6xl text-gray-300 mb-4 block"></span>
          <p class="text-gray-500 font-medium">Clique em "Sugerir Música" para receber uma sugestão</p>
          <p class="text-gray-400 text-sm mt-2">Use filtros para personalizar sua sugestão</p>
        </div>

        <!-- Loading -->
        <div v-if="suggesting && !currentSuggestion" class="flex flex-col items-center justify-center py-12">
          <span class="mdi mdi-loading mdi-spin text-5xl text-blue-600 mb-4"></span>
          <span class="text-gray-600 font-medium">Gerando sugestão...</span>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="handleClose"
        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        v-if="activeTab === 'registro'"
        @click="handleSubmit"
        :disabled="logging || !form.repertoire_item_id"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ logging ? 'Registrando...' : 'Registrar' }}
      </button>
      <button
        v-if="activeTab === 'sugestao'"
        @click="handleSuggestMusic"
        :disabled="suggesting"
        class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ suggesting ? 'Sugerindo...' : 'Sugerir Música' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useRepertoireSuggestions, type RepertoireSuggestion } from '../../services/repertoireSuggestions'
import { useAuth } from '../../composables/useAuth'
import { useRepertoire, type RepertoireItem } from '../../composables/useRepertoire'
import { useMemberRepertoire } from '../../composables/useMemberRepertoire'
import { useMusicSuggestion, type SuggestionFilters } from '../../composables/useMusicSuggestion'
import { memberRepertoireService } from '../../services/memberRepertoire'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: {
    member_id: number
    repertoire_item_id: number
    tipo: 'individual' | 'grupo'
    data: string
    notas?: string
    // Campos de proficiência
    nivel_fluencia?: string
    introducao_aprendida?: boolean
    tercas_aprendidas?: boolean
    arranjo_6_cordas_aprendido?: boolean
    notas_pessoais?: string
  }]
}>()

const { getSuggestions } = useRepertoireSuggestions()
const { getMusicById } = useRepertoire()
const { updatePracticeFields } = useMemberRepertoire()
const { state } = useAuth()
const { suggestMusic, currentSuggestion, loading: suggesting, error: suggestionError, reset: resetSuggestion } = useMusicSuggestion()

// Abas
const tabs = [
  { id: 'registro', label: 'Registro', icon: 'mdi-pencil' },
  { id: 'sugestao', label: 'Sugestão', icon: 'mdi-lightbulb-on' },
]
const activeTab = ref<'registro' | 'sugestao'>('registro')

const form = ref({
  repertoire_item_id: 0 as number | null,
  tipo: 'individual' as 'individual' | 'grupo',
  data: new Date().toISOString().split('T')[0],
  notas: '',
})

const proficiencyForm = ref({
  nivel_fluencia: '',
  introducao_aprendida: false,
  tercas_aprendidas: false,
  arranjo_6_cordas_aprendido: false,
  notas_pessoais: '',
})

const selectedMusic = ref<RepertoireItem | null>(null)

const searchQuery = ref('')
const suggestions = ref<RepertoireSuggestion[]>([])
const showSuggestions = ref(false)
const searching = ref(false)
const logging = ref(false)

// Filtros de sugestão
const showFilters = ref(false)
const suggestionFilters = ref<SuggestionFilters>({
  nivel_fluencia: [],
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null
const isOpen = ref(props.modelValue)

const niveisFluencia = [
  { value: 'precisa_aprender', label: 'Precisa Aprender' },
  { value: 'tirada', label: 'Tirada' },
  { value: 'tocando_bem', label: 'Tocando Bem' },
  { value: 'tirando_onda', label: 'Tirando Onda' },
]

// Propriedades computadas para verificar se a data é hoje ou ontem
const isDataHoje = computed(() => {
  const hoje = new Date().toISOString().split('T')[0]
  return form.value.data === hoje
})

const isDataOntem = computed(() => {
  const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  return form.value.data === ontem
})

function setDataHoje() {
  form.value.data = new Date().toISOString().split('T')[0]
}

function setDataOntem() {
  form.value.data = new Date(Date.now() - 86400000).toISOString().split('T')[0]
}

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (!val) {
    resetForm()
  }
})

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})

// Watch para mudar de aba quando uma sugestão for selecionada
watch(currentSuggestion, (newSuggestion) => {
  if (newSuggestion) {
    // Carregar dados completos da música sugerida
    loadMusicAndProficiency(newSuggestion.id)
  }
})

function resetForm() {
  form.value = {
    repertoire_item_id: null,
    tipo: 'individual',
    data: new Date().toISOString().split('T')[0],
    notas: '',
  }
  proficiencyForm.value = {
    nivel_fluencia: '',
    introducao_aprendida: false,
    tercas_aprendidas: false,
    arranjo_6_cordas_aprendido: false,
    notas_pessoais: '',
  }
  selectedMusic.value = null
  searchQuery.value = ''
  suggestions.value = []
  showSuggestions.value = false
  logging.value = false
  activeTab.value = 'registro'
  resetSuggestion()
  clearSuggestionFilters()
}

function handleClose() {
  isOpen.value = false
  resetForm()
}

function hideSuggestions() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (searchQuery.value.length < 2) {
    suggestions.value = []
    return
  }

  searchTimeout = setTimeout(() => {
    searchRepertoire()
  }, 300)
}

async function searchRepertoire() {
  if (searchQuery.value.length < 2 || !state.user?.regional_id) return

  searching.value = true
  showSuggestions.value = true

  try {
    suggestions.value = await getSuggestions(
      searchQuery.value,
      10,
      state.user.regional_id
    )
  } catch (error: any) {
    console.error('Erro na busca:', error)
  } finally {
    searching.value = false
  }
}

function selectSuggestion(suggestion: RepertoireSuggestion) {
  form.value.repertoire_item_id = suggestion.id
  searchQuery.value = suggestion.label
  suggestions.value = []
  showSuggestions.value = false

  // Carregar dados da música e de proficiência
  loadMusicAndProficiency(suggestion.id)
}

async function loadMusicAndProficiency(repertoireItemId: number) {
  if (!state.user?.regional_id) return

  // Carregar detalhes da música
  try {
    const music = await getMusicById(repertoireItemId)
    if (music) {
      selectedMusic.value = music
    }
  } catch (error: any) {
    console.error('Erro ao carregar música:', error)
  }

  // Carregar dados de proficiência do usuário
  if (state.user?.id) {
    try {
      const data = await memberRepertoireService.getByItem(state.user.id, repertoireItemId)
      if (data) {
        proficiencyForm.value = {
          nivel_fluencia: data.nivel_fluencia || '',
          introducao_aprendida: data.introducao_aprendida,
          tercas_aprendidas: data.tercas_aprendidas,
          arranjo_6_cordas_aprendido: data.arranjo_6_cordas_aprendido,
          notas_pessoais: data.notas_pessoais || '',
        }
      } else {
        // Resetar formulário se não houver dados
        resetProficiencyForm()
      }
    } catch (error: any) {
      console.error('Erro ao carregar proficiência:', error)
      resetProficiencyForm()
    }
  }
}

function resetProficiencyForm() {
  proficiencyForm.value = {
    nivel_fluencia: '',
    introducao_aprendida: false,
    tercas_aprendidas: false,
    arranjo_6_cordas_aprendido: false,
    notas_pessoais: '',
  }
}

// Handlers de sugestão
function toggleDaysFilter(days: number) {
  if (suggestionFilters.value.nao_praticadas_ha === days) {
    suggestionFilters.value.nao_praticadas_ha = undefined
  } else {
    suggestionFilters.value.nao_praticadas_ha = days
  }
}

function clearDaysFilter() {
  suggestionFilters.value.nao_praticadas_ha = undefined
}

function toggleNivelFilter(nivel: string) {
  const index = suggestionFilters.value.nivel_fluencia?.indexOf(nivel) || -1
  if (index > -1) {
    suggestionFilters.value.nivel_fluencia?.splice(index, 1)
  } else {
    if (!suggestionFilters.value.nivel_fluencia) {
      suggestionFilters.value.nivel_fluencia = []
    }
    suggestionFilters.value.nivel_fluencia.push(nivel)
  }
}

function toggleBooleanFilter(field: keyof SuggestionFilters, value: boolean) {
  const currentValue = suggestionFilters.value[field]
  suggestionFilters.value[field] = currentValue === value ? undefined : value
}

function clearSuggestionFilters() {
  suggestionFilters.value = {
    nivel_fluencia: [],
  }
}

async function handleSuggestMusic(forceNew: boolean = false) {
  if (!state.user?.regional_id) return

  try {
    const result = await suggestMusic(suggestionFilters.value, forceNew)
    if (result) {
      // Mudar para a aba de registro automaticamente
      // activeTab.value = 'registro'
    }
  } catch (error: any) {
    console.error('Erro ao sugerir música:', error)
  }
}

function useSuggestion() {
  if (currentSuggestion.value) {
    form.value.repertoire_item_id = currentSuggestion.value.id
    searchQuery.value = `${currentSuggestion.value.nome}${currentSuggestion.value.autor ? ` - ${currentSuggestion.value.autor}` : ''}`
    activeTab.value = 'registro'
  }
}

async function handleSubmit() {
  if (!form.value.repertoire_item_id || !state.user?.id) return

  logging.value = true

  try {
    // 1. Registrar estudo
    emit('submit', {
      member_id: state.user.id,
      repertoire_item_id: form.value.repertoire_item_id,
      tipo: form.value.tipo,
      data: form.value.data,
      notas: form.value.notas,
      // Campos de proficiência
      nivel_fluencia: proficiencyForm.value.nivel_fluencia || undefined,
      introducao_aprendida: proficiencyForm.value.introducao_aprendida,
      tercas_aprendidas: proficiencyForm.value.tercas_aprendidas,
      arranjo_6_cordas_aprendido: proficiencyForm.value.arranjo_6_cordas_aprendido,
      notas_pessoais: proficiencyForm.value.notas_pessoais || undefined,
    })

    // 2. Atualizar proficiência (se houver música selecionada)
    if (form.value.repertoire_item_id && proficiencyForm.value.nivel_fluencia) {
      try {
        await updatePracticeFields(form.value.repertoire_item_id, {
          nivel_fluencia: proficiencyForm.value.nivel_fluencia || undefined,
          introducao_aprendida: proficiencyForm.value.introducao_aprendida,
          tercas_aprendidas: proficiencyForm.value.tercas_aprendidas,
          arranjo_6_cordas_aprendido: proficiencyForm.value.arranjo_6_cordas_aprendido,
          notas_pessoais: proficiencyForm.value.notas_pessoais || undefined,
        })
      } catch (error: any) {
        console.error('Erro ao atualizar proficiência:', error)
        // Não falha o registro do estudo se a proficiência falhar
      }
    }
  } finally {
    logging.value = false
  }
}

// Helpers de UI
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
</script>
