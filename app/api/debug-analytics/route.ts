import { NextResponse } from 'next/server'

const SHEET_ID = '1bRMnBP6B4c7mctDdya9EDxYVVonebgf5vjQvLLGO3Kc'

const MONTH_PATTERN = /^(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)[.\s]\d{2}$/i
const MONTH_NAMES = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']

function excelDateToMonthLabel(serial: number): string {
  const date = new Date(1900, 0, serial - 1)
  return `${MONTH_NAMES[date.getMonth()]}.${String(date.getFullYear()).slice(2)}`
}

function cellToMonthLabel(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'number' && v >= 40000 && v <= 50000) return excelDateToMonthLabel(v)
  const s = String(v).trim()
  const norm = s.toLowerCase().replace(/\s+/g, '.').replace(/\.+/g, '.')
  return MONTH_PATTERN.test(norm) ? norm : null
}

export async function GET() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('DB_Finance')}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 500 })

  const text = await res.text()
  const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '')

  let data: { table?: { cols?: unknown[]; rows?: { c: ({ v: unknown } | null)[] }[] } }
  try { data = JSON.parse(jsonStr) } catch {
    return NextResponse.json({ error: 'JSON parse failed', raw: text.slice(0, 500) }, { status: 500 })
  }

  const rawRows = data.table?.rows ?? []
  const headerCells = (rawRows[0]?.c ?? []).map((c, i) => ({
    index: i,
    rawValue: c ? c.v : null,
    convertedLabel: cellToMonthLabel(c ? c.v : null),
  }))
  const detectedMonths = headerCells.filter((c) => c.convertedLabel !== null)

  const metricLabels = rawRows.slice(1, 6).map((r) => {
    const v = r.c?.[0]?.v
    return v != null ? String(v) : '(empty)'
  })

  return NextResponse.json({
    totalRows: rawRows.length,
    headerCells,
    detectedMonths,
    firstMetricLabels: metricLabels,
  })
}
