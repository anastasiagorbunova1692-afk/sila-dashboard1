'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { MonthlyData } from '@/lib/sheets'
import { formatRub, formatNum } from '@/lib/formatters'

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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold" style={{ color: '#f0f0ff', letterSpacing: '0.05em' }}>
          Динамика по месяцам
        </h2>
        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
              style={active === m.key ? {
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: 'white',
                border: '1px solid transparent',
              } : {
                background: 'rgba(255,255,255,0.05)',
                color: '#8888aa',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={e => { if (active !== m.key) (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.15)' }}
              onMouseLeave={e => { if (active !== m.key) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#8888aa', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={55}
              tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'М' : v >= 1000 ? (v / 1000).toFixed(0) + 'К' : v}
            />
            <Tooltip
              contentStyle={{ background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10 }}
              labelStyle={{ color: '#8888aa', fontSize: 12 }}
              formatter={(v: number) => [metric.fmt(v), metric.label]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ fill: '#7c3aed', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#a855f7' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
