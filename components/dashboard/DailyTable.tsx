'use client'

import type { DashboardRow } from '@/lib/sheets'
import { formatRub, formatNum, formatDateWithDay } from '@/lib/formatters'

interface Props { data: DashboardRow[] }

function rubCell(v: number | null | undefined) {
  return v === null || v === undefined ? '—' : formatRub(v)
}
function numCell(v: number | null | undefined) {
  return v === null || v === undefined ? '—' : formatNum(v)
}

function dodBadge(curr: number | null | undefined, prev: number | null | undefined) {
  if (curr == null || prev == null || prev === 0) return null
  const pct = ((curr - prev) / prev) * 100
  const up = pct >= 0
  return (
    <span style={{ fontSize: 12, color: up ? '#22c55e' : '#ef4444', marginLeft: 6, whiteSpace: 'nowrap' }}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

export default function DailyTable({ data }: Props) {
  // Sort descending so most recent date is at the top.
  const rows = data
    .filter((r) => Boolean(r.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Build a lookup by date for previous-day access (rows are desc, so prev = rows[i+1])
  const headers = ['Дата', 'Выручка общая', 'vs вчера', 'Заезды ₽', 'Заездов', 'Клиентов', 'Новых']

  return (
    <div
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
      <h2
        className="font-semibold mb-4"
        style={{ color: '#f0f0ff', letterSpacing: '0.05em' }}
      >
        Все дни месяца{rows.length > 0 ? ` (${rows.length})` : ''}
      </h2>

      <div
        className="overflow-x-auto"
        style={{
          maxHeight: 400,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#3a2a5a #080810',
        }}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10" style={{ background: 'rgba(8,8,16,0.9)' }}>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left font-medium py-2 pr-4 whitespace-nowrap uppercase"
                  style={{ color: '#8888aa', fontSize: 11, letterSpacing: '0.1em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const prev = rows[i + 1] ?? null
              const revChange = prev
                ? ((r.revenue ?? 0) - (prev.revenue ?? 0)) / Math.abs(prev.revenue ?? 0) * 100
                : null
              const revUp = revChange !== null && revChange >= 0

              return (
                <tr
                  key={r.date}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <td className="py-2 pr-4 whitespace-nowrap" style={{ color: '#8888aa' }}>
                    {formatDateWithDay(r.date)}
                  </td>
                  <td className="py-2 pr-4 font-medium whitespace-nowrap" style={{ color: '#f0f0ff' }}>
                    {rubCell(r.revenue)}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap font-medium">
                    {revChange === null || prev?.revenue == null || prev.revenue === 0
                      ? <span style={{ color: '#8888aa' }}>—</span>
                      : <span style={{ color: revUp ? '#22c55e' : '#ef4444' }}>
                          {revUp ? '▲' : '▼'} {Math.abs(revChange).toFixed(1)}%
                        </span>
                    }
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap" style={{ color: '#f0f0ff' }}>
                    {rubCell(r.revenueRaces)}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap" style={{ color: '#f0f0ff' }}>
                    {numCell(r.races)}
                    {dodBadge(r.races, prev?.races)}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap" style={{ color: '#f0f0ff' }}>
                    {numCell(r.clients)}
                    {dodBadge(r.clients, prev?.clients)}
                  </td>
                  <td className="py-2 pr-4" style={{ color: '#22c55e' }}>{numCell(r.newClients)}</td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center" style={{ color: '#8888aa' }}>
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
