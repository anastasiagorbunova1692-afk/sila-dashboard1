'use client'

import type { DashboardRow } from '@/lib/sheets'
import { formatRub, formatNum, formatDate } from '@/lib/formatters'

interface Props { data: DashboardRow[] }

export default function DailyTable({ data }: Props) {
  const rows = [...data].reverse().slice(0, 10)

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
      <h2 className="text-[#f5f5f5] font-semibold mb-4">Последние 10 дней</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f1f1f]">
              {['Дата', 'Выручка общая', 'Заезды', 'Клиентов', 'Новых'].map((h) => (
                <th key={h} className="text-left text-[#737373] font-medium pb-2 pr-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className="border-b border-[#1f1f1f]/50 hover:bg-[#1a1a1a] transition-colors">
                <td className="py-2 pr-4 text-[#737373]">{formatDate(r.date)}</td>
                <td className="py-2 pr-4 text-[#f5f5f5] font-medium">{formatRub(r.revenue)}</td>
                <td className="py-2 pr-4 text-[#f5f5f5]">{formatNum(r.races)}</td>
                <td className="py-2 pr-4 text-[#f5f5f5]">{formatNum(r.clients)}</td>
                <td className="py-2 pr-4 text-[#22c55e]">{formatNum(r.newClients)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#737373]">Нет данных</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
