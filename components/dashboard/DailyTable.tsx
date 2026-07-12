'use client'

import { useState } from 'react'
import type { DashboardRow } from '@/lib/sheets'
import { formatRub, formatNum, formatDateWithDay } from '@/lib/formatters'

interface Props { data: DashboardRow[] }

function rubCell(v: number | null | undefined) {
  return v === null || v === undefined ? '—' : formatRub(v)
}
function numCell(v: number | null | undefined) {
  return v === null || v === undefined ? '—' : formatNum(v)
}

export default function DailyTable({ data }: Props) {
  const [showAll, setShowAll] = useState(false)

  const rows = data
    .filter((r) => Boolean(r.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const TRACK_CAPACITY = 180
  function loadPct(races: number | null | undefined): number | null {
    if (races == null || races === 0) return null
    return parseFloat((races / TRACK_CAPACITY * 100).toFixed(1))
  }
  function loadColor(pct: number): string {
    return pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'
  }

  // Mobile: show only key columns. Desktop: show all.
  // We render one table but show/hide columns via a CSS approach using a data attribute.
  const mobileHeaders = ['Дата', 'Выручка', 'Загрузка']
  const desktopExtra = ['vs вчера', 'Заезды ₽', 'Заездов', 'Клиентов', 'Новых']

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold" style={{ color: '#f0f0ff', letterSpacing: '0.05em' }}>
          Все дни месяца{rows.length > 0 ? ` (${rows.length})` : ''}
        </h2>
        {/* Toggle to expand all columns on mobile */}
        <button
          className="md:hidden text-xs px-3 py-1.5 rounded-lg"
          style={{ color: '#a855f7', border: '1px solid rgba(124,58,237,0.3)', background: 'transparent', minHeight: 36 }}
          onClick={() => setShowAll(v => !v)}
        >
          {showAll ? 'Свернуть' : 'Все столбцы'}
        </button>
      </div>

      <div
        className="overflow-x-auto"
        style={{
          maxHeight: 400,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#3a2a5a #080810',
        }}
      >
        <table className="w-full" style={{ fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
          <thead className="sticky top-0 z-10" style={{ background: 'rgba(8,8,16,0.9)' }}>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Always-visible headers */}
              {mobileHeaders.map(h => (
                <th key={h} className="text-left font-medium py-2 pr-3 whitespace-nowrap uppercase" style={{ color: '#8888aa', fontSize: 10, letterSpacing: '0.08em' }}>{h}</th>
              ))}
              {/* Desktop-only or expanded headers */}
              {desktopExtra.map(h => (
                <th key={h} className={`text-left font-medium py-2 pr-3 whitespace-nowrap uppercase ${showAll ? '' : 'hidden md:table-cell'}`} style={{ color: '#8888aa', fontSize: 10, letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const prev = rows[i + 1] ?? null
              const d = new Date(r.date)
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              const revChange = prev && prev.revenue
                ? ((r.revenue ?? 0) - (prev.revenue ?? 0)) / Math.abs(prev.revenue) * 100
                : null
              const revUp = revChange !== null && revChange >= 0
              const p = loadPct(r.races)

              return (
                <tr
                  key={r.date}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isWeekend ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)'}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isWeekend ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                >
                  {/* Дата */}
                  <td className="py-2 pr-3 whitespace-nowrap" style={{ color: '#8888aa' }}>
                    {formatDateWithDay(r.date)}
                  </td>
                  {/* Выручка */}
                  <td className="py-2 pr-3 font-medium whitespace-nowrap" style={{ color: '#f0f0ff' }}>
                    {rubCell(r.revenue)}
                  </td>
                  {/* Загрузка */}
                  <td className="py-2 pr-3 whitespace-nowrap font-medium">
                    {p === null
                      ? <span style={{ color: '#8888aa' }}>—</span>
                      : <span style={{ color: loadColor(p) }}>{p}%</span>}
                  </td>
                  {/* vs вчера */}
                  <td className={`py-2 pr-3 whitespace-nowrap font-medium ${showAll ? '' : 'hidden md:table-cell'}`}>
                    {revChange === null || prev?.revenue == null || prev.revenue === 0
                      ? <span style={{ color: '#8888aa' }}>—</span>
                      : <span style={{ color: revUp ? '#22c55e' : '#ef4444' }}>
                          {revUp ? '▲' : '▼'} {Math.abs(revChange).toFixed(1)}%
                        </span>}
                  </td>
                  {/* Заезды ₽ */}
                  <td className={`py-2 pr-3 whitespace-nowrap ${showAll ? '' : 'hidden md:table-cell'}`} style={{ color: '#f0f0ff' }}>
                    {rubCell(r.revenueRaces)}
                  </td>
                  {/* Заездов */}
                  <td className={`py-2 pr-3 whitespace-nowrap ${showAll ? '' : 'hidden md:table-cell'}`} style={{ color: '#f0f0ff' }}>
                    {numCell(r.races)}
                  </td>
                  {/* Клиентов */}
                  <td className={`py-2 pr-3 whitespace-nowrap ${showAll ? '' : 'hidden md:table-cell'}`} style={{ color: '#f0f0ff' }}>
                    {numCell(r.clients)}
                  </td>
                  {/* Новых */}
                  <td className={`py-2 pr-3 ${showAll ? '' : 'hidden md:table-cell'}`} style={{ color: '#22c55e' }}>
                    {numCell(r.newClients)}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center" style={{ color: '#8888aa' }}>
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
