import { ref, readonly, computed } from 'vue'
import api from '../services/api'

export interface CalendarDay {
  day: number
  has_individual: boolean
  has_grupo: boolean
  individual_count: number
  grupo_count: number
  is_today: boolean
}

export interface CalendarData {
  year: number
  month: number
  days: CalendarDay[]
}

export interface PracticeOnDate {
  id: number
  tipo: 'individual' | 'grupo'
  duracao_minutos: number | null
  notas: string | null
  musica_nome: string
  autor: string | null
  membro_nome: string
}

const calendarData = ref<CalendarData | null>(null)
const practicesOnSelectedDate = ref<PracticeOnDate[]>([])
const selectedDate = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function usePracticeCalendar() {
  async function loadCalendar(memberId: number, year: number, month: number) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/practice-calendar/member/${memberId}/${year}/${month}`)
      calendarData.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar calendário'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadPracticesOnDate(memberId: number, date: string) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/practice-calendar/member/${memberId}/date`, {
        params: { date }
      })
      practicesOnSelectedDate.value = response.data.practices
      selectedDate.value = date
      return response.data.practices
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Erro ao carregar práticas da data'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearSelectedDate() {
    selectedDate.value = null
    practicesOnSelectedDate.value = []
  }

  const monthName = computed(() => {
    if (!calendarData.value) return ''
    return monthNames[calendarData.value.month - 1]
  })

  const calendarYear = computed(() => {
    return calendarData.value?.year || new Date().getFullYear()
  })

  const calendarMonth = computed(() => {
    return calendarData.value?.month || new Date().getMonth() + 1
  })

  function getDaysGrid() {
    if (!calendarData.value) return []

    const firstDayOfMonth = new Date(calendarData.value.year, calendarData.value.month - 1, 1)
    const startingDay = firstDayOfMonth.getDay() // 0 = Domingo, 6 = Sábado

    // Preencher dias vazios antes do primeiro dia
    const grid: (CalendarDay | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      grid.push(null)
    }

    // Adicionar dias do mês
    calendarData.value.days.forEach(day => {
      grid.push(day)
    })

    return grid
  }

  function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  return {
    calendarData: readonly(calendarData),
    practicesOnSelectedDate: readonly(practicesOnSelectedDate),
    selectedDate: readonly(selectedDate),
    loading: readonly(loading),
    error: readonly(error),
    monthName,
    calendarYear,
    calendarMonth,
    loadCalendar,
    loadPracticesOnDate,
    clearSelectedDate,
    getDaysGrid,
    formatDate,
    weekDays
  }
}
