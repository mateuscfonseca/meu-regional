<template>
  <BaseModal
    v-model="isOpen"
    :title="title"
    :subtitle="subtitle"
    size="md"
    @close="handleClose"
  >
    <!-- Indicador de progresso -->
    <div v-if="showProgress" class="mb-4 flex items-center justify-between text-sm">
      <span class="text-gray-500 inline-flex items-center gap-1">
        <span class="mdi mdi-music"></span>
        Música {{ currentIndex }} de {{ totalItems }}
      </span>
      <span class="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
        <span class="mdi mdi-progress-download"></span>
        Edição em sequência
      </span>
    </div>

    <!-- Busca do Spotify -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Buscar no Spotify
        </label>
        <div class="flex flex-col gap-2">
          <input
            v-model="spotifySearchQuery"
            @input="debouncedSearch"
            @focus="showSearchResults = true"
            type="text"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border"
            placeholder="Digite o nome da música..."
          />
          <button
            @click="searchSpotify"
            :disabled="searching"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors w-full"
          >
            <span v-if="searching" class="animate-pulse">
              <span class="mdi mdi-magnify"></span>
            </span>
            <span v-else>
              <span class="mdi mdi-magnify"></span>
            </span>
          </button>
        </div>

        <!-- Resultados da busca -->
        <div
          v-if="showSearchResults && (searching || spotifyResults.length > 0)"
          data-search-container
          class="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-hidden bg-white shadow-lg z-10"
        >
          <!-- Estado de Loading -->
          <div v-if="searching" class="p-4 text-center text-gray-500">
            <span class="mdi mdi-magnify animate-pulse inline-block mr-2"></span>
            Buscando no Spotify...
          </div>
          
          <!-- Resultados -->
          <div v-else class="max-h-48 overflow-y-auto">
            <div
              v-for="(result, idx) in spotifyResults"
              :key="idx"
              @click="selectSpotifyResult(result)"
              class="px-4 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div class="font-medium text-gray-900">{{ result.nome }}</div>
              <div class="text-sm text-gray-500">{{ result.autor }}</div>
            </div>
          </div>
          
          <!-- Botão Fechar -->
          <div class="border-t border-gray-200 p-2 flex justify-end">
            <button
              @click="closeSearchResults"
              class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="Fechar resultados"
            >
              <span class="mdi mdi-close text-lg"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Ou URL do Spotify -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Ou cole URL do Spotify
        </label>
        <div class="flex flex-col gap-2">
          <input
            v-model="spotifyUrl"
            type="url"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border"
            placeholder="https://open.spotify.com/track/..."
          />
          <button
            @click="fetchSpotifyMetadata"
            :disabled="fetchingUrl"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors w-full"
          >
            {{ fetchingUrl ? 'Extraindo...' : 'Preencher' }}
          </button>
        </div>
      </div>

      <!-- Separador -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Ou edite manualmente</span>
        </div>
      </div>

      <!-- Formulário manual -->
      <div class="space-y-6">
        <!-- SEÇÃO 1: Dados Gerais -->
        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 class="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <span class="mdi mdi-information text-blue-600"></span>
            Dados Gerais (todos os membros podem editar)
          </h4>
          
          <div class="grid gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Nome da Música <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.nome"
                type="text"
                required
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border"
                placeholder="Ex: Brasileirinho"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">
                Autor
              </label>
              <div class="relative">
                <input
                  v-model="form.autor"
                  @input="debouncedAuthorSearch"
                  @focus="showAuthorSuggestions = true"
                  @blur="hideAuthorSuggestions"
                  type="text"
                  class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border"
                  placeholder="Ex: Waldir Azevedo"
                />
                
                <!-- Sugestões de autores -->
                <div
                  v-if="showAuthorSuggestions && authorSuggestions.length > 0"
                  class="absolute z-20 w-full mt-1 border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg"
                >
                  <div
                    v-for="(suggestion, idx) in authorSuggestions"
                    :key="idx"
                    @click="selectAuthor(suggestion)"
                    class="px-4 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    {{ suggestion }}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">
                Links (opcional)
              </label>
              <input
                v-model="form.links"
                type="text"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border"
                placeholder="https://youtube.com/..., https://spotify.com/..."
              />
              <p class="text-xs text-gray-500 mt-1">
                Separe múltiplos links por vírgula
              </p>
            </div>
          </div>
        </div>

        <!-- SEÇÃO 2: Histórico de Estudos -->
        <div class="border border-gray-200 rounded-lg p-4 bg-purple-50">
          <h4 class="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <span class="mdi mdi-history text-purple-600"></span>
            Histórico de Estudos
          </h4>
          
          <div v-if="studyLogs.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="log in studyLogs"
              :key="log.id"
              class="flex items-start gap-3 p-2 bg-white rounded-lg border border-gray-200"
            >
              <span
                class="mdi w-5 h-5 flex-shrink-0 mt-0.5"
                :class="log.tipo === 'individual' ? 'mdi-account text-blue-600' : 'mdi-account-group text-green-600'"
              ></span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900">
                  {{ formatDate(log.data) }}
                  <span class="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    {{ log.tipo === 'individual' ? 'Individual' : 'Em Grupo' }}
                  </span>
                </div>
                <div class="text-sm text-gray-600">{{ log.membro_nome }}</div>
                <div v-if="log.notas" class="text-sm text-gray-500 mt-1 italic">
                  "{{ log.notas }}"
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-4">
            <span class="mdi mdi-history-off text-gray-400 text-3xl"></span>
            <p class="text-sm text-gray-500 mt-2">Nenhum estudo registrado para esta música</p>
          </div>
        </div>

        <!-- SEÇÃO 3: Caracterização da Música -->
        <div class="border border-gray-200 rounded-lg p-4 bg-blue-50">
          <h4 class="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <span class="mdi mdi-music text-blue-600"></span>
            Caracterização da Música (todos os membros podem editar)
          </h4>

          <!-- Tonalidade -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Tonalidade
            </label>
            <div class="grid grid-cols-2 gap-2">
              <select
                v-model="form.tonalidade"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
              >
                <option value="">Nota...</option>
                <option value="C">C (Dó)</option>
                <option value="Db">Db (Dó#)</option>
                <option value="D">D (Ré)</option>
                <option value="Eb">Eb (Mi♭)</option>
                <option value="E">E (Mi)</option>
                <option value="F">F (Fá)</option>
                <option value="Gb">Gb (Fá#)</option>
                <option value="G">G (Sol)</option>
                <option value="Ab">Ab (Lá♭)</option>
                <option value="A">A (Lá)</option>
                <option value="Bb">Bb (Si♭)</option>
                <option value="B">B (Si)</option>
              </select>
              
              <select
                v-model="form.tonalidade_modo"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
              >
                <option value="">Modo...</option>
                <option value="maior">Maior</option>
                <option value="menor">Menor</option>
              </select>
            </div>
            <p v-if="form.tonalidade && form.tonalidade_modo" class="text-xs text-gray-500 mt-1">
              Resultado: {{ form.tonalidade }} {{ form.tonalidade_modo }}
            </p>
          </div>

          <!-- Notas/Arranjo -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Notas / Detalhes de Arranjo
            </label>
            <textarea
              v-model="form.notas"
              rows="3"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
              placeholder="Digite detalhes de arranjo, observações..."
            ></textarea>
          </div>

          <!-- Características -->
          <div class="mb-4 space-y-3">
            <p class="text-sm font-medium text-gray-700">Características</p>

            <!-- Introdução -->
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2">
                <input
                  v-model="form.tem_introducao"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">Tem introdução</span>
              </label>
            </div>

            <!-- Terças -->
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2">
                <input
                  v-model="form.tem_tercas"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">Tem terças</span>
              </label>
            </div>

            <!-- Arranjo 6 cordas -->
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2">
                <input
                  v-model="form.tem_arranjo_6_cordas"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">Tem arranjo 6 cordas</span>
              </label>
            </div>
          </div>
        </div>

        <!-- SEÇÃO 4: Dados do Usuário Logado -->
        <div class="border border-gray-200 rounded-lg p-4 bg-green-50">
          <h4 class="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <span class="mdi mdi-account text-green-600"></span>
            Seus Dados de Prática (apenas você vê)
          </h4>

          <!-- Nível de Fluência -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nível de Fluência
            </label>
            <select
              v-model="form.nivel_fluencia"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border"
            >
              <option value="">Selecione...</option>
              <option value="precisa_aprender">Precisa Aprender</option>
              <option value="tirada">Tirada</option>
              <option value="tocando_bem">Tocando Bem</option>
              <option value="tirando_onda">Tirando Onda</option>
            </select>
          </div>

          <!-- Status de Aprendizado -->
          <div class="mb-4 space-y-3">
            <p class="text-sm font-medium text-gray-700">Seu Progresso</p>

            <!-- Introdução -->
            <div class="flex items-center gap-4">
              <label v-if="form.tem_introducao" class="flex items-center gap-2">
                <input
                  v-model="form.introducao_aprendida"
                  type="checkbox"
                  class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span class="text-sm text-green-700">Introdução aprendida</span>
              </label>
              <span v-else class="text-sm text-gray-400">Música não tem introdução</span>
            </div>

            <!-- Terças -->
            <div class="flex items-center gap-4">
              <label v-if="form.tem_tercas" class="flex items-center gap-2">
                <input
                  v-model="form.tercas_aprendidas"
                  type="checkbox"
                  class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span class="text-sm text-green-700">Terças aprendidas</span>
              </label>
              <span v-else class="text-sm text-gray-400">Música não tem terças</span>
            </div>

            <!-- Arranjo 6 cordas -->
            <div class="flex items-center gap-4">
              <label v-if="form.tem_arranjo_6_cordas" class="flex items-center gap-2">
                <input
                  v-model="form.arranjo_6_cordas_aprendido"
                  type="checkbox"
                  class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span class="text-sm text-green-700">Arranjo 6 cordas aprendido</span>
              </label>
              <span v-else class="text-sm text-gray-400">Música não tem arranjo 6 cordas</span>
            </div>
          </div>

          <!-- Notas Pessoais -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Suas Notas Pessoais
            </label>
            <textarea
              v-model="form.notas_pessoais"
              rows="3"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border"
              placeholder="Anote suas observações pessoais, dicas de estudo..."
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer com ações -->
    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-3 w-full">
        <!-- Navegação -->
        <div v-if="showProgress" class="flex gap-2 flex-shrink-0">
          <button
            type="button"
            @click="$emit('navigate-previous')"
            :disabled="!currentIndex || currentIndex <= 1"
            class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1"
          >
            <span class="mdi mdi-chevron-left"></span>
            <span class="hidden sm:inline">Anterior</span>
          </button>
          <button
            type="button"
            @click="$emit('navigate-next')"
            :disabled="!currentIndex || currentIndex >= totalItems"
            class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1"
          >
            <span class="hidden sm:inline">Próximo</span>
            <span class="mdi mdi-chevron-right"></span>
          </button>
        </div>

        <!-- Ações de salvar -->
        <div class="flex gap-2 flex-shrink-0">
          <button
            type="button"
            @click="handleSubmitAndClose"
            :disabled="loading || !form.nome"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="mdi mdi-loading mdi-spin"></span>
            <span v-else class="mdi mdi-content-save-check"></span>
            <span class="hidden sm:inline">{{ loading ? 'Salvando...' : 'Salvar e Fechar' }}</span>
            <span class="sm:hidden">Salvar</span>
          </button>
          <button
            @click="handleSubmitAndContinue"
            :disabled="loading || !form.nome"
            type="button"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="mdi mdi-loading mdi-spin"></span>
            <span v-else class="mdi mdi-content-save-move"></span>
            <span class="hidden sm:inline">{{ loading ? 'Salvando...' : 'Salvar e Continuar' }}</span>
            <span class="sm:hidden">Continuar</span>
          </button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useScraper, type ScrapedMetadata } from '../../services/scraper'
import { useStudyLogs, type StudyLog } from '../../composables/useStudyLogs'
import { useAuthors } from '../../services/authors'
import type { RepertoireItem } from '../../composables/useRepertoire'

interface Props {
  modelValue: boolean
  item?: RepertoireItem | null
  currentIndex?: number
  totalItems?: number
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  item: null,
  currentIndex: 0,
  totalItems: 0,
  showProgress: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: {
    id: number
    nome: string
    autor?: string
    links?: string[]
    // Dados gerais (caracterização)
    tonalidade?: string
    tonalidade_modo?: string
    notas?: string
    tem_introducao?: boolean
    tem_tercas?: boolean
    tem_arranjo_6_cordas?: boolean
    // Dados do usuário
    introducao_aprendida?: boolean
    tercas_aprendidas?: boolean
    arranjo_6_cordas_aprendido?: boolean
    nivel_fluencia?: string
    notas_pessoais?: string
  }]
  'submit-continue': [data: {
    id: number
    nome: string
    autor?: string
    links?: string[]
    // Dados gerais (caracterização)
    tonalidade?: string
    tonalidade_modo?: string
    notas?: string
    tem_introducao?: boolean
    tem_tercas?: boolean
    tem_arranjo_6_cordas?: boolean
    // Dados do usuário
    introducao_aprendida?: boolean
    tercas_aprendidas?: boolean
    arranjo_6_cordas_aprendido?: boolean
    nivel_fluencia?: string
    notas_pessoais?: string
  }]
  'navigate-previous': []
  'navigate-next': []
}>()

