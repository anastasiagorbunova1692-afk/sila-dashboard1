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
  const rows: unknown[][] = (data.table?.rows || []).map((row: { c: Array<{ v: unknown } | null> }) =>
    (row.c || []).map((cell) => (cell ? cell.v : null))
  )
  return rows
}

export async function fetchDashboard(): Promise<DashboardRow[]> {
  const rows = await fetchSheet('Dashboard')
  const result: DashboardRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r[0]) continue
    let dateVal = r[0]
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

const MONTHS = ['окт.25', 'ноя.25', 'дек.25', 'янв.26', 'фев.26', 'март.26', 'апр.26', 'май.26']

function getRowValues(rows: unknown[][], rowIndex: number): (number | null)[] {
  const row = rows[rowIndex]
  if (!row) return MONTHS.map(() => null)
  return MONTHS.map((_, i) => parseSheetsValue(row[i + 1]))
}

export async function fetchAnalytics(): Promise<MonthlyData[]> {
  const [finRows, prodRows, expRows, clientRows] = await Promise.allSettled([
    fetchSheet('DB_Finance'),
    fetchSheet('DB_Products'),
    fetchSheet('DB_Expenses'),
    fetchSheet('DB_Clients'),
  ])

  const fin = finRows.status === 'fulfilled' ? finRows.value : []
  const prod = prodRows.status === 'fulfilled' ? prodRows.value : []
  const exp = expRows.status === 'fulfilled' ? expRows.value : []
  const cli = clientRows.status === 'fulfilled' ? clientRows.value : []

  return MONTHS.map((month, i) => {
    const gv = (rows: unknown[][], rowIdx: number) => {
      const row = rows[rowIdx]
      if (!row) return null
      return parseSheetsValue(row[i + 1])
    }

    return {
      month,
      revenue: gv(fin, 2),
      expenses: gv(fin, 3),
      opExpenses: gv(fin, 4),
      ebitda: gv(fin, 5),
      ebitdaMargin: gv(fin, 6),
      balanceTotal: gv(fin, 9),
      balanceAlfa: gv(fin, 10),
      balanceSafe: gv(fin, 11),
      balanceYankevich: gv(fin, 12),
      balanceGorbunova: gv(fin, 13),
      balanceZhirnov: gv(fin, 14),

      racesRevTotal: gv(prod, 2),
      racesRevMorning: gv(prod, 3),
      racesRevBaseWeekday: gv(prod, 4),
      racesRevRepeatWeekday: gv(prod, 5),
      racesRevBaseWeekend: gv(prod, 6),
      racesRevRepeatWeekend: gv(prod, 7),
      racesRevClub: gv(prod, 8),
      racesRevPromo: gv(prod, 9),
      racesRevTimeAttack: gv(prod, 10),
      racesRevCerts: gv(prod, 11),
      racesCount: gv(prod, 12),

      expTotal: gv(exp, 2),
      expOp: gv(exp, 3),
      expFotTotal: gv(exp, 6),
      expFotMarshals: gv(exp, 7),
      expFotAdmins: gv(exp, 8),
      expFotMechanics: gv(exp, 9),
      expFotManagement: gv(exp, 10),
      expFotSales: gv(exp, 11),
      expFotBonusTeam: gv(exp, 12),
      expFotBonusMgmt: gv(exp, 13),
      expFotMarketer: gv(exp, 14),
      expFotTrainer: gv(exp, 15),
      expFotAccountant: gv(exp, 16),
      expFotPhotographer: gv(exp, 17),
      expFotDesigner: gv(exp, 18),

      clientsTotal: gv(cli, 2),
      clientsNew: gv(cli, 3),
      clientsNewPct: gv(cli, 4),
      racesWithEvents: gv(cli, 7),
      trackLoad: gv(cli, 8),
      incomingTraffic: gv(cli, 9),
      racesNoBooking: gv(cli, 10),
      leadsRaces: gv(cli, 13),
      leadsEvents: gv(cli, 14),
      leadsTrainings: gv(cli, 15),
      leadsConverted: gv(cli, 16),
    }
  })
}
