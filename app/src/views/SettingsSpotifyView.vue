<template>
  <div class="space-y-6">
    <!-- Status -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Status do Serviço</h2>
        <button
          @click="loadStatus"
          :disabled="loadingStatus"
          class="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
        >
          <span :class="loadingStatus ? 'animate-spin' : ''" class="mdi mdi-refresh"></span>
          Atualizar
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex items-center gap-3">
          <div :class="status.scraperRunning ? 'bg-green-100' : 'bg-red-100'" class="w-3 h-3 rounded-full"></div>
          <span class="text-sm text-gray-700">
            Scraper: <strong :class="status.scraperRunning ? 'text-green-600' : 'text-red-600'">
              {{ status.scraperRunning ? 'Ativo' : 'Inativo' }}
            </strong>
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div :class="status.browserRunning ? 'bg-green-100' : 'bg-red-100'" class="w-3 h-3 rounded-full"></div>
          <span class="text-sm text-gray-700">
            Browser: <strong :class="status.browserRunning ? 'text-green-600' : 'text-red-600'">
              {{ status.browserRunning ? 'Ativo' : 'Inativo' }}
            </strong>
          </span>
        </div>
      </div>
      
      <div v-if="!status.scraperRunning || !status.browserRunning" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p class="text-sm text-yellow-800">
          <span class="mdi mdi-alert text-yellow-600"></span>
          O scraper não está disponível. Verifique se o container está rodando.
        </p>
      </div>
      
      <p class="text-sm text-gray-600 mt-4">
        ℹ️ O scraper do Spotify funciona sem autenticação, buscando informações diretamente das páginas públicas.
      </p>
    </div>

    <!-- Teste de Busca Completa -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">🔍 Teste de Busca Completa</h2>
      <p class="text-sm text-gray-600 mb-4">
        Busca músicas no Spotify e retorna informações completas (nome, artista, álbum, ano).
      </p>

      <div class="flex gap-3 mb-4">
        <input
          v-model="searchQuery"
          @keyup.enter="testSearch"
          type="text"
          placeholder="Artista ou música (ex: The Beatles)"
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
        />
        <button
          @click="testSearch"
          :disabled="testing || !status.scraperRunning"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2"
        >
          <span v-if="testing" class="mdi mdi-loading animate-spin"></span>
          <span v-else class="mdi mdi-magnify"></span>
          {{ testing ? 'Buscando...' : 'Buscar' }}
        </button>
      </div>

      <div v-if="searchError" class="text-red-600 text-sm bg-red-50 py-2 px-3 rounded mb-4">
        {{ searchError }}
      </div>
    </div>

    <!-- Teste de Sugestões -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">💡 Teste de Sugestões (Autocomplete)</h2>
      <p class="text-sm text-gray-600 mb-4">
        Busca sugestões parciais para autocomplete enquanto o usuário digita.
      </p>

      <div class="flex gap-3 mb-4">
        <input
          v-model="suggestionsQuery"
          @keyup.enter="testSuggestions"
          type="text"
          placeholder="Digite para buscar (ex: Yesterday)"
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
        />
        <select
          v-model="suggestionsLimit"
          class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
        >
          <option v-for="n in [3, 5, 7, 10]" :key="n" :value="n">{{ n }}</option>
        </select>
        <button
          @click="testSuggestions"
          :disabled="testing || !status.scraperRunning"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2"
        >
          <span v-if="testing" class="mdi mdi-loading animate-spin"></span>
          <span v-else class="mdi mdi-lightbulb"></span>
          {{ testing ? 'Buscando...' : 'Sugestões' }}
        </button>
      </div>

      <div v-if="suggestionsError" class="text-red-600 text-sm bg-red-50 py-2 px-3 rounded mb-4">
        {{ suggestionsError }}
      </div>
    </div>

    <!-- Resultados -->
    <div v-if="hasResults" class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Resultados</h2>
        
        <!-- Abas -->
        <div class="flex gap-2">
          <button
            @click="activeTab = 'search'"
            :class="activeTab === 'search' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            class="px-3 py-1.5 text-sm rounded-md font-medium transition-colors"
          >
            Busca Completa ({{ searchResults.length }})
          </button>
          <button
            @click="activeTab = 'suggestions'"
            :class="activeTab === 'suggestions' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            class="px-3 py-1.5 text-sm rounded-md font-medium transition-colors"
          >
            Sugestões ({{ suggestionsResults.length }})
          </button>
        </div>
      </div>

      <!-- Resultados da Busca Completa -->
      <div v-if="activeTab === 'search'" class="space-y-3">
        <div
          v-for="(item, idx) in searchResults"
          :key="idx"
          class="border rounded-md p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ item.nome }}</div>
              <div class="text-sm text-gray-600">{{ item.autor }}</div>
              <div v-if="item.album || item.ano" class="text-xs text-gray-400 mt-1">
                <span v-if="item.album">{{ item.album }}</span>
                <span v-if="item.album && item.ano"> • </span>
                <span v-if="item.ano">{{ item.ano }}</span>
              </div>
            </div>
            <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Track</span>
          </div>
        </div>
        
        <div v-if="searchResults.length === 0" class="text-center text-gray-500 py-8">
          <span class="mdi mdi-music-note-off text-4xl"></span>
          <p class="mt-2">Nenhum resultado encontrado</p>
        </div>
      </div>

      <!-- Resultados de Sugestões -->
      <div v-if="activeTab === 'suggestions'" class="space-y-3">
        <div
          v-for="(item, idx) in suggestionsResults"
          :key="idx"
          class="border rounded-md p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ item.nome }}</div>
              <div class="text-sm text-gray-600">{{ item.artista }}</div>
              <div v-if="item.album" class="text-xs text-gray-400 mt-1">{{ item.album }}</div>
            </div>
            <span class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Suggestion</span>
          </div>
        </div>
        
        <div v-if="suggestionsResults.length === 0" class="text-center text-gray-500 py-8">
          <span class="mdi mdi-lightbulb-off text-4xl"></span>
          <p class="mt-2">Nenhuma sugestão encontrada</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useScraper } from '../services/scraper'

