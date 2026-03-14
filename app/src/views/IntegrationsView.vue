<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Integrações</h1>
    </div>

    <!-- Abas -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-2">
        <button
          v-for="integration in integrations"
          :key="integration.id"
          @click="selectIntegration(integration)"
          :class="[
            activeIntegration === integration.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2'
          ]"
        >
          <span :class="integration.icon"></span>
          {{ integration.label }}
        </button>
      </nav>
    </div>

    <!-- Conteúdo da Integração -->
    <div>
      <component :is="currentComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsSpotifyView from './SettingsSpotifyView.vue'

interface Integration {
  id: string
  label: string
  icon: string
  component: any
  path: string
}

const route = useRoute()
const router = useRouter()

// Define as integrações disponíveis
const integrations: Integration[] = [
  {
    id: 'spotify',
    label: 'Spotify',
    icon: 'mdi mdi-spotify',
    component: SettingsSpotifyView,
    path: '/integrations/spotify'
  }
  // Futuras integrações:
  // {
  //   id: 'youtube',
  //   label: 'YouTube',
  //   icon: 'mdi mdi-youtube',
  //   component: YoutubeIntegrationView,
  //   path: '/integrations/youtube'
  // },
  // {
  //   id: 'tidal',
  //   label: 'Tidal',
  //   icon: 'mdi mdi-waveform',
  //   component: TidalIntegrationView,
  //   path: '/integrations/tidal'
  // }
]

// Determina a integração ativa baseada na rota
const activeIntegration = ref<string>('spotify')

const currentComponent = computed(() => {
  const integration = integrations.find(i => i.id === activeIntegration.value)
  return integration?.component || SettingsSpotifyView
})

// Atualiza quando a rota muda
watch(
  () => route.path,
  (newPath) => {
    const integrationId = newPath.split('/').pop() || 'spotify'
    activeIntegration.value = integrationId
  },
  { immediate: true }
)

function selectIntegration(integration: Integration) {
  activeIntegration.value = integration.id
  router.push(integration.path)
}
</script>
