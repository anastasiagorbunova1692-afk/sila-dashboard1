import { parseSheetsValue } from './formatters'

const SHEET_ID = '1bRMnBP6B4c7mctDdya9EDxYVVonebgf5vjQvLLGO3Kc'

export interface DashboardRow {
  date: string
  revenue: number | null
  revenueRaces: number | null
  revenueCerts: number | null
  revenueEvents: number | null
  revenueAbos: number | null
  races: number | null
  clients: number | null
  newClients: number | null
}

async function fetchSheet(sheetName: string, range?: string): Promise<unknown[][]> {
  const rangeParam = range ? `&range=${encodeURIComponent(range)}` : ''
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}${rangeParam}`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`Failed to fetch sheet ${sheetName}: ${res.status}`)
  const text = await res.text()
  const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '')
  const data = JSON.parse(jsonStr)
  const rows: unknown[][] = (data.table?.rows || []).map(
    (row: { c: Array<{ v: unknown } | null> }) =>
      (row.c || []).map((cell) => (cell ? cell.v : null))
  )
  return rows
}

// gviz encodes dates as "Date(year,month0,day)" where month is 0-indexed.
export function parseGvizDate(val: unknown): Date | null {
  if (!val) return null
  const match = String(val).match(/Date\((\d+),(\d+),(\d+)\)/)
  if (!match) return null
  return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]))
}

export async function fetchDashboard(): Promise<DashboardRow[]> {
  const rows = await fetchSheet('Dashboard', 'A1:I1000')
  const result: DashboardRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r[0]) continue
    const parsed = parseGvizDate(r[0])
    if (!parsed) continue
    // Store as local ISO date string (YYYY-MM-DD) using local year/month/day
    // so comparisons with `new Date()` stay in the same timezone.
    const dateStr = [
      parsed.getFullYear(),
      String(parsed.getMonth() + 1).padStart(2, '0'),
      String(parsed.getDate()).padStart(2, '0'),
    ].join('-')
    result.push({
      date: dateStr,
      revenue: parseSheetsValue(r[1]),
      revenueRaces: parseSheetsValue(r[2]),
      revenueCerts: parseSheetsValue(r[3]),
      revenueEvents: parseSheetsValue(r[4]),
      revenueAbos: parseSheetsValue(r[5]),
      races: parseSheetsValue(r[6]),
      clients: parseSheetsValue(r[7]),
      newClients: parseSheetsValue(r[8]),
    })
  }
  return result
}
