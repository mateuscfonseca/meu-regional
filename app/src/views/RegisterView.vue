<template>
  <div class="w-full max-w-lg">
    <div class="bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8">
      <div class="text-center mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Criar Conta</h1>
        <p class="text-gray-600 mt-2 text-sm sm:text-base">Cadastre seu regional e comece a gerenciar</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4 sm:space-y-6">
        <!-- Dados do Regional -->
        <div class="border-b pb-4">
          <h2 class="text-base sm:text-lg font-semibold text-gray-800 mb-4">Dados do Regional</h2>

          <div class="space-y-4">
            <div>
              <label for="regionalNome" class="block text-sm font-medium text-gray-700">
                Nome do Regional *
              </label>
              <input
                id="regionalNome"
                v-model="form.regionalNome"
                type="text"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
                placeholder="Ex: Regional Choro Paulista"
              />
            </div>

            <div>
              <label for="regionalDescricao" class="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                id="regionalDescricao"
                v-model="form.regionalDescricao"
                rows="2"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 border text-base sm:text-sm"
                placeholder="Breve descrição do seu regional"
              />
            </div>
          </div>
        </div>

        <!-- Dados do Membro -->
        <div class="pt-2">
          <h2 class="text-base sm:text-lg font-semibold text-gray-800 mb-4">Seus Dados</h2>

          <div class="space-y-4">
            <div>
              <label for="membroNome" class="block text-sm font-medium text-gray-700">
                Seu Nome *
              </label>
              <input
                id="membroNome"
                v-model="form.membroNome"
                type="text"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">
                Username *
              </label>
              <input
                id="username"
                v-model="form.username"
                type="text"
                required
                autocomplete="username"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
                placeholder="seu-username"
              />
              <p class="mt-1 text-xs text-gray-500">Usado para login</p>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Senha *
              </label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                minlength="6"
                autocomplete="new-password"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
                placeholder="••••••••"
              />
              <p class="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label for="instrumento" class="block text-sm font-medium text-gray-700">
                Instrumento *
              </label>
              <input
                id="instrumento"
                v-model="form.instrumento"
                type="text"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
                placeholder="Ex: Violão de 7 cordas, Bandolim, Flauta..."
              />
            </div>
          </div>
        </div>

        <div v-if="error" class="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 touch-manipulation"
        >
          {{ loading ? 'Cadastrando...' : 'Criar Conta' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Já tem uma conta?
          <router-link to="/login" class="font-medium text-green-600 hover:text-green-500">
            Fazer login
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { register } = useAuth()

const form = ref({
  regionalNome: '',
  regionalDescricao: '',
  membroNome: '',
  username: '',
  password: '',
  instrumento: ''
})

const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true

  try {
    await register(form.value)
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Erro ao criar conta'
  } finally {
    loading.value = false
  }
}
</script>
