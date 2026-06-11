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

// ── Analytics helpers ────────────────────────────────────────────────────────

// Month pattern: matches "окт.25", "ноя.25", "март.26", etc.
const MONTH_PATTERN = /^(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)\.?\s*\d{2}$/i

// Scan header row and return { 'окт.25': 9, 'ноя.25': 10, ... }
// Normalises cell values so "Окт.25", "окт.25", "окт 25" all match.
function detectMonthColumns(headerRow: unknown[]): Record<string, number> {
  const cols: Record<string, number> = {}
  headerRow.forEach((cell, idx) => {
    const raw = cell === null || cell === undefined ? '' : String(cell).trim()
    // Normalise: lowercase, collapse spaces, ensure single dot before year
    const norm = raw.toLowerCase().replace(/\s+/g, '.').replace(/\.+/g, '.')
    if (MONTH_PATTERN.test(norm)) {
      cols[norm] = idx
    }
  })
  return cols
}

// Find the row whose column-0 label contains all of the given keywords (case-insensitive).
function findRow(rows: unknown[][], ...keywords: string[]): unknown[] | null {
  for (const row of rows) {
    const label = row[0] === null || row[0] === undefined ? '' : String(row[0]).toLowerCase()
    if (keywords.every((kw) => label.includes(kw.toLowerCase()))) return row
  }
  return null
}

// Extract a value from `row` at the column for `month`.
function pick(row: unknown[] | null, month: string, cols: Record<string, number>): number | null {
  if (!row) return null
  const col = cols[month]
  if (col === undefined) return null
  return parseSheetsValue(row[col])
}

