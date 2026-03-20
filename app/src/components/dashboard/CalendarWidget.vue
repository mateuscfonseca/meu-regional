<template>
  <div class="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-5">
    <!-- Header com mês/ano e navegação -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-base font-semibold text-gray-900 flex items-center gap-2">
        <span class="mdi mdi-calendar text-blue-600"></span>
        <span class="hidden sm:inline">{{ title }}</span>
        <span class="sm:hidden">Calendário</span>
      </h3>
      <div class="flex items-center gap-1 sm:gap-2">
        <button
          @click="previousMonth"
          class="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Mês anterior"
        >
          <span class="mdi mdi-chevron-left text-gray-600"></span>
        </button>
        <span class="text-sm font-medium text-gray-900 min-w-[120px] sm:min-w-[140px] text-center">
          {{ monthName }} {{ calendarYear }}
        </span>
        <button
          @click="nextMonth"
          class="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Próximo mês"
        >
          <span class="mdi mdi-chevron-right text-gray-600"></span>
        </button>
      </div>
    </div>

    <!-- Legenda -->
    <div v-if="filterType === 'todos' && !showOnlyGrupo" class="flex items-center gap-2 sm:gap-4 mb-3 text-xs">
      <div class="flex items-center gap-1">
        <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-500"></div>
        <span class="text-gray-600 hidden sm:inline">Grupo</span>
        <span class="text-gray-600 sm:hidden">Grupo</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-purple-500"></div>
        <span class="text-gray-600 hidden sm:inline">Individual</span>
        <span class="text-gray-600 sm:hidden">Individual</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border-2 border-blue-500"></div>
        <span class="text-gray-600 hidden sm:inline">Hoje</span>
        <span class="text-gray-600 sm:hidden">Hoje</span>
      </div>
    </div>
    <div v-else-if="filterType === 'todos' && showOnlyGrupo" class="flex items-center gap-2 sm:gap-4 mb-3 text-xs">
      <div class="flex items-center gap-1">
        <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-500"></div>
        <span class="text-gray-600 hidden sm:inline">Dia com Ensaio</span>
        <span class="text-gray-600 sm:hidden">Ensaio</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border-2 border-blue-500"></div>
        <span class="text-gray-600 hidden sm:inline">Hoje</span>
        <span class="text-gray-600 sm:hidden">Hoje</span>
      </div>
    </div>
    <div v-else-if="filterType === 'grupo'" class="flex items-center gap-2 sm:gap-4 mb-3 text-xs">
      <div class="flex items-center gap-1">
        <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-500"></div>
        <span class="text-gray-600 hidden sm:inline">Dia com Ensaio</span>
        <span class="text-gray-600 sm:hidden">Ensaio</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border-2 border-blue-500"></div>
        <span class="text-gray-600 hidden sm:inline">Hoje</span>
        <span class="text-gray-600 sm:hidden">Hoje</span>
      </div>
    </div>
    <div v-else-if="filterType === 'individual'" class="flex items-center gap-2 sm:gap-4 mb-3 text-xs">
      <div class="flex items-center gap-1">
        <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-purple-500"></div>
        <span class="text-gray-600 hidden sm:inline">Dia de Estudo</span>
        <span class="text-gray-600 sm:hidden">Estudo</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border-2 border-blue-500"></div>
        <span class="text-gray-600 hidden sm:inline">Hoje</span>
        <span class="text-gray-600 sm:hidden">Hoje</span>
      </div>
    </div>

    <!-- Grid do calendário -->
    <div v-if="calendarData" class="grid grid-cols-7 gap-1">
      <!-- Dias da semana -->
      <div
        v-for="day in weekDays"
        :key="day"
        class="text-center text-xs font-medium text-gray-500 py-1"
      >
        {{ day }}
      </div>

      <!-- Dias do mês -->
      <div
        v-for="(day, index) in daysGrid"
        :key="index"
        class="aspect-square lg:aspect-auto lg:h-16"
      >
        <div
          v-if="day"
          @click="selectDay(day)"
          class="relative h-full w-full rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-gray-50"
          :class="getDayClasses(day)"
        >
          <span class="text-xs sm:text-sm font-medium">{{ day.day }}</span>
          <span
            v-if="shouldShowCount(day)"
            class="text-xs mt-0.5 inline-flex items-center gap-0.5"
          >
            <span class="mdi mdi-music"></span>
            {{ getCount(day) }}
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

const props = withDefaults(defineProps<{
  memberId: number
  title?: string
  showOnlyGrupo?: boolean
  filterType?: 'todos' | 'individual' | 'grupo'
}>(), {
  title: 'Calendário de Estudos',
  showOnlyGrupo: false,
  filterType: 'todos'
})

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

function getDayClasses(day: CalendarDay) {
  const isGrupo = day.has_grupo
  const isIndividual = day.has_individual
  const isToday = day.is_today
  
  // Determina se deve mostrar o dia como colorido baseado no filtro
  const shouldColor = props.filterType === 'todos' 
    ? (isGrupo || isIndividual)
    : props.filterType === 'grupo'
      ? isGrupo
      : isIndividual
  
  // Determina a cor baseada no filtro e tipo
  let bgColorClass = 'text-gray-700'
  if (shouldColor) {
    if (props.filterType === 'todos' && isGrupo) {
      bgColorClass = 'bg-green-500 text-white hover:bg-green-600'
    } else if (props.filterType === 'todos' && isIndividual && !props.showOnlyGrupo) {
      bgColorClass = 'bg-purple-500 text-white hover:bg-purple-600'
    } else if (props.filterType === 'grupo' && isGrupo) {
      bgColorClass = 'bg-green-500 text-white hover:bg-green-600'
    } else if (props.filterType === 'individual' && isIndividual) {
      bgColorClass = 'bg-purple-500 text-white hover:bg-purple-600'
    }
  }
  
  // Borda/anel para hoje
  const todayClass = isToday
    ? (shouldColor ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-2 border-blue-500')
    : ''
  
  return `${bgColorClass} ${todayClass}`
}

function shouldShowCount(day: CalendarDay): boolean {
  if (props.filterType === 'todos') {
    return day.has_grupo || day.has_individual
  } else if (props.filterType === 'grupo') {
    return day.has_grupo
  } else {
    return day.has_individual
  }
}

function getCount(day: CalendarDay): number {
  if (props.filterType === 'individual') {
    return day.individual_count
  }
  return day.grupo_count + day.individual_count
}

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
