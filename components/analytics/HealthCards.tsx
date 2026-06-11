'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'
import type { MonthlyData } from '@/lib/sheets'
import { formatRubShort, formatPct } from '@/lib/formatters'

interface Props { data: MonthlyData[] }

function delta(curr: number | null, prev: number | null): { pct: string; up: boolean | null } {
  if (curr === null || prev === null || prev === 0) return { pct: '—', up: null }
  const p = ((curr - prev) / Math.abs(prev)) * 100
  return { pct: (p >= 0 ? '+' : '') + p.toFixed(1) + '%', up: p >= 0 }
}

function SparkCard({
  label, value, change, sparkData,
}: { label: string; value: string; change: { pct: string; up: boolean | null }; sparkData: number[] }) {
  const cd = sparkData.map((v, i) => ({ i, v: v ?? 0 }))
  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:bg-[#1a1a1a] transition-colors">
      <p className="text-[#737373] text-xs font-medium mb-2">{label}</p>
      <p className="text-[#f5f5f5] text-2xl font-bold">{value}</p>
      {change.pct !== '—' && (
        <p className={`text-sm mt-1 ${change.up ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
          {change.up ? '▲' : '▼'} {change.pct} vs пред. месяц
        </p>
      )}
      {cd.length > 1 && (
        <div className="mt-3 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cd}>
              <Line type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
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
    {
      label: 'Выручка',
      value: formatRubShort(last?.revenue),
      change: delta(last?.revenue ?? null, prev?.revenue ?? null),
      spark: data.map((d) => d.revenue ?? 0),
    },
    {
      label: 'EBITDA',
      value: formatRubShort(last?.ebitda),
      change: delta(last?.ebitda ?? null, prev?.ebitda ?? null),
      spark: data.map((d) => d.ebitda ?? 0),
    },
    {
      label: 'Расходы общие',
      value: formatRubShort(last?.expenses),
      change: delta(last?.expenses ?? null, prev?.expenses ?? null),
      spark: data.map((d) => d.expenses ?? 0),
    },
    {
      label: 'Остаток на счетах',
      value: formatRubShort(last?.balanceTotal),
      change: delta(last?.balanceTotal ?? null, prev?.balanceTotal ?? null),
      spark: data.map((d) => d.balanceTotal ?? 0),
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <SparkCard key={c.label} label={c.label} value={c.value} change={c.change} sparkData={c.spark} />
      ))}
    </div>
  )
}