const { search: searchSpotifyApi, getMetadataByUrl } = useScraper()
const { findByRepertoire, formatDate } = useStudyLogs()
const { getSuggestions: getAuthorSuggestions } = useAuthors()

const studyLogs = ref<StudyLog[]>([])

const form = ref({
  nome: '',
  autor: '',
  links: '',
  // Campos de caracterização (gerais)
  tonalidade: '',
  tonalidade_modo: '',
  notas: '',
  tem_introducao: false,
  tem_tercas: false,
  tem_arranjo_6_cordas: false,
  // Campos do usuário
  introducao_aprendida: false,
  tercas_aprendidas: false,
  arranjo_6_cordas_aprendido: false,
  nivel_fluencia: '',
  notas_pessoais: '',
})

// Estados para autocomplete de autores
const authorSuggestions = ref<string[]>([])
const showAuthorSuggestions = ref(false)
const searchingAuthors = ref(false)
let authorSearchTimeout: ReturnType<typeof setTimeout> | null = null

const spotifySearchQuery = ref('')
const spotifyResults = ref<ScrapedMetadata[]>([])
const spotifyUrl = ref('')
const searching = ref(false)
const fetchingUrl = ref(false)
const showSearchResults = ref(false)
const loading = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null
const isOpen = ref(props.modelValue)

