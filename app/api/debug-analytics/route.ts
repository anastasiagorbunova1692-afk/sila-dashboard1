import { NextResponse } from 'next/server'

const SHEET_ID = '1bRMnBP6B4c7mctDdya9EDxYVVonebgf5vjQvLLGO3Kc'

const MONTH_PATTERN = /^(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)\.?\d{2}$/i

function cellToMonthLabel(cell: { v?: unknown; f?: unknown } | null): string | null {
  if (!cell) return null
  for (const raw of [cell.f, cell.v]) {
    if (raw == null) continue
    const s = String(raw).trim().toLowerCase()
    if (MONTH_PATTERN.test(s)) return s
  }
  return null
}

async function fetchRaw(sheetName: string, range?: string) {
  const rangeParam = range ? `&range=${encodeURIComponent(range)}` : ''
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}${rangeParam}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  const text = await res.text()
  const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '')
  return JSON.parse(jsonStr)
}

export async function GET() {
  // DB_Finance — check month header detection
  const fin = await fetchRaw('DB_Finance')
  const finRows = fin?.table?.rows ?? []
  const finHeader = (finRows[0]?.c ?? []).map((c: { v?: unknown; f?: unknown } | null, i: number) => ({
    index: i, rawV: c?.v ?? null, rawF: c?.f ?? null, convertedLabel: cellToMonthLabel(c),
  }))
  const detectedMonths = finHeader.filter((c: { convertedLabel: string | null }) => c.convertedLabel !== null)
  const firstMetricLabels = finRows.slice(1, 6).map((r: { c: ({ v: unknown } | null)[] }) => r.c?.[0]?.v ?? '(empty)')

  // Dashboard — check column F (index 5 = revenueAbos) for recent rows
  const dash = await fetchRaw('Dashboard', 'A1:I20')
  const dashRows = (dash?.table?.rows ?? []).slice(1, 11).map((r: { c: ({ v: unknown } | null)[] }, i: number) => ({
    rowIndex: i + 1,
    date: r.c?.[0]?.v ?? null,
    revenue: r.c?.[1]?.v ?? null,
    revenueRaces: r.c?.[2]?.v ?? null,
    revenueCerts: r.c?.[3]?.v ?? null,
    revenueEvents: r.c?.[4]?.v ?? null,
    revenueAbos: r.c?.[5]?.v ?? null,   // column F
    races: r.c?.[6]?.v ?? null,
    clients: r.c?.[7]?.v ?? null,
    newClients: r.c?.[8]?.v ?? null,
  }))

  return NextResponse.json({
    dbFinance: { totalRows: finRows.length, detectedMonths, firstMetricLabels },
    dashboard: { sampleRows: dashRows },
  })
}
