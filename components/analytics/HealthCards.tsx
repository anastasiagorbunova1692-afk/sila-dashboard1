'use client'

import { useState } from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import type { MonthlyData } from '@/lib/sheets'
import { formatRubShort } from '@/lib/formatters'

interface Props { data: MonthlyData[] }

function delta(curr: number | null, prev: number | null): { pct: string; up: boolean | null } {
  if (curr === null || prev === null || prev === 0) return { pct: '—', up: null }
  const p = ((curr - prev) / Math.abs(prev)) * 100
  return { pct: (p >= 0 ? '+' : '') + p.toFixed(1) + '%', up: p >= 0 }
}

function SparkCard({ label, value, change, sparkData }: {
  label: string
  value: string
  change: { pct: string; up: boolean | null }
  sparkData: number[]
}) {
  const [hovered, setHovered] = useState(false)
  const cd = sparkData.map((v, i) => ({ i, v: v ?? 0 }))
  const gradId = `hc-${label.replace(/\s/g, '')}`

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        boxShadow: hovered ? '0 4px 32px rgba(124,58,237,0.15)' : '0 4px 24px rgba(0,0,0,0.4)',
        padding: 20,
        transition: 'all 0.3s ease',
      }}
    >
      <p className="text-xs font-medium mb-2 uppercase" style={{ color: '#8888aa', letterSpacing: '0.1em' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: '#f0f0ff' }}>{value}</p>
      {change.pct !== '—' && (
        <p className="text-sm mt-1" style={{ color: change.up ? '#22c55e' : '#ef4444' }}>
          {change.up ? '▲' : '▼'} {change.pct} vs пред. месяц
        </p>
      )}
      {cd.length > 1 && (
        <div className="mt-3 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cd}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#7c3aed" strokeWidth={1.5}
                fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default function HealthCards({ data }: Props) {
  const last = data[data.length - 1]
  const prev = data.length >= 2 ? data[data.length - 2] : null

  const cards = [
    { label: 'Выручка', value: formatRubShort(last?.revenue), change: delta(last?.revenue ?? null, prev?.revenue ?? null), spark: data.map((d) => d.revenue ?? 0) },
    { label: 'EBITDA', value: formatRubShort(last?.ebitda), change: delta(last?.ebitda ?? null, prev?.ebitda ?? null), spark: data.map((d) => d.ebitda ?? 0) },
    { label: 'Расходы общие', value: formatRubShort(last?.expenses), change: delta(last?.expenses ?? null, prev?.expenses ?? null), spark: data.map((d) => d.expenses ?? 0) },
    { label: 'Остаток на счетах', value: formatRubShort(last?.balanceTotal), change: delta(last?.balanceTotal ?? null, prev?.balanceTotal ?? null), spark: data.map((d) => d.balanceTotal ?? 0) },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <SparkCard key={c.label} label={c.label} value={c.value} change={c.change} sparkData={c.spark} />
      ))}
    </div>
  )
}