// Título dinâmico
const title = computed(() => {
  if (props.showProgress && props.currentIndex && props.totalItems) {
    return `Editar Música (${props.currentIndex}/${props.totalItems})`
  }
  return 'Editar Música'
})

// Subtítulo com nome e autor da música
const subtitle = computed(() => {
  if (!props.item?.nome) return ''
  return `${props.item.nome}${props.item.autor ? ` - ${props.item.autor}` : ''}`
})

watch(() => props.modelValue, (val) => {
  isOpen.value = val
})

watch(() => props.item, async (item) => {
  if (item) {
    form.value = {
      nome: item.nome,
      autor: item.autor || '',
      links: Array.isArray(item.links) ? item.links.join(', ') : (item.links || ''),
      tonalidade: item.tonalidade || '',
      tonalidade_modo: (item as any).tonalidade_modo || '',
      notas: item.notas || '',
      tem_introducao: Boolean(item.tem_introducao),
      tem_tercas: Boolean(item.tem_tercas),
      tem_arranjo_6_cordas: Boolean(item.tem_arranjo_6_cordas),
      introducao_aprendida: Boolean((item as any).member_data?.introducao_aprendida || false),
      tercas_aprendidas: Boolean((item as any).member_data?.tercas_aprendidas || false),
      arranjo_6_cordas_aprendido: Boolean((item as any).member_data?.arranjo_6_cordas_aprendido || false),
      nivel_fluencia: (item as any).member_data?.nivel_fluencia || '',
      notas_pessoais: (item as any).member_data?.notas_pessoais || '',
    }
    // Auto-preencher busca Spotify com o nome da música
    spotifySearchQuery.value = item.nome
    
    // Resetar autocompletes ao mudar de item
    clearAutocompletes()
    
    // Carregar histórico de estudos
    await loadStudyLogs(item.id)
  }
}, { immediate: true })

