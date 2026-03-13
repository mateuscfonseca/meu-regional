<template>
  <BaseModal
    v-model="isOpen"
    title="Adicionar Música"
    size="md"
    @close="handleClose"
  >
    <!-- Busca do Spotify -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Buscar no Spotify
        </label>
        <div class="flex gap-2">
          <input
            v-model="spotifySearchQuery"
            @input="debouncedSearch"
            @focus="showSearchResults = true"
            type="text"
            class="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border"
            placeholder="Digite o nome da música..."
          />
          <button
            @click="searchSpotify"
            :disabled="searching"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <span v-if="searching" class="animate-pulse">🔍</span>
            <span v-else>🔍</span>
          </button>
        </div>

        <!-- Resultados da busca -->
        <div
          v-if="showSearchResults && spotifyResults.length > 0"
          data-search-container
          class="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-10"
        >
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
      </div>

      <!-- Ou URL do Spotify -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Ou cole URL do Spotify
        </label>
        <div class="flex gap-2">
          <input
            v-model="spotifyUrl"
            type="url"
            class="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border"
            placeholder="https://open.spotify.com/track/..."
          />
          <button
            @click="fetchSpotifyMetadata"
            :disabled="fetchingUrl"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
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
          <span class="px-2 bg-white text-gray-500">Ou preencha manualmente</span>
        </div>
      </div>

      <!-- Formulário manual -->
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
          <input
            v-model="form.autor"
            type="text"
            class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border"
            placeholder="Ex: Waldir Azevedo"
          />
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

        <!-- Campos de Prática -->
        <div class="border-t pt-4 mt-2">
          <h4 class="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <span class="mdi mdi-music text-blue-600"></span>
            Dados de Prática
          </h4>

          <!-- Tonalidade -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Tonalidade
            </label>
            <select
              v-model="form.tonalidade"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
            >
              <option value="">Selecione...</option>
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
              <label v-if="form.tem_introducao" class="flex items-center gap-2">
                <input
                  v-model="form.introducao_aprendida"
                  type="checkbox"
                  class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span class="text-sm text-green-700">Aprendida</span>
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
              <label v-if="form.tem_tercas" class="flex items-center gap-2">
                <input
                  v-model="form.tercas_aprendidas"
                  type="checkbox"
                  class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span class="text-sm text-green-700">Aprendidas</span>
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
              <label v-if="form.tem_arranjo_6_cordas" class="flex items-center gap-2">
                <input
                  v-model="form.arranjo_6_cordas_aprendido"
                  type="checkbox"
                  class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span class="text-sm text-green-700">Aprendido</span>
              </label>
            </div>
          </div>

          <!-- Nível de Fluência -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nível de Fluência
            </label>
            <select
              v-model="form.nivel_fluencia"
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
            >
              <option value="">Selecione...</option>
              <option value="precisa_aprender">Precisa Aprender</option>
              <option value="tirada">Tirada</option>
              <option value="tocando_bem">Tocando Bem</option>
              <option value="tirando_onda">Tirando Onda</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer com ações -->
    <template #footer>
      <button
        @click="handleClose"
        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="handleSubmit"
        :disabled="loading || !form.nome"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ loading ? 'Adicionando...' : 'Adicionar' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import { useScraper, type ScrapedMetadata } from '../../services/scraper'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: {
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
  }]
}>()

const { search: searchSpotifyApi, getMetadataByUrl } = useScraper()

const form = ref({
  nome: '',
  autor: '',
  links: '',
  // Campos de prática
  tonalidade: '',
  notas: '',
  tem_introducao: false,
  tem_tercas: false,
  tem_arranjo_6_cordas: false,
  introducao_aprendida: false,
  tercas_aprendidas: false,
  arranjo_6_cordas_aprendido: false,
  nivel_fluencia: '',
})

const spotifySearchQuery = ref('')
const spotifyResults = ref<ScrapedMetadata[]>([])
const spotifyUrl = ref('')
const searching = ref(false)
const fetchingUrl = ref(false)
const showSearchResults = ref(false)
const loading = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const isOpen = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (!val) {
    resetForm()
  }
})

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})

function resetForm() {
  form.value = {
    nome: '',
    autor: '',
    links: '',
    tonalidade: '',
    notas: '',
    tem_introducao: false,
    tem_tercas: false,
    tem_arranjo_6_cordas: false,
    introducao_aprendida: false,
    tercas_aprendidas: false,
    arranjo_6_cordas_aprendido: false,
    nivel_fluencia: '',
  }
  spotifySearchQuery.value = ''
  spotifyUrl.value = ''
  spotifyResults.value = []
  showSearchResults.value = false
  loading.value = false
}

function handleClose() {
  isOpen.value = false
  resetForm()
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

async function handleSubmit() {
  if (!form.value.nome) return

  loading.value = true

  try {
    const links = form.value.links
      ? form.value.links.split(',').map((l: string) => l.trim())
      : []

    emit('submit', {
      nome: form.value.nome,
      autor: form.value.autor || undefined,
      links: links.length > 0 ? links : undefined,
      tonalidade: form.value.tonalidade || undefined,
      notas: form.value.notas || undefined,
      tem_introducao: form.value.tem_introducao,
      tem_tercas: form.value.tem_tercas,
      tem_arranjo_6_cordas: form.value.tem_arranjo_6_cordas,
      introducao_aprendida: form.value.introducao_aprendida,
      tercas_aprendidas: form.value.tercas_aprendidas,
      arranjo_6_cordas_aprendido: form.value.arranjo_6_cordas_aprendido,
      nivel_fluencia: form.value.nivel_fluencia || undefined,
    })
  } finally {
    loading.value = false
  }
}
</script>
