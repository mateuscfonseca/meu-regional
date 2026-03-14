<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Seleções</h2>
      <button
        @click="showNewSelectionModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium touch-manipulation"
      >
        Nova Seleção
      </button>
    </div>

    <!-- Lista de seleções -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="selection in selections"
        :key="selection.id"
        class="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-2">
          <h3 class="text-base sm:text-lg font-semibold text-gray-900">{{ selection.nome }}</h3>
          <span
            class="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2"
            :class="selection.status === 'votacao'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'"
          >
            {{ selection.status === 'votacao' ? 'Em Votação' : 'Finalizada' }}
          </span>
        </div>

        <p v-if="selection.descricao" class="text-sm text-gray-600 mb-2 line-clamp-2">
          {{ selection.descricao }}
        </p>

        <div class="text-sm text-gray-500 mb-4 space-y-1">
          <div v-if="selection.data_evento" class="flex items-center gap-1">
            <span>📅</span> {{ formatDate(selection.data_evento) }}
          </div>
          <div>🎵 Máx: {{ selection.max_musicas }} músicas</div>
          <div class="text-xs text-gray-400">
            Criada por: {{ selection.criadora_nome || 'Desconhecido' }}
          </div>
        </div>

        <router-link
          :to="`/selections/${selection.id}`"
          class="block w-full text-center bg-blue-50 text-blue-600 py-2 rounded-md hover:bg-blue-100 text-sm font-medium touch-manipulation"
        >
          Ver Detalhes
        </router-link>
      </div>

      <div v-if="selections.length === 0" class="col-span-full text-center py-12 text-gray-500">
        Nenhuma seleção criada ainda.
      </div>
    </div>

    <!-- Modal de Nova Seleção -->
    <BaseModal
      v-model="showNewSelectionModal"
      title="Nova Seleção"
      size="md"
      @close="closeModal"
    >
      <form class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Nome *</label>
          <input
            v-model="newSelection.nome"
            type="text"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border text-sm"
            placeholder="Ex: Show Dia 15/03"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            v-model="newSelection.descricao"
            rows="2"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border text-sm"
            placeholder="Descrição da seleção"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Data do Evento</label>
          <input
            v-model="newSelection.data_evento"
            type="date"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Máximo de Músicas</label>
          <input
            v-model.number="newSelection.max_musicas"
            type="number"
            min="1"
            max="100"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border text-sm"
          />
        </div>

        <div v-if="createError" class="text-red-600 text-sm bg-red-50 py-2 px-3 rounded">
          {{ createError }}
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          @click="closeModal"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleCreateSelection"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {{ loading ? 'Criando...' : 'Criar' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useSelections } from '../composables/useSelections'
import BaseModal from '../components/base/BaseModal.vue'

const { state } = useAuth()
const { selections, loadSelections, createSelection } = useSelections()

const user = state.user

const showNewSelectionModal = ref(false)
const loading = ref(false)
const createError = ref('')

const newSelection = ref({
  nome: '',
  descricao: '',
  data_evento: '',
  max_musicas: 30
})

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

function closeModal() {
  showNewSelectionModal.value = false
  newSelection.value = {
    nome: '',
    descricao: '',
    data_evento: '',
    max_musicas: 30
  }
  createError.value = ''
}

async function handleCreateSelection() {
  createError.value = ''
  loading.value = true

  try {
    await createSelection({
      ...newSelection.value,
      regional_id: user?.regional_id,
      criada_por: user?.id
    })
    closeModal()
  } catch (err: any) {
    createError.value = err.response?.data?.error || 'Erro ao criar seleção'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (user?.regional_id) {
    loadSelections(user.regional_id)
  }
})
</script>
