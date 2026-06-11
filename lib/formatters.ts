export function formatRub(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—'
  if (value === 0) return '—'
  return (
    value
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'
  )
}

export function formatRubShort(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—'
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace('.', ',') + 'М ₽'
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(1).replace('.', ',') + 'К ₽'
  }
  return formatRub(value)
}

export function formatNum(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—'
  const v = Math.abs(value) <= 1 && value !== 0 ? value * 100 : value
  return v.toFixed(1) + '%'
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

export function parseSheetsValue(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    if (v === '' || v === '#REF!' || v === '#VALUE!' || v === '#N/A') return null
    const cleaned = v.replace(/[^\d.,\-]/g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return isNaN(n) ? null : n
  }
  return null
}
