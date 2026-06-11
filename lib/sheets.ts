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

export interface MonthlyData {
  month: string
  // Finance
  revenue: number | null
  expenses: number | null
  opExpenses: number | null
  ebitda: number | null
  ebitdaMargin: number | null
  balanceTotal: number | null
  balanceAlfa: number | null
  balanceSafe: number | null
  balanceYankevich: number | null
  balanceGorbunova: number | null
  balanceZhirnov: number | null
  // Products
  racesRevTotal: number | null
  racesRevMorning: number | null
  racesRevBaseWeekday: number | null
  racesRevRepeatWeekday: number | null
  racesRevBaseWeekend: number | null
  racesRevRepeatWeekend: number | null
  racesRevClub: number | null
  racesRevPromo: number | null
  racesRevTimeAttack: number | null
  racesRevCerts: number | null
  racesCount: number | null
  // Expenses
  expTotal: number | null
  expOp: number | null
  expFotTotal: number | null
  expFotMarshals: number | null
  expFotAdmins: number | null
  expFotMechanics: number | null
  expFotManagement: number | null
  expFotSales: number | null
  expFotBonusTeam: number | null
  expFotBonusMgmt: number | null
  expFotMarketer: number | null
  expFotTrainer: number | null
  expFotAccountant: number | null
  expFotPhotographer: number | null
  expFotDesigner: number | null
  // Clients
  clientsTotal: number | null
  clientsNew: number | null
  clientsNewPct: number | null
  racesWithEvents: number | null
  trackLoad: number | null
  incomingTraffic: number | null
  racesNoBooking: number | null
  leadsRaces: number | null
  leadsEvents: number | null
  leadsTrainings: number | null
  leadsConverted: number | null
}