watch(isOpen, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    resetForm()
  }
})

function resetForm() {
  form.value = {
    nome: '',
    autor: '',
    links: '',
    tonalidade: '',
    tonalidade_modo: '',
    notas: '',
    tem_introducao: false,
    tem_tercas: false,
    tem_arranjo_6_cordas: false,
    introducao_aprendida: false,
    tercas_aprendidas: false,
    arranjo_6_cordas_aprendido: false,
    nivel_fluencia: '',
    notas_pessoais: '',
  }
  spotifySearchQuery.value = ''
  spotifyUrl.value = ''
  spotifyResults.value = []
  showSearchResults.value = false
  loading.value = false
  studyLogs.value = []
  authorSuggestions.value = []
  showAuthorSuggestions.value = false
}

function clearAutocompletes() {
  // Spotify
  spotifyResults.value = []
  showSearchResults.value = false
  
  // Autor
  authorSuggestions.value = []
  showAuthorSuggestions.value = false
}

async function loadStudyLogs(repertoireItemId: number) {
  try {
    studyLogs.value = await findByRepertoire(repertoireItemId)
  } catch (error: any) {
    console.error('Erro ao carregar histórico de estudos:', error)
    studyLogs.value = []
  }
}

function debouncedAuthorSearch() {
  if (authorSearchTimeout) clearTimeout(authorSearchTimeout)
  
  if (form.value.autor.length < 2) {
    authorSuggestions.value = []
    return
  }
  
  authorSearchTimeout = setTimeout(() => {
    searchAuthors()
  }, 300)
}

