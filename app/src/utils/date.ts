/**
 * Utilitário de datas para conversão e formatação
 * 
 * Convenção:
 * - Backend: Sempre UTC
 * - Frontend: Exibe no fuso local do browser
 */

const UTC_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z)?$/

/**
 * Converte string UTC ou Date para string UTC ISO-8601
 * 
 * @param date - String UTC ou objeto Date
 * @returns String no formato ISO-8601 UTC (ex: "2025-03-30T03:00:00.000Z")
 */
export function toUTC(date: Date | string): string {
  if (typeof date === 'string') {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      throw new Error(`Data inválida: ${date}`)
    }
    return d.toISOString()
  }
  return date.toISOString()
}

/**
 * Formata string UTC para exibição no fuso local do browser
 * 
 * @param dateStr - String UTC (ex: "2025-03-30T03:00:00.000Z")
 * @param options - Opções de formatação do Intl.DateTimeFormat
 * @returns String formatada no fuso local (ex: "30/03/2025")
 */
export function formatLocal(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(dateStr)
  
  if (isNaN(date.getTime())) {
    console.error(`[formatLocal] Data inválida: ${dateStr}`)
    return dateStr
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
  
  return date.toLocaleDateString('pt-BR', { ...defaultOptions, ...options })
}

/**
 * Formata string UTC para exibição com hora no fuso local do browser
 * 
 * @param dateStr - String UTC (ex: "2025-03-30T03:00:00.000Z")
 * @returns String formatada com hora (ex: "30/03/2025 às 00:00")
 */
export function formatLocalWithTime(dateStr: string): string {
  return formatLocal(dateStr, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Parser de input date (YYYY-MM-DD) para UTC
 * 
 * O input type="date" retorna uma string no formato YYYY-MM-DD sem timezone.
 * Esta função interpreta como data local e converte para UTC.
 * 
 * @param value - String no formato YYYY-MM-DD
 * @returns String UTC ISO-8601 (ex: "2025-03-30T03:00:00.000Z")
 */
export function parseDateInput(value: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Formato de data inválido: ${value}. Esperado YYYY-MM-DD`)
  }
  
  // Criar date como local (meio-dia para evitar problemas de DST)
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0)
  
  if (isNaN(date.getTime())) {
    throw new Error(`Data inválida: ${value}`)
  }
  
  return date.toISOString()
}

/**
 * Valida se string está no formato UTC ISO-8601
 * 
 * @param dateStr - String para validar
 * @returns true se for formato UTC válido
 */
export function isValidUTC(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') {
    return false
  }
  
  if (!UTC_REGEX.test(dateStr)) {
    return false
  }
  
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

/**
 * Valida se string está no formato de data (YYYY-MM-DD)
 * 
 * @param dateStr - String para validar
 * @returns true se for formato de data válido
 */
export function isValidDateInput(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') {
    return false
  }
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false
  }
  
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/**
 * Obtém a data atual no fuso local em formato UTC
 * 
 * @returns String UTC da data atual (ex: "2025-03-30T03:00:00.000Z")
 */
export function getNowUTC(): string {
  return new Date().toISOString()
}

/**
 * Obtém a data atual no fuso local em formato YYYY-MM-DD
 * 
 * @returns String no formato YYYY-MM-DD (ex: "2025-03-30")
 */
export function getTodayLocal(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
