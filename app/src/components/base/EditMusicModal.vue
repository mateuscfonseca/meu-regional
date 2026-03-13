<template>
  <BaseModal
    v-model="isOpen"
    title="Editar Música"
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
          <span class="px-2 bg-white text-gray-500">Ou edite manualmente</span>
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
        {{ loading ? 'Salvando...' : 'Salvar' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import { useScraper, type ScrapedMetadata } from '../../services/scraper'
import type { RepertoireItem } from '../../composables/useRepertoire'

interface Props {
  modelValue: boolean
  item?: RepertoireItem | null
}

const props = withDefaults(defineProps<Props>(), {
  item: null,
})
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: { id: number; nome: string; autor?: string; links?: string[] }]
}>()

const { search: searchSpotifyApi, getMetadataByUrl } = useScraper()

const form = ref({
  nome: '',
  autor: '',
  links: '',
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
})

watch(() => props.item, (item) => {
  if (item) {
    form.value = {
      nome: item.nome,
      autor: item.autor || '',
      links: Array.isArray(item.links) ? item.links.join(', ') : (item.links || ''),
    }
  }
}, { immediate: true })

watch(isOpen, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    resetForm()
  }
})

function resetForm() {
  spotifySearchQuery.value = ''
  spotifyUrl.value = ''
  spotifyResults.value = []
  showSearchResults.value = false
  loading.value = false
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
  if (!form.value.nome || !props.item) return

  loading.value = true

  try {
    const links = form.value.links
      ? form.value.links.split(',').map((l: string) => l.trim())
      : []

    emit('submit', {
      id: props.item.id,
      nome: form.value.nome,
      autor: form.value.autor || undefined,
      links: links.length > 0 ? links : undefined,
    })
  } finally {
    loading.value = false
  }
}
</script>
