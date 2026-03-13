<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Cards de estatísticas -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-2">Repertório</h2>
        <p class="text-3xl font-bold text-blue-600">0</p>
        <p class="text-sm text-gray-500 mt-1">Músicas cadastradas</p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-2">Seleções</h2>
        <p class="text-3xl font-bold text-green-600">0</p>
        <p class="text-sm text-gray-500 mt-1">Seleções ativas</p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-2">Estudos</h2>
        <p class="text-3xl font-bold text-purple-600">0</p>
        <p class="text-sm text-gray-500 mt-1">Sessões de estudo</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
