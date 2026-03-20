<template>
  <BaseModal
    v-model="isOpen"
    title="Editar Nível de Fluência"
    size="sm"
    @close="handleClose"
  >
    <div class="py-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Selecione o nível de fluência:
      </label>
      <select
        v-model="selectedLevel"
        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-3 border text-base"
      >
        <option value="">Selecione...</option>
        <option value="precisa_aprender">Precisa Aprender</option>
        <option value="tirada">Tirada</option>
        <option value="tocando_bem">Tocando Bem</option>
        <option value="tirando_onda">Tirando Onda</option>
      </select>

      <!-- Descrição do nível selecionado -->
      <div v-if="selectedLevel" class="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <span class="font-medium">{{ getLevelLabel(selectedLevel) }}:</span>
        {{ getLevelDescription(selectedLevel) }}
      </div>
    </div>

    <template #footer>
      <button
        @click="handleClose"
        class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
      >
        Cancelar
      </button>
      <button
        @click="handleSave"
        :disabled="!selectedLevel || saving"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center gap-2"
      >
        <span v-if="saving" class="mdi mdi-loading mdi-spin"></span>
        <span v-else class="mdi mdi-content-save"></span>
        {{ saving ? 'Salvando...' : 'Salvar' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'

const props = defineProps<{
  modelValue: boolean
  item: {
    id: number
    member_data?: {
      nivel_fluencia?: string
    }
  } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: { id: number; nivel_fluencia: string }]
}>()

const isOpen = ref(props.modelValue)
const selectedLevel = ref('')
const saving = ref(false)

const levelDescriptions: Record<string, string> = {
  precisa_aprender: 'Música que você ainda não conhece ou está começando a estudar',
  tirada: 'Música já aprendida, mas ainda precisa de prática para ganhar fluência',
  tocando_bem: 'Música que você já domina e toca com segurança',
  tirando_onda: 'Música que você toca com total liberdade e expressão'
}

function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    precisa_aprender: 'Precisa Aprender',
    tirada: 'Tirada',
    tocando_bem: 'Tocando Bem',
    tirando_onda: 'Tirando Onda'
  }
  return labels[level] || level
}

function getLevelDescription(level: string): string {
  return levelDescriptions[level] || ''
}

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val && props.item?.member_data?.nivel_fluencia) {
    selectedLevel.value = props.item.member_data.nivel_fluencia
  } else if (val) {
    selectedLevel.value = ''
  }
})

watch(() => props.item, (item) => {
  if (isOpen.value && item?.member_data?.nivel_fluencia) {
    selectedLevel.value = item.member_data.nivel_fluencia
  }
}, { immediate: true })

function handleClose() {
  isOpen.value = false
  emit('update:modelValue', false)
}

async function handleSave() {
  if (!props.item || !selectedLevel.value) return

  saving.value = true
  try {
    emit('save', {
      id: props.item.id,
      nivel_fluencia: selectedLevel.value
    })
    handleClose()
  } finally {
    saving.value = false
  }
}
</script>
