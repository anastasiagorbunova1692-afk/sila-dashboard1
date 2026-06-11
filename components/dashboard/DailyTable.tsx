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

export default function DailyTable({ data }: Props) {
  // Data is already filtered to current month by the page.
  // Sort descending so most recent date is at the top.
  const rows = data
    .filter((r) => Boolean(r.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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
              {['Дата', 'Выручка общая', 'Заезды ₽', 'Заездов', 'Клиентов', 'Новых'].map((h) => (
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
            {rows.map((r) => (
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
                <td className="py-2 pr-4 whitespace-nowrap" style={{ color: '#f0f0ff' }}>
                  {rubCell(r.revenueRaces)}
                </td>
                <td className="py-2 pr-4" style={{ color: '#f0f0ff' }}>{numCell(r.races)}</td>
                <td className="py-2 pr-4" style={{ color: '#f0f0ff' }}>{numCell(r.clients)}</td>
                <td className="py-2 pr-4" style={{ color: '#22c55e' }}>{numCell(r.newClients)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center" style={{ color: '#8888aa' }}>
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
