<template>
  <BaseModal
    v-model="isOpen"
    title="Importar Lista de Músicas"
    size="md"
    @close="handleClose"
  >
    <div class="space-y-4">
      <!-- Instruções -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex gap-3">
          <span class="text-xl">💡</span>
          <div>
            <p class="text-sm text-blue-800 font-medium">
              Como importar
            </p>
            <p class="text-sm text-blue-700 mt-1">
              Cole uma lista de músicas (uma por linha). Formato: <code class="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">"Música - Autor"</code> ou apenas <code class="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">"Música"</code>
            </p>
          </div>
        </div>
      </div>

      <!-- Exemplo -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Exemplo:
        </p>
        <pre class="text-sm text-gray-600 font-mono whitespace-pre-wrap">Brasileirinho - Waldir Azevedo
Tico-Tico no Fubá - Zequinha de Abreu
Ou apenas o nome da música...</pre>
      </div>

      <!-- Área de texto -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Sua lista
        </label>
        <textarea
          v-model="importText"
          rows="10"
          class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3 border font-mono text-sm"
          placeholder="Cole sua lista aqui..."
          :disabled="loading"
        />
        <p class="text-xs text-gray-500 mt-2">
          {{ lineCount }} {{ lineCount === 1 ? 'música' : 'músicas' }} detectadas
        </p>
      </div>
    </div>

    <!-- Footer com ações -->
    <template #footer>
      <button
        @click="handleClose"
        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        :disabled="loading"
      >
        Cancelar
      </button>
      <button
        @click="handleSubmit"
        :disabled="loading || !importText.trim()"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ loading ? 'Importando...' : 'Importar' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [texto: string]
}>()

const importText = ref('')
const loading = ref(false)

const isOpen = ref(props.modelValue)

const lineCount = computed(() => {
  if (!importText.value.trim()) return 0
  return importText.value.split('\n').filter(line => line.trim()).length
})

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
  importText.value = ''
  loading.value = false
}

function handleClose() {
  isOpen.value = false
}

async function handleSubmit() {
  if (!importText.value.trim()) return

  loading.value = true

  try {
    emit('submit', importText.value)
  } finally {
    loading.value = false
  }
}
</script>
