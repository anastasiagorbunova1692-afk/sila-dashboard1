'use client'

import type { MonthlyData } from '@/lib/sheets'
import { formatRub, formatNum, formatPct, formatRubShort } from '@/lib/formatters'

interface Props { data: MonthlyData[] }

export default function SummaryTable({ data }: Props) {
  const lastMonth = data.length > 0 ? data[data.length - 1].month : null

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
      <h2 className="text-[#f5f5f5] font-semibold mb-4">Сводная таблица</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#1f1f1f]">
              {['Месяц', 'Выручка', 'EBITDA', 'Маржа%', 'Расходы', 'Клиентов', 'Новых', 'Заездов', 'Остаток'].map((h) => (
                <th key={h} className="text-left text-[#737373] font-medium pb-2 pr-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const isLast = d.month === lastMonth
              return (
                <tr
                  key={d.month}
                  className={`border-b border-[#1f1f1f]/50 transition-colors
                    ${isLast ? 'bg-[#22c55e]/5' : 'hover:bg-[#1a1a1a]'}`}
                >
                  <td className={`py-2 pr-5 font-medium ${isLast ? 'text-[#22c55e]' : 'text-[#f5f5f5]'}`}>{d.month}</td>
                  <td className="py-2 pr-5 text-[#f5f5f5]">{formatRubShort(d.revenue)}</td>
                  <td className="py-2 pr-5 text-[#f5f5f5]">{formatRubShort(d.ebitda)}</td>
                  <td className="py-2 pr-5 text-[#f5f5f5]">{formatPct(d.ebitdaMargin)}</td>
                  <td className="py-2 pr-5 text-[#f5f5f5]">{formatRubShort(d.expenses)}</td>
                  <td className="py-2 pr-5 text-[#f5f5f5]">{formatNum(d.clientsTotal)}</td>
                  <td className="py-2 pr-5 text-[#22c55e]">{formatNum(d.clientsNew)}</td>
                  <td className="py-2 pr-5 text-[#f5f5f5]">{formatNum(d.racesCount)}</td>
                  <td className="py-2 pr-5 text-[#f5f5f5]">{formatRubShort(d.balanceTotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
