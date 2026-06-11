'use client'

import type { DashboardRow } from '@/lib/sheets'
import { formatRub, formatNum, formatDateWithDay } from '@/lib/formatters'

interface Props { data: DashboardRow[] }

// Show '—' only for null/undefined; show actual number (including 0) otherwise
function rubCell(v: number | null | undefined) {
  return v === null || v === undefined ? '—' : formatRub(v)
}
function numCell(v: number | null | undefined) {
  return v === null || v === undefined ? '—' : formatNum(v)
}

export default function DailyTable({ data }: Props) {
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  // Filter to rows that have at least one real value and are not future dates
  const rows = data
    .filter((r) => {
      if (!r.date) return false
      const d = new Date(r.date)
      if (d > now) return false
      return (
        r.revenue !== null ||
        r.revenueRaces !== null ||
        r.races !== null ||
        r.clients !== null
      )
    })
    // Descending: most recent first
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
      <h2 className="text-[#f5f5f5] font-semibold mb-4">
        Все дни месяца{rows.length > 0 ? ` (${rows.length})` : ''}
      </h2>

      {/* Scrollable container — max-height shows ~10 rows */}
      <div
        className="overflow-x-auto"
        style={{
          maxHeight: 400,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#2a2a2a #0a0a0a',
        }}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[#141414]">
            <tr className="border-b border-[#1f1f1f]">
              {['Дата', 'Выручка общая', 'Заезды ₽', 'Заездов', 'Клиентов', 'Новых'].map((h) => (
                <th
                  key={h}
                  className="text-left text-[#737373] font-medium py-2 pr-4 whitespace-nowrap"
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
                className="border-b border-[#1f1f1f]/50 hover:bg-[#1a1a1a] transition-colors"
              >
                <td className="py-2 pr-4 text-[#737373] whitespace-nowrap">
                  {formatDateWithDay(r.date)}
                </td>
                <td className="py-2 pr-4 text-[#f5f5f5] font-medium whitespace-nowrap">
                  {rubCell(r.revenue)}
                </td>
                <td className="py-2 pr-4 text-[#f5f5f5] whitespace-nowrap">
                  {rubCell(r.revenueRaces)}
                </td>
                <td className="py-2 pr-4 text-[#f5f5f5]">{numCell(r.races)}</td>
                <td className="py-2 pr-4 text-[#f5f5f5]">{numCell(r.clients)}</td>
                <td className="py-2 pr-4 text-[#22c55e]">{numCell(r.newClients)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#737373]">
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