async function fetchSheet(sheetName: string): Promise<unknown[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
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

// ── Month column detection ───────────────────────────────────────────────────
//
// The vertical sheets (DB_Finance etc.) have a header row where column A is
// "Показатель" and the month columns can start at any arbitrary column.
// This function scans the header row and returns a map of { monthName → colIndex }.
// All subsequent value lookups use this map instead of hardcoded offsets.

const MONTHS = ['окт.25', 'ноя.25', 'дек.25', 'янв.26', 'фев.26', 'март.26', 'апр.26', 'май.26']

function normaliseMonthLabel(v: unknown): string {
  if (v === null || v === undefined) return ''
  // Sheets sometimes delivers Cyrillic month names with a trailing dot already,
  // or with slightly different spacing — normalise to lowercase trimmed.
  return String(v).trim().toLowerCase()
}

function buildMonthIndex(headerRow: unknown[]): Map<string, number> {
  const idx = new Map<string, number>()
  headerRow.forEach((cell, col) => {
    const label = normaliseMonthLabel(cell)
    // Match against each expected month (also normalised)
    MONTHS.forEach((m) => {
      if (label === m.toLowerCase()) idx.set(m, col)
    })
  })
  return idx
}

// Returns value for a given month from a data row using the pre-built column map.
function gv(
  rows: unknown[][],
  rowIdx: number,
  month: string,
  monthIdx: Map<string, number>
): number | null {
  const col = monthIdx.get(month)
  if (col === undefined) return null
  const row = rows[rowIdx]
  if (!row) return null
  return parseSheetsValue(row[col])
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboard(): Promise<DashboardRow[]> {
  const rows = await fetchSheet('Dashboard')
  const result: DashboardRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r[0]) continue
    const dateVal = r[0]
    let dateStr = ''
    if (typeof dateVal === 'string' && dateVal.startsWith('Date(')) {
      const m = dateVal.match(/Date\((\d+),(\d+),(\d+)/)
      if (m) {
        const d = new Date(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]))
        dateStr = d.toISOString().split('T')[0]
      }
    } else if (dateVal instanceof Date) {
      dateStr = (dateVal as Date).toISOString().split('T')[0]
    } else {
      dateStr = String(dateVal)
    }
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

// ── Analytics (vertical sheets) ──────────────────────────────────────────────

export async function fetchAnalytics(): Promise<MonthlyData[]> {
  const [finRes, prodRes, expRes, cliRes] = await Promise.allSettled([
    fetchSheet('DB_Finance'),
    fetchSheet('DB_Products'),
    fetchSheet('DB_Expenses'),
    fetchSheet('DB_Clients'),
  ])

  const fin  = finRes.status  === 'fulfilled' ? finRes.value  : []
  const prod = prodRes.status === 'fulfilled' ? prodRes.value : []
  const exp  = expRes.status  === 'fulfilled' ? expRes.value  : []
  const cli  = cliRes.status  === 'fulfilled' ? cliRes.value  : []

  // Row 0 is the header row — find month columns dynamically for each sheet.
  const finIdx  = fin.length  ? buildMonthIndex(fin[0]  as unknown[]) : new Map<string, number>()
  const prodIdx = prod.length ? buildMonthIndex(prod[0] as unknown[]) : new Map<string, number>()
  const expIdx  = exp.length  ? buildMonthIndex(exp[0]  as unknown[]) : new Map<string, number>()
  const cliIdx  = cli.length  ? buildMonthIndex(cli[0]  as unknown[]) : new Map<string, number>()

  return MONTHS.map((month) => ({
    month,

    // DB_Finance — row indices per spec (0-based, row 0 = header)
    revenue:         gv(fin, 2,  month, finIdx),
    expenses:        gv(fin, 3,  month, finIdx),
    opExpenses:      gv(fin, 4,  month, finIdx),
    ebitda:          gv(fin, 5,  month, finIdx),
    ebitdaMargin:    gv(fin, 6,  month, finIdx),
    balanceTotal:    gv(fin, 9,  month, finIdx),
    balanceAlfa:     gv(fin, 10, month, finIdx),
    balanceSafe:     gv(fin, 11, month, finIdx),
    balanceYankevich:gv(fin, 12, month, finIdx),
    balanceGorbunova:gv(fin, 13, month, finIdx),
    balanceZhirnov:  gv(fin, 14, month, finIdx),

    // DB_Products
    racesRevTotal:        gv(prod, 2,  month, prodIdx),
    racesRevMorning:      gv(prod, 3,  month, prodIdx),
    racesRevBaseWeekday:  gv(prod, 4,  month, prodIdx),
    racesRevRepeatWeekday:gv(prod, 5,  month, prodIdx),
    racesRevBaseWeekend:  gv(prod, 6,  month, prodIdx),
    racesRevRepeatWeekend:gv(prod, 7,  month, prodIdx),
    racesRevClub:         gv(prod, 8,  month, prodIdx),
    racesRevPromo:        gv(prod, 9,  month, prodIdx),
    racesRevTimeAttack:   gv(prod, 10, month, prodIdx),
    racesRevCerts:        gv(prod, 11, month, prodIdx),
    racesCount:           gv(prod, 12, month, prodIdx),

    // DB_Expenses
    expTotal:        gv(exp, 2,  month, expIdx),
    expOp:           gv(exp, 3,  month, expIdx),
    expFotTotal:     gv(exp, 6,  month, expIdx),
    expFotMarshals:  gv(exp, 7,  month, expIdx),
    expFotAdmins:    gv(exp, 8,  month, expIdx),
    expFotMechanics: gv(exp, 9,  month, expIdx),
    expFotManagement:gv(exp, 10, month, expIdx),
    expFotSales:     gv(exp, 11, month, expIdx),
    expFotBonusTeam: gv(exp, 12, month, expIdx),
    expFotBonusMgmt: gv(exp, 13, month, expIdx),
    expFotMarketer:  gv(exp, 14, month, expIdx),
    expFotTrainer:   gv(exp, 15, month, expIdx),
    expFotAccountant:gv(exp, 16, month, expIdx),
    expFotPhotographer:gv(exp, 17, month, expIdx),
    expFotDesigner:  gv(exp, 18, month, expIdx),

    // DB_Clients
    clientsTotal:    gv(cli, 2,  month, cliIdx),
    clientsNew:      gv(cli, 3,  month, cliIdx),
    clientsNewPct:   gv(cli, 4,  month, cliIdx),
    racesWithEvents: gv(cli, 7,  month, cliIdx),
    trackLoad:       gv(cli, 8,  month, cliIdx),
    incomingTraffic: gv(cli, 9,  month, cliIdx),
    racesNoBooking:  gv(cli, 10, month, cliIdx),
    leadsRaces:      gv(cli, 13, month, cliIdx),
    leadsEvents:     gv(cli, 14, month, cliIdx),
    leadsTrainings:  gv(cli, 15, month, cliIdx),
    leadsConverted:  gv(cli, 16, month, cliIdx),
  }))
}
