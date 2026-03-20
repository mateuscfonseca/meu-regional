<template>
  <BaseModal
    v-model="isOpen"
    title="Editar Data do Estudo"
    size="sm"
    @close="handleClose"
  >
    <div class="py-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Selecione a data:
      </label>
      <input
        v-model="selectedDate"
        type="date"
        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-3 border text-base"
      />

      <!-- Data selecionada -->
      <div v-if="selectedDate" class="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <span class="font-medium">Data formatada:</span>
        {{ formatDate(selectedDate) }}
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
        :disabled="!selectedDate || saving"
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
    data: string
  } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: { id: number; data: string }]
}>()

const isOpen = ref(props.modelValue)
const selectedDate = ref('')
const saving = ref(false)

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val && props.item) {
    // Converter data para formato YYYY-MM-DD
    const date = new Date(props.item.data)
    selectedDate.value = date.toISOString().split('T')[0]
  }
})

watch(() => props.item, (item) => {
  if (item && isOpen.value) {
    const date = new Date(item.data)
    selectedDate.value = date.toISOString().split('T')[0]
  }
}, { immediate: true })

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function handleClose() {
  isOpen.value = false
  emit('update:modelValue', false)
}

function handleSave() {
  if (!selectedDate.value || !props.item) return
  
  saving.value = true
  
  // Simular um pequeno delay para UX
  setTimeout(() => {
    emit('save', {
      id: props.item!.id,
      data: selectedDate.value
    })
    saving.value = false
    handleClose()
  }, 300)
}
</script>
