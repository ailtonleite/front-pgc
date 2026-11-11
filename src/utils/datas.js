/**
 * Conversão e formatação de datas, durações e percentuais (pt-BR).
 */

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatoHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const formatoPercentual = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })

const doisDigitos = (n) => String(n).padStart(2, '0')

/**
 * Data no horário local, **sem fuso**: `"2026-10-25T00:00:00"`.
 * O back-end interpreta no fuso do histórico. Não usar `toISOString()`, que converte para UTC.
 * @param {Date} data
 * @returns {string}
 */
export function paraIsoLocal(data) {
  const dia = `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`
  const hora = `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}:${doisDigitos(data.getSeconds())}`
  return `${dia}T${hora}`
}

/**
 * 00:00:00 do dia de `data` (não altera o original).
 * @param {Date} data
 * @returns {Date}
 */
export function inicioDoDia(data) {
  const resultado = new Date(data)
  resultado.setHours(0, 0, 0, 0)
  return resultado
}

/**
 * 23:59:59 do dia de `data` (não altera o original).
 * @param {Date} data
 * @returns {Date}
 */
export function fimDoDia(data) {
  const resultado = new Date(data)
  resultado.setHours(23, 59, 59, 999)
  return resultado
}

/**
 * `"25/10/2026 14:30"`, no fuso do navegador.
 * @param {string | null} iso
 * @returns {string} `"—"` se vazio ou inválido
 */
export function formatarDataHora(iso) {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '—'
  return `${formatoData.format(data)} ${formatoHora.format(data)}`
}

/**
 * `95` → `"1 h 35 min"`; `120` → `"2 h"`; `35` → `"35 min"`.
 * @param {number} minutos
 * @returns {string}
 */
export function formatarDuracao(minutos) {
  const total = Math.max(0, Math.floor(minutos))
  const horas = Math.floor(total / 60)
  const resto = total % 60
  if (horas === 0) return `${resto} min`
  if (resto === 0) return `${horas} h`
  return `${horas} h ${resto} min`
}

/**
 * `0.734` → `"73,4%"`.
 * @param {number | null} taxa fração entre 0 e 1
 * @returns {string} `"—"` se `null`
 */
export function formatarPercentual(taxa) {
  if (taxa === null || taxa === undefined || Number.isNaN(taxa)) return '—'
  return formatoPercentual.format(taxa)
}
