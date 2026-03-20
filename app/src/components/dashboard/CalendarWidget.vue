<template>
  <div class="bg-white rounded-lg shadow p-4 sm:p-6">
    <!-- Header com mês/ano e navegação -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span class="mdi mdi-calendar text-blue-600"></span>
        Calendário de Ensaios
      </h3>
      <div class="flex items-center gap-2">
        <button
          @click="previousMonth"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Mês anterior"
        >
          <span class="mdi mdi-chevron-left text-gray-600"></span>
        </button>
        <span class="text-sm font-medium text-gray-900 min-w-[140px] text-center">
          {{ monthName }} {{ calendarYear }}
        </span>
        <button
          @click="nextMonth"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Próximo mês"
        >
          <span class="mdi mdi-chevron-right text-gray-600"></span>
        </button>
      </div>
    </div>

    <!-- Legenda -->
    <div class="flex items-center gap-4 mb-4 text-xs">
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-green-500"></div>
        <span class="text-gray-600">Dia com ensaio</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded border-2 border-blue-500"></div>
        <span class="text-gray-600">Hoje</span>
      </div>
    </div>

    <!-- Grid do calendário -->
    <div v-if="calendarData" class="grid grid-cols-7 gap-1">
      <!-- Dias da semana -->
      <div
        v-for="day in weekDays"
        :key="day"
        class="text-center text-xs font-medium text-gray-500 py-2"
      >
        {{ day }}
      </div>

      <!-- Dias do mês -->
      <div
        v-for="(day, index) in daysGrid"
        :key="index"
        class="aspect-square"
      >
        <div
          v-if="day"
          @click="selectDay(day)"
          class="relative h-full w-full rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-gray-50"
          :class="[
            day.has_practice ? 'bg-green-500 text-white hover:bg-green-600' : 'text-gray-700',
            day.is_today && !day.has_practice ? 'border-2 border-blue-500' : '',
            day.is_today && day.has_practice ? 'ring-2 ring-blue-500 ring-offset-2' : ''
          ]"
        >
          <span class="text-sm font-medium">{{ day.day }}</span>
          <span
            v-if="day.has_practice"
            class="text-xs mt-0.5"
          >
            {{ day.practice_count }}
          </span>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else-if="loading" class="flex items-center justify-center py-12">
      <span class="mdi mdi-loading mdi-spin text-3xl text-blue-600"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePracticeCalendar, type CalendarDay } from '../../composables/usePracticeCalendar'

const props = defineProps<{
  memberId: number
}>()

const emit = defineEmits<{
  'select-date': [date: string]
}>()

const {
  calendarData,
  loading,
  monthName,
  calendarYear,
  calendarMonth,
  loadCalendar,
  getDaysGrid,
  weekDays
} = usePracticeCalendar()

const currentMonth = computed(() => calendarMonth.value)
const currentYear = computed(() => calendarYear.value)

const daysGrid = computed(() => {
  return getDaysGrid()
})

async function selectDay(day: CalendarDay) {
  const date = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
  emit('select-date', date)
}

function previousMonth() {
  let newMonth = currentMonth.value - 1
  let newYear = currentYear.value

  if (newMonth < 1) {
    newMonth = 12
    newYear--
  }

  loadCalendar(props.memberId, newYear, newMonth)
}

function nextMonth() {
  let newMonth = currentMonth.value + 1
  let newYear = currentYear.value

  if (newMonth > 12) {
    newMonth = 1
    newYear++
  }

  loadCalendar(props.memberId, newYear, newMonth)
}

onMounted(() => {
  const today = new Date()
  loadCalendar(props.memberId, today.getFullYear(), today.getMonth() + 1)
})
</script>
