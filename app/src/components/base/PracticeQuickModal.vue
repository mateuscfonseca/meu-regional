<template>
  <BaseModal
    v-model="isOpen"
    title="Registrar Prática"
    size="md"
    :show-close="true"
    :close-on-overlay="true"
    @close="handleClose"
  >
    <div class="space-y-4">
      <!-- Busca de Música -->
      <div>
        <label for="musica" class="block text-sm font-medium text-gray-700 mb-1">
          Música *
        </label>
        <div class="relative">
          <input
            id="musica"
            v-model="searchQuery"
            @input="onSearchInput"
            type="text"
            placeholder="Digite o nome da música..."
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border pr-10"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <span class="mdi mdi-magnify"></span>
          </span>
        </div>

        <!-- Sugestões -->
        <ul
          v-if="suggestions.length > 0 && showSuggestions"
          class="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          <li
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            @click="selectMusic(suggestion)"
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div class="font-medium text-gray-900">{{ suggestion.nome }}</div>
            <div class="text-sm text-gray-500">{{ suggestion.autor }}</div>
          </li>
        </ul>
      </div>

      <!-- Nível de Fluência -->
      <div>
        <label for="nivel" class="block text-sm font-medium text-gray-700 mb-1">
          Nível de Fluência *
        </label>
        <select
          id="nivel"
          v-model="form.nivel_fluencia"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
        >
          <option value="">Selecione...</option>
          <option value="precisa_aprender">Precisa Aprender</option>
          <option value="tirada">Tirada</option>
          <option value="tocando_bem">Tocando Bem</option>
          <option value="tirando_onda">Tirando Onda</option>
        </select>
      </div>

      <!-- Mensagens de erro/sucesso -->
      <div v-if="error" class="text-red-600 text-sm bg-red-50 py-2 px-3 rounded">
        {{ error }}
      </div>

      <div v-if="success" class="text-green-600 text-sm bg-green-50 py-2 px-3 rounded">
        {{ success }}
      </div>
    </div>

    <template #footer>
      <button
        @click="handleClose"
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
      >
        Cancelar
      </button>
      <button
        @click="handleSubmit"
        :disabled="loading || !selectedMusic || !form.nivel_fluencia"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
      >
        <span v-if="loading" class="mdi mdi-loading animate-spin"></span>
        <span v-else class="mdi mdi-check"></span>
        {{ loading ? 'Registrando...' : 'Registrar Prática' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import BaseModal from './BaseModal.vue'
import { useRepertoire } from '../../composables/useRepertoire'
import type { RepertoireItem } from '../../composables/useRepertoire'

interface Props {
  modelValue: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'practice-registered': []
}>()

const { list, recordPractice } = useRepertoire()

const isOpen = ref(props.modelValue)
const searchQuery = ref('')
const suggestions = ref<RepertoireItem[]>([])
const showSuggestions = ref(false)
const selectedMusic = ref<RepertoireItem | null>(null)
const form = ref({
  nivel_fluencia: '',
})
const loading = ref(false)
const error = ref('')
const success = ref('')

let searchTimeout: number | undefined

watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal
  if (newVal) {
    resetForm()
  }
})

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
})

function resetForm() {
  searchQuery.value = ''
  suggestions.value = []
  selectedMusic.value = null
  form.value = { nivel_fluencia: '' }
  error.value = ''
  success.value = ''
  showSuggestions.value = false
}

function onSearchInput() {
  window.clearTimeout(searchTimeout)
  
  if (searchQuery.value.length < 2) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }

  showSuggestions.value = true
  
  // Debounce de 300ms
  searchTimeout = window.setTimeout(async () => {
    await searchMusic()
  }, 300)
}

async function searchMusic() {
  try {
    // Buscar no repertório local
    const allItems = await list()
    const query = searchQuery.value.toLowerCase()
    
    suggestions.value = allItems.items.filter((item: RepertoireItem) => 
      item.nome.toLowerCase().includes(query) ||
      (item.autor && item.autor.toLowerCase().includes(query))
    ).slice(0, 10)
  } catch (err) {
    console.error('Erro ao buscar músicas:', err)
  }
}

function selectMusic(music: RepertoireItem) {
  selectedMusic.value = music
  searchQuery.value = `${music.nome} - ${music.autor || ''}`
  showSuggestions.value = false
}

async function handleSubmit() {
  if (!selectedMusic.value || !form.value.nivel_fluencia) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await recordPractice(selectedMusic.value.id, {
      nivel_fluencia: form.value.nivel_fluencia,
    })

    success.value = 'Prática registrada com sucesso!'
    
    setTimeout(() => {
      handleClose()
      emit('practice-registered')
    }, 1000)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Erro ao registrar prática'
  } finally {
    loading.value = false
  }
}

function handleClose() {
  isOpen.value = false
  resetForm()
}
</script>
