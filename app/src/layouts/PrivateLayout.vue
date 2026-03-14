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
            <component :is="link.icon" class="w-5 h-5 flex-shrink-0" />
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
          <img src="/favicon.ico" alt="Meu Regional" class="w-8 h-8 hidden sm:block" />
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

// Ícones SVG como componentes
const DashboardIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </svg>
  `
}

const RepertoireIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  `
}

const SelectionsIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
    </svg>
  `
}

const StudyIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
    </svg>
  `
}

const MembersIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  `
}

const SettingsIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  `
}

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/repertoire', label: 'Repertório', icon: RepertoireIcon },
  { to: '/selections', label: 'Seleções', icon: SelectionsIcon },
  { to: '/study', label: 'Estudos', icon: StudyIcon },
  { to: '/members', label: 'Membros', icon: MembersIcon },
  { to: '/settings/spotify', label: 'Config. Spotify', icon: SettingsIcon }
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}

async function handleLogout() {
  await logout()
  router.push('/login')
}
</script>
