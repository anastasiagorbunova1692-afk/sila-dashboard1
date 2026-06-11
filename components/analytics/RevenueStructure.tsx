'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import type { MonthlyData } from '@/lib/sheets'
import Accordion from './Accordion'
import { formatRub } from '@/lib/formatters'

interface Props { data: MonthlyData[] }

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span style={{ color: '#f0f0ff' }}>{label}</span>
        <span style={{ color: '#8888aa' }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7)', borderRadius: 999 }}
        />
      </div>
    </div>
  )
}

export default function RevenueStructure({ data }: Props) {
  const last = data[data.length - 1]
  const total = last?.revenue ?? 0

  const cats = [
    { label: 'Заезды', value: last?.racesRevTotal ?? 0, color: '#22c55e' },
    { label: 'Мероприятия', value: 0, color: '#3b82f6' },
    { label: 'Сертификаты', value: last?.racesRevCerts ?? 0, color: '#f59e0b' },
    { label: 'Абонементы', value: 0, color: '#8b5cf6' },
  ]

  const chartData = data.map((d) => ({
    month: d.month,
    Заезды: d.racesRevTotal ?? 0,
    Мероприятия: 0,
    Сертификаты: d.racesRevCerts ?? 0,
    Абонементы: 0,
  }))

  const preview = (
    <div>
      {cats.map((c) => (
        <ProgressBar key={c.label} label={c.label} value={c.value} total={total} color={c.color} />
      ))}
    </div>
  )

  return (
    <Accordion title="Структура выручки" preview={preview}>
      <div className="h-64 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
              formatter={(v: number) => [formatRub(v)]}
            />
            <Legend wrapperStyle={{ color: '#8888aa', fontSize: 12 }} />
            {[
              { key: 'Заезды', color: '#22c55e' },
              { key: 'Мероприятия', color: '#3b82f6' },
              { key: 'Сертификаты', color: '#f59e0b' },
              { key: 'Абонементы', color: '#8b5cf6' },
            ].map(({ key, color }) => (
              <Bar key={key} dataKey={key} stackId="a" fill={color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Accordion>
  )
}