async function searchAuthors() {
  if (form.value.autor.length < 2) return
  
  searchingAuthors.value = true
  showAuthorSuggestions.value = true
  
  try {
    authorSuggestions.value = await getAuthorSuggestions(form.value.autor, 10)
  } catch (error: any) {
    console.error('Erro na busca de autores:', error)
  } finally {
    searchingAuthors.value = false
  }
}

function selectAuthor(author: string) {
  form.value.autor = author
  authorSuggestions.value = []
  showAuthorSuggestions.value = false
}

function hideAuthorSuggestions() {
  setTimeout(() => {
    showAuthorSuggestions.value = false
  }, 200)
}

function handleClose() {
  isOpen.value = false
}

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (spotifySearchQuery.value.length < 3) {
    spotifyResults.value = []
    return
  }

  searchTimeout = setTimeout(() => {
    searchSpotify()
  }, 500)
}

async function searchSpotify() {
  if (spotifySearchQuery.value.length < 3) return

  searching.value = true
  showSearchResults.value = true

  try {
    spotifyResults.value = await searchSpotifyApi(spotifySearchQuery.value)
  } catch (error: any) {
    console.error('Erro na busca:', error)
  } finally {
    searching.value = false
  }
}

function selectSpotifyResult(result: ScrapedMetadata) {
  form.value.nome = result.nome
  form.value.autor = result.autor
  spotifyResults.value = []
  spotifySearchQuery.value = result.nome
  showSearchResults.value = false
}

function closeSearchResults() {
  showSearchResults.value = false
}

async function fetchSpotifyMetadata() {
  if (!spotifyUrl.value) return

  fetchingUrl.value = true

  try {
    const metadata = await getMetadataByUrl(spotifyUrl.value)
    if (metadata) {
      form.value.nome = metadata.nome
      form.value.autor = metadata.autor
    }
  } catch (error: any) {
    console.error('Erro ao extrair metadata:', error)
  } finally {
    fetchingUrl.value = false
  }
}

function prepareData() {
  if (!form.value.nome || !props.item) return null

  const links = form.value.links
    ? form.value.links.split(',').map((l: string) => l.trim())
    : []

  return {
    id: props.item.id,
    nome: form.value.nome,
    autor: form.value.autor || undefined,
    links: links.length > 0 ? links : undefined,
    // Dados gerais (caracterização)
    tonalidade: form.value.tonalidade || undefined,
    tonalidade_modo: form.value.tonalidade_modo || undefined,
    notas: form.value.notas || undefined,
    tem_introducao: form.value.tem_introducao,
    tem_tercas: form.value.tem_tercas,
    tem_arranjo_6_cordas: form.value.tem_arranjo_6_cordas,
    // Dados do usuário
    introducao_aprendida: form.value.introducao_aprendida,
    tercas_aprendidas: form.value.tercas_aprendidas,
    arranjo_6_cordas_aprendido: form.value.arranjo_6_cordas_aprendido,
    nivel_fluencia: form.value.nivel_fluencia || undefined,
    notas_pessoais: form.value.notas_pessoais || undefined,
  }
}

// Salvar e continuar editando (default no Enter)
function handleSubmitAndContinue() {
  const data = prepareData()
  if (!data) return

  loading.value = true

  try {
    emit('submit-continue', data)
    clearAutocompletes()
  } finally {
    loading.value = false
  }
}

// Salvar e fechar o modal
function handleSubmitAndClose() {
  const data = prepareData()
  if (!data) return

  loading.value = true

  try {
    emit('submit', data)
    clearAutocompletes()
  } finally {
    loading.value = false
  }
}

// Suporte a atalhos de teclado
function handleKeydown(event: KeyboardEvent) {
  // Enter no input de texto = Salvar e Continuar (default)
  if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
    // Não intercepta se estiver em textarea ou se o modal não estiver aberto
    if (event.target instanceof HTMLTextAreaElement) return
    if (!isOpen.value) return

    event.preventDefault()
    handleSubmitAndContinue()
  }

  // Ctrl+Enter ou Cmd+Enter = Salvar e Fechar
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    if (!isOpen.value) return

    event.preventDefault()
    handleSubmitAndClose()
  }
}

// Registra listener de teclado quando modal está aberto
watch(isOpen, (val) => {
  if (val) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
}, { immediate: true })
</script>
