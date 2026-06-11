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

const MONTH_PATTERN = /^(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)\.\d{2}$/i

function cellToMonthLabel(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim().toLowerCase()
  return MONTH_PATTERN.test(s) ? s : null
}

interface SheetParsed {
  monthColumns: Record<string, number>  // normalised label → column index
  metricRows: Record<string, unknown[]> // lower-cased label → full cell array
  months: string[]                      // ordered list of detected month keys
}

// Parse a "vertical" analytics sheet where:
//   rows[0] = header row containing month names in data cells (not in table.cols)
//   rows[1..N] = metric rows, column 0 = metric label
async function parseVerticalSheet(sheetName: string): Promise<SheetParsed | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) return null
  const text = await res.text()
  const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '')
  const data = JSON.parse(jsonStr)
  const rawRows: { c: Array<{ v: unknown } | null> }[] = data.table?.rows ?? []
  if (rawRows.length === 0) return null

  // rows[0] holds month identifiers in cells — either Excel serial dates or strings
  const headerCells = rawRows[0].c ?? []
  const monthColumns: Record<string, number> = {}
  headerCells.forEach((cell, idx) => {
    const label = cellToMonthLabel(cell?.v)
    if (label) monthColumns[label] = idx
  })

  // rows[1..N] are metric rows
  const metricRows: Record<string, unknown[]> = {}
  for (let i = 1; i < rawRows.length; i++) {
    const cells = rawRows[i].c ?? []
    const vals = cells.map((c) => (c ? c.v : null))
    const label = vals[0] != null ? String(vals[0]).trim().toLowerCase() : ''
    if (label) metricRows[label] = vals
  }

  return { monthColumns, metricRows, months: Object.keys(monthColumns) }
}

// Find a metric row whose label includes all given keywords (case-insensitive).
function findMetric(metricRows: Record<string, unknown[]>, ...keywords: string[]): unknown[] | null {
  for (const [label, row] of Object.entries(metricRows)) {
    if (keywords.every((kw) => label.includes(kw.toLowerCase()))) return row
  }
  return null
}

// Extract a numeric value at the month column.
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
    parseVerticalSheet('DB_Finance'),
    parseVerticalSheet('DB_Products'),
    parseVerticalSheet('DB_Expenses'),
    parseVerticalSheet('DB_Clients'),
  ])

  const fin  = finRes.status  === 'fulfilled' ? finRes.value  : null
  const prod = prodRes.status === 'fulfilled' ? prodRes.value : null
  const exp  = expRes.status  === 'fulfilled' ? expRes.value  : null
  const cli  = cliRes.status  === 'fulfilled' ? cliRes.value  : null

  if (!fin) return []

  const finCols  = fin.monthColumns
  const prodCols = prod?.monthColumns ?? {}
  const expCols  = exp?.monthColumns  ?? {}
  const cliCols  = cli?.monthColumns  ?? {}

  const finRows  = fin.metricRows
  const prodRows = prod?.metricRows ?? {}
  const expRows  = exp?.metricRows  ?? {}
  const cliRows  = cli?.metricRows  ?? {}

  // DB_Finance
  const finRevenue      = findMetric(finRows, 'выручка', 'руб')
  const finExpenses     = findMetric(finRows, 'расходы общие')
  const finOpExpenses   = findMetric(finRows, 'операционные расходы')
  const finEbitda       = findMetric(finRows, 'ebitda', 'руб')
  const finEbitdaMgn    = findMetric(finRows, 'маржа', 'ebitda')
  const finBalTotal     = findMetric(finRows, 'остаток на счетах общий')
  const finBalAlfa      = findMetric(finRows, 'альфа')
  const finBalSafe      = findMetric(finRows, 'сейф')
  const finBalYankevich = findMetric(finRows, 'янкевич')
  const finBalGorbunova = findMetric(finRows, 'горбунова')
  const finBalZhirnov   = findMetric(finRows, 'жирнов')

  // DB_Products
  const prodRacesTotal    = findMetric(prodRows, 'заезды сумма общая')
  const prodMorning       = findMetric(prodRows, 'утренние будни')
  const prodBaseWeekday   = findMetric(prodRows, 'базовые будни')
  const prodRepeatWeekday = findMetric(prodRows, 'повторные будни')
  const prodBaseWeekend   = findMetric(prodRows, 'базовые выходные')
  const prodRepeatWeekend = findMetric(prodRows, 'повторные выходные')
  const prodClub          = findMetric(prodRows, 'клуб')
  const prodPromo         = findMetric(prodRows, 'акци')
  const prodTimeAttack    = findMetric(prodRows, 'timeattack')
  const prodCerts         = findMetric(prodRows, 'сертификат')
  const prodRacesCount    = findMetric(prodRows, 'заезды количество')

  // DB_Expenses
  const expTotal      = findMetric(expRows, 'расходы общие')
  const expOp         = findMetric(expRows, 'операционные расходы')
  const expFotTotal   = findMetric(expRows, 'фот итого')
  const expMarshals   = findMetric(expRows, 'маршал')
  const expAdmins     = findMetric(expRows, 'администратор')
  const expMechanics  = findMetric(expRows, 'механик')
  const expMgmt       = findMetric(expRows, 'управление')
  const expSales      = findMetric(expRows, 'отдел продаж')
  const expBonusTeam  = findMetric(expRows, 'бонусы команда')
  const expBonusMgmt  = findMetric(expRows, 'бонусы управление')
  const expMarketer   = findMetric(expRows, 'маркетолог')
  const expTrainer    = findMetric(expRows, 'тренер')
  const expAccountant = findMetric(expRows, 'бухгалтер')
  const expPhoto      = findMetric(expRows, 'фотограф')
  const expDesigner   = findMetric(expRows, 'дизайнер')

  // DB_Clients
  const cliTotal       = findMetric(cliRows, 'кол-во клиентов всего')
  const cliNew         = findMetric(cliRows, 'новых клиентов')
  const cliNewPct      = findMetric(cliRows, 'доля новых')
  const cliRacesEvents = findMetric(cliRows, 'заездов всего с мероприятиями')
  const cliTrackLoad   = findMetric(cliRows, 'загрузка картодрома')
  const cliIncoming    = findMetric(cliRows, 'входящий трафик')
  const cliNoBooking   = findMetric(cliRows, 'без записи')
  const cliLeadsRaces  = findMetric(cliRows, 'заявок на заезды общее')
  const cliLeadsEvents = findMetric(cliRows, 'заявок на мероприятия')
  const cliLeadsTrain  = findMetric(cliRows, 'заявок на тренировки')
  const cliConverted   = findMetric(cliRows, 'записавшихся из входящего')

  // Use months detected from DB_Finance, sorted chronologically
  const months = fin.months.sort()

  return months.map((month) => ({
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
}
