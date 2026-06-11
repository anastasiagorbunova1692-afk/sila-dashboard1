'use client'

import type { MonthlyData } from '@/lib/sheets'
import { formatRubShort, formatNum, formatPct } from '@/lib/formatters'

interface Props { data: MonthlyData[] }

export default function SummaryTable({ data }: Props) {
  const lastMonth = data.length > 0 ? data[data.length - 1].month : null

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
      <h2 className="font-semibold mb-4" style={{ color: '#f0f0ff', letterSpacing: '0.05em' }}>
        Сводная таблица
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Месяц', 'Выручка', 'EBITDA', 'Маржа%', 'Расходы', 'Клиентов', 'Новых', 'Заездов', 'Остаток'].map((h) => (
                <th
                  key={h}
                  className="text-left font-medium pb-2 pr-5 uppercase"
                  style={{ color: '#8888aa', fontSize: 11, letterSpacing: '0.1em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const isLast = d.month === lastMonth
              return (
                <tr
                  key={d.month}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: isLast ? 'rgba(124,58,237,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isLast) (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isLast ? 'rgba(124,58,237,0.08)' : 'transparent' }}
                >
                  <td className="py-2 pr-5 font-medium" style={{ color: isLast ? '#a855f7' : '#f0f0ff' }}>{d.month}</td>
                  <td className="py-2 pr-5" style={{ color: '#f0f0ff' }}>{formatRubShort(d.revenue)}</td>
                  <td className="py-2 pr-5" style={{ color: '#f0f0ff' }}>{formatRubShort(d.ebitda)}</td>
                  <td className="py-2 pr-5" style={{ color: '#f0f0ff' }}>{formatPct(d.ebitdaMargin)}</td>
                  <td className="py-2 pr-5" style={{ color: '#f0f0ff' }}>{formatRubShort(d.expenses)}</td>
                  <td className="py-2 pr-5" style={{ color: '#f0f0ff' }}>{formatNum(d.clientsTotal)}</td>
                  <td className="py-2 pr-5" style={{ color: '#22c55e' }}>{formatNum(d.clientsNew)}</td>
                  <td className="py-2 pr-5" style={{ color: '#f0f0ff' }}>{formatNum(d.racesCount)}</td>
                  <td className="py-2 pr-5" style={{ color: '#f0f0ff' }}>{formatRubShort(d.balanceTotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
