<template>
  <button
    @click="handleClick"
    class="fixed bottom-6 right-6 z-50 
           bg-blue-600 hover:bg-blue-700 
           text-white rounded-full 
           p-4 shadow-lg 
           transition-all duration-200 
           hover:scale-105 hover:shadow-xl
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
           active:scale-95"
    :aria-label="label"
  >
    <span class="mdi" :class="iconClass"></span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  icon?: string;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'mdi-plus',
  label: 'Adicionar',
});

const emit = defineEmits<{
  click: [];
}>();

const iconClass = computed(() => props.icon);

function handleClick() {
  emit('click');
}
</script>
