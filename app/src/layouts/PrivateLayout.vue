<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-all duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:inset-0',
        sidebarCollapsed ? 'lg:w-0 lg:overflow-hidden' : 'lg:w-64'
      ]"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="flex items-center justify-between h-16 px-4 border-b flex-shrink-0">
          <div class="flex items-center gap-3">
            <img src="/favicon.ico" alt="Meu Regional" class="w-8 h-8" />
            <h1 class="text-xl font-bold text-gray-900 whitespace-nowrap">Meu Regional</h1>
          </div>
          <button
            @click="toggleSidebar"
            class="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="p-4 space-y-1 flex-1 overflow-y-auto">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors"
            :class="isActive(link.to)
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
          >
            <span :class="link.icon" class="w-5 h-5 flex-shrink-0"></span>
            <span class="whitespace-nowrap">{{ link.label }}</span>
          </router-link>
        </nav>

        <!-- Footer da sidebar -->
        <div class="p-4 border-t flex-shrink-0">
          <div class="text-xs text-gray-500 text-center">
            &copy; {{ new Date().getFullYear() }} Meu Regional
          </div>
        </div>
      </div>
    </aside>

    <!-- Overlay para mobile -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
    ></div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 flex-shrink-0">
        <div class="flex items-center gap-4">
          <button
            @click="toggleSidebar"
            class="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <img src="/favicon.ico" alt="Meu Regional" class="w-8 h-8" />
          <h1 class="text-lg font-semibold text-gray-900 hidden sm:block">Meu Regional</h1>
        </div>

        <div class="flex items-center gap-4">
          <span v-if="user" class="text-sm text-gray-600 hidden sm:block">
            {{ user.nome }} <span class="text-gray-400">({{ user.instrumento }})</span>
          </span>
          <button
            @click="handleLogout"
            class="text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-md hover:bg-red-50 font-medium"
          >
            Sair
          </button>
        </div>
      </header>

      <!-- Scrollable Content -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 relative">
        <router-view />

        <!-- Floating Action Button - Estudo -->
        <button
          @click="showStudyModal = true"
          class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all hover:scale-110 flex items-center justify-center z-50 touch-manipulation"
          aria-label="Registrar estudo"
        >
          <span class="mdi mdi-plus w-8 h-8"></span>
        </button>
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t px-4 py-3 flex-shrink-0">
        <div class="text-center text-sm text-gray-500">
          Meu Regional &copy; {{ new Date().getFullYear() }} - Todos os direitos reservados
        </div>
      </footer>
    </div>

    <!-- Modal de Registro de Estudo -->
    <StudyLogModal
      v-model="showStudyModal"
      @submit="handleLogStudy"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useStudyLogs } from '../composables/useStudyLogs'
import StudyLogModal from '../components/base/StudyLogModal.vue'

const router = useRouter()
const route = useRoute()
const { state, logout } = useAuth()
const { logStudy } = useStudyLogs()

const user = state.user
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const showStudyModal = ref(false)

async function handleLogStudy(data: {
  member_id: number
  repertoire_item_id: number
  tipo: 'individual' | 'grupo'
  duracao_minutos?: number
  notas?: string
  data?: string
  nivel_fluencia?: string
  introducao_aprendida?: boolean
  tercas_aprendidas?: boolean
  arranjo_6_cordas_aprendido?: boolean
  notas_pessoais?: string
}) {
  try {
    await logStudy(data)
    showStudyModal.value = false
  } catch (err: any) {
    console.error('Erro ao registrar estudo:', err)
    alert(err.response?.data?.error || 'Erro ao registrar estudo')
  }
}

function toggleSidebar() {
  if (window.innerWidth >= 1024) {
    sidebarCollapsed.value = !sidebarCollapsed.value
    sidebarOpen.value = false
  } else {
    sidebarOpen.value = !sidebarOpen.value
  }
}

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: 'mdi mdi-view-dashboard' },
  { to: '/repertoire', label: 'Repertório', icon: 'mdi mdi-music-box' },
  { to: '/selections', label: 'Seleções', icon: 'mdi mdi-playlist-play' },
  { to: '/study', label: 'Estudos', icon: 'mdi mdi-school' },
  { to: '/members', label: 'Membros', icon: 'mdi mdi-account-group' },
  { to: '/settings/spotify', label: 'Config. Spotify', icon: 'mdi mdi-cog' }
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}

async function handleLogout() {
  await logout()
  router.push('/login')
}
</script>
