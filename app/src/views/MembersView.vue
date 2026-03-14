<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Membros</h2>
      <button
        @click="showNewMemberModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
      >
        Novo Membro
      </button>
    </div>

    <!-- Lista de membros -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="member in members"
        :key="member.id"
        class="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center gap-3 sm:gap-4 mb-4">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-blue-600 text-lg sm:text-xl font-bold">
              {{ member.nome.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-semibold text-gray-900 text-sm sm:text-base truncate">{{ member.nome }}</h3>
            <p class="text-xs sm:text-sm text-gray-500">{{ member.instrumento }}</p>
          </div>
        </div>

        <div class="text-xs sm:text-sm text-gray-600 space-y-1">
          <div class="truncate">
            <span class="font-medium">Username:</span> {{ member.username }}
          </div>
          <div class="text-xs text-gray-400">
            Desde {{ formatDate(member.criado_em) }}
          </div>
        </div>
      </div>

      <div v-if="members.length === 0" class="col-span-full text-center py-12 text-gray-500">
        Nenhum membro cadastrado ainda.
      </div>
    </div>

    <!-- Modal de Novo Membro -->
    <BaseModal
      v-model="showNewMemberModal"
      title="Novo Membro"
      size="sm"
      @close="closeModal"
    >
      <form @submit.prevent="handleCreateMember" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Nome *</label>
          <input
            v-model="newMember.nome"
            type="text"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
            placeholder="Nome completo"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Username *</label>
          <input
            v-model="newMember.username"
            type="text"
            required
            autocomplete="username"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
            placeholder="username"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Senha *</label>
          <input
            v-model="newMember.password"
            type="password"
            required
            minlength="6"
            autocomplete="new-password"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Instrumento *</label>
          <input
            v-model="newMember.instrumento"
            type="text"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
            placeholder="Ex: Violão de 7 cordas"
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
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          @click="handleCreateMember"
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
import { useMembers } from '../composables/useMembers'
import BaseModal from '../components/base/BaseModal.vue'

const { state } = useAuth()
const { members, loadMembers, createMember } = useMembers()

const user = state.user

const showNewMemberModal = ref(false)
const loading = ref(false)
const createError = ref('')

const newMember = ref({
  nome: '',
  username: '',
  password: '',
  instrumento: ''
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function closeModal() {
  showNewMemberModal.value = false
  newMember.value = {
    nome: '',
    username: '',
    password: '',
    instrumento: ''
  }
  createError.value = ''
}

async function handleCreateMember() {
  createError.value = ''
  loading.value = true

  try {
    await createMember({
      ...newMember.value,
      regional_id: user?.regional_id || 0
    })
    closeModal()
  } catch (err: any) {
    createError.value = err.response?.data?.error || 'Erro ao criar membro'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (user?.regional_id) {
    loadMembers(user.regional_id)
  }
})
</script>
