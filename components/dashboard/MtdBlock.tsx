'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import type { DashboardRow } from '@/lib/sheets'
import { formatRub, formatNum } from '@/lib/formatters'

interface Props {
  /** All rows from the Dashboard sheet (all months). */
  allData: DashboardRow[]
}

interface MonthEntry {
  key: string         // "2025-10"
  label: string       // "окт 2025"
  year: number
  month: number       // 0-indexed
  isCurrent: boolean
  revenue: number | null
  avgPerDay: number | null
  races: number | null
  clients: number | null
  daysIncluded: number
}

const MONTH_LABELS: Record<number, string> = {
  0: 'янв', 1: 'фев', 2: 'мар', 3: 'апр', 4: 'май', 5: 'июн',
  6: 'июл', 7: 'авг', 8: 'сен', 9: 'окт', 10: 'ноя', 11: 'дек',
}

function formatAvg(v: number | null): string {
  if (v === null) return '—'
  return Math.round(v).toLocaleString('ru') + ' ₽/д'
}

function buildMonthData(rows: DashboardRow[]): MonthEntry[] {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() // 0-indexed
  const currentDay = today.getDate()

  // Group all rows by year+month
  const groups = new Map<string, DashboardRow[]>()
  for (const r of rows) {
    if (!r.date) continue
    const [y, m] = r.date.split('-').map(Number)
    const key = `${y}-${String(m).padStart(2, '0')}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  const result: MonthEntry[] = []
  for (const key of Array.from(groups.keys())) {
    const allMonthRows = groups.get(key)!
    const [y, m] = key.split('-').map(Number)
    const monthIdx = m - 1 // 0-indexed
    const isCurrent = y === currentYear && monthIdx === currentMonth

    let activeRows: DashboardRow[]
    let avgDivisor: number

    if (isCurrent) {
      // MTD: only days 1..today
      activeRows = allMonthRows.filter((r) => {
        const day = parseInt(r.date.split('-')[2], 10)
        return day <= currentDay
      })
      avgDivisor = currentDay
    } else {
      // Past month: use ALL days
      activeRows = allMonthRows
      avgDivisor = new Date(y, m, 0).getDate() // daysInMonth
    }

    const rev = activeRows.reduce((s, r) => s + (r.revenue ?? 0), 0)
    const rac = activeRows.reduce((s, r) => s + (r.races ?? 0), 0)
    const cli = activeRows.reduce((s, r) => s + (r.clients ?? 0), 0)
    const hasData = activeRows.length > 0

    result.push({
      key,
      label: `${MONTH_LABELS[monthIdx]} ${y}`,
      year: y,
      month: monthIdx,
      isCurrent,
      revenue: hasData ? rev : null,
      avgPerDay: hasData && avgDivisor > 0 ? rev / avgDivisor : null,
      races: hasData ? rac : null,
      clients: hasData ? cli : null,
      daysIncluded: activeRows.length,
    })
  }

  // Sort chronologically, newest first
  return result.sort((a, b) => b.key.localeCompare(a.key))
}

function pctDiff(curr: number | null, prev: number | null): string | null {
  if (curr === null || prev === null || prev === 0) return null
  const p = ((curr - prev) / Math.abs(prev)) * 100
  return (p >= 0 ? '+' : '') + p.toFixed(1) + '%'
}

export default function MtdBlock({ allData }: Props) {
  const today = new Date()
  const currentDay = today.getDate()

  const months = buildMonthData(allData)

  if (months.length === 0) return null

  // Chart data (oldest → newest for left-to-right)
  const chartData = [...months].reverse().map((m) => ({
    label: m.label,
    revenue: m.revenue ?? 0,
    isCurrent: m.isCurrent,
    days: m.daysIncluded,
  }))

  return (
    <div
      className="mt-6"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        padding: 20,
      }}
    >
      <h2 className="font-semibold mb-1" style={{ color: '#f0f0ff', letterSpacing: '0.05em' }}>
        MTD — сравнение по месяцам
      </h2>
      <p className="text-xs mb-5" style={{ color: '#8888aa' }}>
        Текущий месяц: данные с 1-го по {currentDay}-е число. Прошлые месяцы: полная выручка.
      </p>

      {/* Table — max 5 rows visible, rest scrollable */}
      <div
        className="overflow-x-auto mb-1"
        style={{
          maxHeight: 260,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(124,58,237,0.5) transparent',
        }}
      >
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Месяц', 'Выручка', 'Ср. день', 'Заездов', 'Клиентов', 'vs пред. месяц'].map((h) => (
                <th
                  key={h}
                  className="text-left font-medium py-2 pr-6 uppercase"
                  style={{ color: '#8888aa', fontSize: 11, letterSpacing: '0.1em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => {
              const prev = months[i + 1] ?? null
              const diff = pctDiff(m.revenue, prev?.revenue ?? null)
              const diffUp = diff !== null && diff.startsWith('+')

              return (
                <tr
                  key={m.key}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: m.isCurrent ? 'rgba(124,58,237,0.15)' : 'transparent',
                    borderLeft: m.isCurrent ? '2px solid #7c3aed' : '2px solid transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { if (!m.isCurrent) (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = m.isCurrent ? 'rgba(124,58,237,0.15)' : 'transparent' }}
                >
                  <td className="py-2.5 pr-6 font-medium" style={{ color: m.isCurrent ? '#a855f7' : '#f0f0ff', paddingLeft: m.isCurrent ? 10 : 12 }}>
                    {m.label}
                    {m.isCurrent && <span className="ml-2 text-xs font-normal" style={{ color: '#8888aa' }}>текущий</span>}
                  </td>
                  <td className="py-2.5 pr-6" style={{ color: '#f0f0ff' }}>
                    {m.revenue !== null ? formatRub(m.revenue) : '—'}
                  </td>
                  <td className="py-2.5 pr-6" style={{ color: '#8888aa' }}>
                    {formatAvg(m.avgPerDay)}
                  </td>
                  <td className="py-2.5 pr-6" style={{ color: '#f0f0ff' }}>
                    {m.races !== null ? formatNum(m.races) : '—'}
                  </td>
                  <td className="py-2.5 pr-6" style={{ color: '#f0f0ff' }}>
                    {m.clients !== null ? formatNum(m.clients) : '—'}
                  </td>
                  <td className="py-2.5 pr-6 font-medium" style={{ color: diff === null ? '#8888aa' : diffUp ? '#22c55e' : '#ef4444' }}>
                    {diff === null ? '—' : `${diffUp ? '▲' : '▼'} ${diff.replace(/^[+-]/, '')}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* "More months" hint */}
      {months.length > 5 && (
        <p className="text-xs mb-5" style={{ color: '#8888aa' }}>
          ↓ ещё {months.length - 5} {months.length - 5 === 1 ? 'месяц' : months.length - 5 < 5 ? 'месяца' : 'месяцев'}
        </p>
      )}
      {months.length <= 5 && <div className="mb-5" />}

      {/* Bar chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#8888aa', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8888aa', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={55}
              tickFormatter={(v) =>
                v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'М' :
                v >= 1_000 ? (v / 1_000).toFixed(0) + 'К' : v
              }
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(13,13,26,0.95)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 10,
              }}
              labelStyle={{ color: '#8888aa', fontSize: 12 }}
              formatter={(value: number, _: string, entry) => [
                `${formatRub(value)} (${(entry.payload as { days: number }).days} дн.)`,
                'Выручка',
              ]}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.isCurrent ? '#a855f7' : '#7c3aed'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