// ── Dashboard ────────────────────────────────────────────────────────────────

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

  // ── Debug logs (visible in browser console) ──
  console.log('[analytics] DB_Finance rows:', fin.length)
  console.log('[analytics] DB_Finance header:', JSON.stringify(fin[0]))
  console.log('[analytics] DB_Finance row[2]:', JSON.stringify(fin[2]))
  console.log('[analytics] DB_Finance row[5]:', JSON.stringify(fin[5]))

  // Detect month columns by regex pattern in the header row
  const finCols  = fin.length  ? detectMonthColumns(fin[0]  as unknown[]) : {}
  const prodCols = prod.length ? detectMonthColumns(prod[0] as unknown[]) : {}
  const expCols  = exp.length  ? detectMonthColumns(exp[0]  as unknown[]) : {}
  const cliCols  = cli.length  ? detectMonthColumns(cli[0]  as unknown[]) : {}

  console.log('[analytics] Detected finCols:', JSON.stringify(finCols))
  console.log('[analytics] Detected prodCols:', JSON.stringify(prodCols))

  // Find metric rows by label (column 0) — robust against row-index drift
  // DB_Finance
  const finRevenue      = findRow(fin, 'выручка', 'руб')
  const finExpenses     = findRow(fin, 'расходы общие')
  const finOpExpenses   = findRow(fin, 'операционные расходы')
  const finEbitda       = findRow(fin, 'ebitda', 'руб')
  const finEbitdaMgn    = findRow(fin, 'маржа', 'ebitda')
  const finBalTotal     = findRow(fin, 'остаток на счетах общий')
  const finBalAlfa      = findRow(fin, 'альфа')
  const finBalSafe      = findRow(fin, 'сейф')
  const finBalYankevich = findRow(fin, 'янкевич')
  const finBalGorbunova = findRow(fin, 'горбунова')
  const finBalZhirnov   = findRow(fin, 'жирнов')

  console.log('[analytics] finRevenue row:', JSON.stringify(finRevenue))
  console.log('[analytics] finEbitda row:', JSON.stringify(finEbitda))

  // DB_Products
  const prodRacesTotal    = findRow(prod, 'заезды сумма общая')
  const prodMorning       = findRow(prod, 'утренние будни')
  const prodBaseWeekday   = findRow(prod, 'базовые будни')
  const prodRepeatWeekday = findRow(prod, 'повторные будни')
  const prodBaseWeekend   = findRow(prod, 'базовые выходные')
  const prodRepeatWeekend = findRow(prod, 'повторные выходные')
  const prodClub          = findRow(prod, 'клуб')
  const prodPromo         = findRow(prod, 'акци')
  const prodTimeAttack    = findRow(prod, 'timeattack')
  const prodCerts         = findRow(prod, 'сертификат')
  const prodRacesCount    = findRow(prod, 'заезды количество')

  // DB_Expenses
  const expTotal     = findRow(exp, 'расходы общие')
  const expOp        = findRow(exp, 'операционные расходы')
  const expFotTotal  = findRow(exp, 'фот итого')
  const expMarshals  = findRow(exp, 'маршал')
  const expAdmins    = findRow(exp, 'администратор')
  const expMechanics = findRow(exp, 'механик')
  const expMgmt      = findRow(exp, 'управление')
  const expSales     = findRow(exp, 'отдел продаж')
  const expBonusTeam = findRow(exp, 'бонусы команда')
  const expBonusMgmt = findRow(exp, 'бонусы управление')
  const expMarketer  = findRow(exp, 'маркетолог')
  const expTrainer   = findRow(exp, 'тренер')
  const expAccountant= findRow(exp, 'бухгалтер')
  const expPhoto     = findRow(exp, 'фотограф')
  const expDesigner  = findRow(exp, 'дизайнер')

  // DB_Clients
  const cliTotal       = findRow(cli, 'кол-во клиентов всего')
  const cliNew         = findRow(cli, 'новых клиентов')
  const cliNewPct      = findRow(cli, 'доля новых')
  const cliRacesEvents = findRow(cli, 'заездов всего с мероприятиями')
  const cliTrackLoad   = findRow(cli, 'загрузка картодрома')
  const cliIncoming    = findRow(cli, 'входящий трафик')
  const cliNoBooking   = findRow(cli, 'без записи')
  const cliLeadsRaces  = findRow(cli, 'заявок на заезды общее')
  const cliLeadsEvents = findRow(cli, 'заявок на мероприятия')
  const cliLeadsTrain  = findRow(cli, 'заявок на тренировки')
  const cliConverted   = findRow(cli, 'записавшихся из входящего')

  // The canonical month order for output — derived from what the sheet actually has
  const ORDERED_MONTHS = ['окт.25', 'ноя.25', 'дек.25', 'янв.26', 'фев.26', 'март.26', 'апр.26', 'май.26']

  // Build output — only include months that were actually detected in DB_Finance
  const result = ORDERED_MONTHS
    .filter((m) => m in finCols)
    .map((month) => ({
      month,
      revenue:         pick(finRevenue,      month, finCols),
      expenses:        pick(finExpenses,      month, finCols),
      opExpenses:      pick(finOpExpenses,    month, finCols),
      ebitda:          pick(finEbitda,        month, finCols),
      ebitdaMargin:    pick(finEbitdaMgn,     month, finCols),
      balanceTotal:    pick(finBalTotal,      month, finCols),
      balanceAlfa:     pick(finBalAlfa,       month, finCols),
      balanceSafe:     pick(finBalSafe,       month, finCols),
      balanceYankevich:pick(finBalYankevich,  month, finCols),
      balanceGorbunova:pick(finBalGorbunova,  month, finCols),
      balanceZhirnov:  pick(finBalZhirnov,    month, finCols),

      racesRevTotal:         pick(prodRacesTotal,    month, prodCols),
      racesRevMorning:       pick(prodMorning,        month, prodCols),
      racesRevBaseWeekday:   pick(prodBaseWeekday,    month, prodCols),
      racesRevRepeatWeekday: pick(prodRepeatWeekday,  month, prodCols),
      racesRevBaseWeekend:   pick(prodBaseWeekend,    month, prodCols),
      racesRevRepeatWeekend: pick(prodRepeatWeekend,  month, prodCols),
      racesRevClub:          pick(prodClub,           month, prodCols),
      racesRevPromo:         pick(prodPromo,          month, prodCols),
      racesRevTimeAttack:    pick(prodTimeAttack,      month, prodCols),
      racesRevCerts:         pick(prodCerts,           month, prodCols),
      racesCount:            pick(prodRacesCount,      month, prodCols),

      expTotal:         pick(expTotal,      month, expCols),
      expOp:            pick(expOp,         month, expCols),
      expFotTotal:      pick(expFotTotal,   month, expCols),
      expFotMarshals:   pick(expMarshals,   month, expCols),
      expFotAdmins:     pick(expAdmins,     month, expCols),
      expFotMechanics:  pick(expMechanics,  month, expCols),
      expFotManagement: pick(expMgmt,       month, expCols),
      expFotSales:      pick(expSales,      month, expCols),
      expFotBonusTeam:  pick(expBonusTeam,  month, expCols),
      expFotBonusMgmt:  pick(expBonusMgmt,  month, expCols),
      expFotMarketer:   pick(expMarketer,   month, expCols),
      expFotTrainer:    pick(expTrainer,    month, expCols),
      expFotAccountant: pick(expAccountant, month, expCols),
      expFotPhotographer:pick(expPhoto,     month, expCols),
      expFotDesigner:   pick(expDesigner,   month, expCols),

      clientsTotal:    pick(cliTotal,       month, cliCols),
      clientsNew:      pick(cliNew,         month, cliCols),
      clientsNewPct:   pick(cliNewPct,      month, cliCols),
      racesWithEvents: pick(cliRacesEvents, month, cliCols),
      trackLoad:       pick(cliTrackLoad,   month, cliCols),
      incomingTraffic: pick(cliIncoming,    month, cliCols),
      racesNoBooking:  pick(cliNoBooking,   month, cliCols),
      leadsRaces:      pick(cliLeadsRaces,  month, cliCols),
      leadsEvents:     pick(cliLeadsEvents, month, cliCols),
      leadsTrainings:  pick(cliLeadsTrain,  month, cliCols),
      leadsConverted:  pick(cliConverted,   month, cliCols),
    }))

  console.log('[analytics] Final data sample:', JSON.stringify(result[0]))
  return result
}
