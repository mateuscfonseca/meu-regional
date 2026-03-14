<template>
  <div class="w-full max-w-sm sm:max-w-md">
    <div class="bg-white rounded-lg shadow-xl p-6 sm:p-8">
      <div class="text-center mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Meu Regional</h1>
        <p class="text-gray-600 mt-2 text-sm sm:text-base">Gerencie o repertório da sua banda</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4 sm:space-y-6">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            autocomplete="username"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
            placeholder="seu-username"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 sm:py-3 border text-base sm:text-sm"
            placeholder="••••••••"
          />
        </div>

        <div v-if="error" class="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 touch-manipulation"
        >
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Não tem uma conta?
          <a
            v-if="!isRegistrationDisabled"
            href="/register"
            @click.prevent="goToRegister"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            Cadastre-se
          </a>
          <span v-else class="text-gray-400">Registro temporariamente desabilitado</span>
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
const { login, state } = useAuth()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// Verificar se registro está desabilitado (mesma variável do backend)
const isRegistrationDisabled = (import.meta as any).env?.VITE_DISABLE_REGISTRATION === 'true'

function goToRegister() {
  if (!isRegistrationDisabled) {
    router.push('/register')
  }
}

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    await login(username.value, password.value)
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}
</script>
