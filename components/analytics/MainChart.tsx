'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { MonthlyData } from '@/lib/sheets'
import { formatRub, formatNum, formatPct } from '@/lib/formatters'

interface Props { data: MonthlyData[] }

const METRICS = [
  { key: 'revenue', label: 'Выручка', fmt: formatRub },
  { key: 'ebitda', label: 'EBITDA', fmt: formatRub },
  { key: 'expenses', label: 'Расходы', fmt: formatRub },
  { key: 'clientsTotal', label: 'Клиенты', fmt: formatNum },
  { key: 'racesCount', label: 'Заезды', fmt: formatNum },
] as const

export default function MainChart({ data }: Props) {
  const [active, setActive] = useState<string>('revenue')
  const metric = METRICS.find((m) => m.key === active)!

  const chartData = data.map((d) => ({
    month: d.month,
    value: (d as unknown as Record<string, unknown>)[active] as number ?? null,
  }))

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-[#f5f5f5] font-semibold">Динамика по месяцам</h2>
        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border
                ${active === m.key
                  ? 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/40'
                  : 'text-[#737373] border-[#1f1f1f] hover:text-[#f5f5f5] hover:bg-[#1a1a1a]'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#737373', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={55}
              tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'М' : v >= 1000 ? (v / 1000).toFixed(0) + 'К' : v}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #1f1f1f', borderRadius: 8 }}
              labelStyle={{ color: '#737373', fontSize: 12 }}
              formatter={(v: number) => [metric.fmt(v), metric.label]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
