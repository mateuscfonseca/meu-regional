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
import { ref, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useRepertoireSuggestions, type RepertoireSuggestion } from '../../services/repertoireSuggestions'
import { useAuth } from '../../composables/useAuth'
import { useRepertoire } from '../../composables/useRepertoire'
import { useMemberRepertoire } from '../../composables/useMemberRepertoire'
import { memberRepertoireService } from '../../services/memberRepertoire'
import type { RepertoireItem } from '../../composables/useRepertoire'

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

let searchTimeout: ReturnType<typeof setTimeout> | null = null
const isOpen = ref(props.modelValue)

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
</script>
