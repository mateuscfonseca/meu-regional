<template>
  <BaseModal
    v-model="isOpen"
    title="Registrar Estudo"
    size="md"
    @close="handleClose"
  >
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

      <!-- Duração -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Duração (minutos)
        </label>
        <input
          v-model.number="form.duracao_minutos"
          type="number"
          min="1"
          class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
          placeholder="Ex: 30"
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
    </form>

    <template #footer>
      <button
        @click="handleClose"
        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="handleSubmit"
        :disabled="logging || !form.repertoire_item_id"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ logging ? 'Registrando...' : 'Registrar' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import { useRepertoireSuggestions, type RepertoireSuggestion } from '../../services/repertoireSuggestions'
import { useAuth } from '../../composables/useAuth'

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
    duracao_minutos?: number
    notas?: string
  }]
}>()

const { getSuggestions } = useRepertoireSuggestions()
const { state } = useAuth()

const form = ref({
  repertoire_item_id: 0 as number | null,
  tipo: 'individual' as 'individual' | 'grupo',
  duracao_minutos: undefined as number | undefined,
  notas: '',
})

const searchQuery = ref('')
const suggestions = ref<RepertoireSuggestion[]>([])
const showSuggestions = ref(false)
const searching = ref(false)
const logging = ref(false)

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
    repertoire_item_id: null,
    tipo: 'individual',
    duracao_minutos: undefined,
    notas: '',
  }
  searchQuery.value = ''
  suggestions.value = []
  showSuggestions.value = false
  logging.value = false
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
}

async function handleSubmit() {
  if (!form.value.repertoire_item_id || !state.user?.id) return

  logging.value = true

  try {
    emit('submit', {
      member_id: state.user.id,
      repertoire_item_id: form.value.repertoire_item_id,
      tipo: form.value.tipo,
      duracao_minutos: form.value.duracao_minutos,
      notas: form.value.notas,
    })
  } finally {
    logging.value = false
  }
}
</script>
