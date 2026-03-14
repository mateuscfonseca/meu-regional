<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
        @click="handleOverlayClick"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-8 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-4 scale-95"
        >
          <div
            v-show="modelValue"
            class="relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            :class="[
              sizeClasses[size],
              fullscreenOnMobile ? 'sm:max-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]' : 'max-h-[calc(100vh-2rem)]',
              fullscreenOnMobile ? 'sm:rounded-2xl rounded-0 sm:mx-0 mx-[-1rem] sm:my-0 my-[-1rem]' : ''
            ]"
            @click.stop
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
          >
            <!-- Header -->
            <div
              v-if="$slots.header || title || showClose"
              class="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white"
            >
              <slot name="header">
                <div>
                  <h2
                    v-if="title"
                    :id="titleId"
                    class="text-xl font-bold text-gray-900"
                  >
                    {{ title }}
                  </h2>
                  <p
                    v-if="subtitle"
                    class="text-sm text-gray-500 mt-1 font-medium"
                  >
                    {{ subtitle }}
                  </p>
                </div>
              </slot>
              <button
                v-if="showClose"
                @click="handleClose"
                type="button"
                aria-label="Fechar"
                class="ml-auto -mr-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-4 overflow-y-auto max-h-[calc(100vh-20rem)]">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50"
            >
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
  closeOnOverlay?: boolean
  fullscreenOnMobile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  size: 'md',
  showClose: true,
  closeOnOverlay: true,
  fullscreenOnMobile: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const titleId = computed(
  () => `modal-title-${Math.random().toString(36).substring(2, 9)}`
)

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] sm:max-w-6xl',
}

function handleClose() {
  emit('update:modelValue', false)
  emit('close')
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    handleClose()
  }
}

// Fechar com Escape
function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  // Previne scroll do body quando modal está aberto
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Custom scrollbar para o body da modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 0.5rem;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 0.25rem;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 0.25rem;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
