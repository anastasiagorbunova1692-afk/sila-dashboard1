import { NextResponse } from 'next/server'

const SHEET_ID = '1bRMnBP6B4c7mctDdya9EDxYVVonebgf5vjQvLLGO3Kc'

const MONTH_PATTERN = /^(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)[.\s]\d{2}$/i

export async function GET() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('DB_Finance')}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 500 })

  const text = await res.text()
  const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '')

  let data: { table?: { cols?: { label?: string }[]; rows?: { c: ({ v: unknown } | null)[] }[] } }
  try { data = JSON.parse(jsonStr) } catch {
    return NextResponse.json({ error: 'JSON parse failed', raw: text.slice(0, 500) }, { status: 500 })
  }

  const rawRows = data.table?.rows ?? []

  // cols labels (usually empty for gviz vertical sheets)
  const colLabels = (data.table?.cols ?? []).map((c) => c.label ?? '')

  // rows[0] = header row with month names in cells
  const headerCells = (rawRows[0]?.c ?? []).map((c) => (c ? c.v : null))
  const detectedMonths: { index: number; value: string }[] = []
  headerCells.forEach((v, i) => {
    const s = v != null ? String(v).trim() : ''
    const norm = s.toLowerCase().replace(/\s+/g, '.').replace(/\.+/g, '.')
    if (MONTH_PATTERN.test(norm)) detectedMonths.push({ index: i, value: s })
  })

  // First 5 metric row labels (rows[1..5])
  const metricLabels = rawRows.slice(1, 6).map((r) => {
    const v = r.c?.[0]?.v
    return v != null ? String(v) : '(empty)'
  })

  return NextResponse.json({
    totalRows: rawRows.length,
    colLabels,
    headerRow: headerCells,
    detectedMonths,
    firstMetricLabels: metricLabels,
  })
}