const { health, search, searchSuggestions } = useScraper()

const loadingStatus = ref(false)
const testing = ref(false)
const searchError = ref('')
const suggestionsError = ref('')

const status = ref({
  scraperRunning: false,
  browserRunning: false
})

// Busca completa
const searchQuery = ref('')
const searchResults = ref<{ nome: string; autor: string; album?: string; ano?: string }[]>([])

// Sugestões
const suggestionsQuery = ref('')
const suggestionsLimit = ref(5)
const suggestionsResults = ref<{ nome: string; artista: string; album?: string }[]>([])

// Abas
const activeTab = ref<'search' | 'suggestions'>('search')

const hasResults = computed(() => {
  return searchResults.value.length > 0 || suggestionsResults.value.length > 0
})

async function loadStatus() {
  loadingStatus.value = true
  try {
    const response = await health()
    status.value = {
      scraperRunning: response.scraper.serviceRunning,
      browserRunning: response.scraper.browserRunning
    }
  } catch (error) {
    console.error('Erro ao carregar status:', error)
    status.value = {
      scraperRunning: false,
      browserRunning: false
    }
  } finally {
    loadingStatus.value = false
  }
}

async function testSearch() {
  if (!searchQuery.value.trim()) return

  testing.value = true
  searchError.value = ''
  searchResults.value = []

  try {
    const results = await search(searchQuery.value)
    searchResults.value = results
    
    if (results.length > 0) {
      activeTab.value = 'search'
    }
  } catch (error: any) {
    searchError.value = error.response?.data?.error || 'Não foi possível buscar no Spotify.'
  } finally {
    testing.value = false
  }
}

async function testSuggestions() {
  if (!suggestionsQuery.value.trim()) return

  testing.value = true
  suggestionsError.value = ''
  suggestionsResults.value = []

  try {
    const results = await searchSuggestions(suggestionsQuery.value, suggestionsLimit.value)
    suggestionsResults.value = results
    
    if (results.length > 0) {
      activeTab.value = 'suggestions'
    }
  } catch (error: any) {
    suggestionsError.value = error.response?.data?.error || 'Não foi possível buscar sugestões.'
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  loadStatus()
})
</script>
