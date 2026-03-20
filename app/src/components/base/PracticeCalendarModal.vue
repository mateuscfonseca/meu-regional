<template>
  <BaseModal
    v-model="isOpen"
    title="Estudos do Dia"
    :subtitle="formattedDate"
    size="md"
    @close="handleClose"
  >
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="mdi mdi-loading mdi-spin text-3xl text-blue-600"></span>
    </div>

    <div v-else-if="practices.length === 0" class="text-center py-8">
      <span class="mdi mdi-calendar-remove text-5xl text-gray-300"></span>
      <p class="text-gray-500 mt-4">Nenhum ensaio registrado nesta data</p>
    </div>

    <div v-else class="space-y-3">
      <!-- Lista de músicas praticadas -->
      <div
        v-for="(practice, index) in practices"
        :key="practice.id"
        class="flex items-start gap-3 p-3 rounded-lg border"
        :class="practice.tipo === 'grupo' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'"
      >
        <!-- Ícone do tipo -->
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          :class="practice.tipo === 'grupo' ? 'bg-green-100' : 'bg-purple-100'"
        >
          <span
            class="mdi"
            :class="practice.tipo === 'grupo' ? 'mdi-account-group text-green-600' : 'mdi-account text-purple-600'"
          ></span>
        </div>

        <!-- Informações da música -->
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900 truncate">
            {{ practice.musica_nome }}
          </div>
          <div v-if="practice.autor" class="text-sm text-gray-500 truncate">
            {{ practice.autor }}
          </div>
          <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span class="flex items-center gap-1">
              <span class="mdi mdi-account"></span>
              {{ practice.membro_nome }}
            </span>
            <span v-if="practice.duracao_minutos" class="flex items-center gap-1">
              <span class="mdi mdi-clock"></span>
              {{ practice.duracao_minutos }} min
            </span>
          </div>
          <div v-if="practice.notas" class="text-sm text-gray-600 mt-2 italic">
            "{{ practice.notas }}"
          </div>
        </div>

        <!-- Badge do tipo -->
        <span
          class="px-2 py-1 text-xs font-medium rounded-full flex-shrink-0"
          :class="practice.tipo === 'grupo'
            ? 'bg-green-100 text-green-700'
            : 'bg-purple-100 text-purple-700'"
        >
          {{ practice.tipo === 'grupo' ? 'Grupo' : 'Individual' }}
        </span>
      </div>

      <!-- Total -->
      <div class="pt-3 border-t border-gray-200">
        <div class="text-sm text-gray-600">
          <span class="font-medium">{{ practices.length }}</span>
          {{ practices.length === 1 ? 'música praticada' : 'músicas praticadas' }}
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="handleClose"
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
      >
        Fechar
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { usePracticeCalendar } from '../../composables/usePracticeCalendar'

const props = defineProps<{
  modelValue: boolean
  memberId: number
  date: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { loadPracticesOnDate, formatDate } = usePracticeCalendar()

const isOpen = ref(props.modelValue)
const practices = ref<any[]>([])
const loading = ref(false)

const formattedDate = computed(() => {
  if (!props.date) return ''
  return formatDate(props.date)
})

watch(() => props.modelValue, async (val) => {
  isOpen.value = val
  if (val && props.date && props.memberId) {
    await loadPractices()
  }
})

watch(() => props.date, async (date) => {
  if (isOpen.value && date && props.memberId) {
    await loadPractices()
  }
})

async function loadPractices() {
  if (!props.date || !props.memberId) return

  loading.value = true
  try {
    practices.value = await loadPracticesOnDate(props.memberId, props.date)
  } catch (error) {
    console.error('Erro ao carregar práticas:', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  isOpen.value = false
  emit('update:modelValue', false)
}
</script>
