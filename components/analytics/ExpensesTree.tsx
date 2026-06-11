'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { MonthlyData } from '@/lib/sheets'
import Accordion from './Accordion'
import { formatRub } from '@/lib/formatters'

interface Props { data: MonthlyData[] }

interface TreeRow {
  label: string
  value: number | null
  pctOf?: number | null
  indent?: boolean
}

function TreeBar({ label, value, pctOf, indent }: TreeRow) {
  const pct = pctOf && value ? Math.round((value / pctOf) * 100) : null
  const displayVal = value !== null ? formatRub(value) : '—'

  return (
    <div className={`flex items-center gap-3 py-1.5 ${indent ? 'pl-6' : ''}`}>
      <span className={`${indent ? 'text-[#737373] text-xs w-44 shrink-0' : 'text-[#f5f5f5] text-sm font-medium w-44 shrink-0'}`}>
        {indent ? '├ ' : ''}{label}
      </span>
      <div className="flex-1 h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
        {pct !== null && (
          <div className="h-full rounded-full bg-[#22c55e]/70" style={{ width: `${Math.min(pct, 100)}%` }} />
        )}
      </div>
      <span className={`text-right w-28 text-xs ${indent ? 'text-[#737373]' : 'text-[#f5f5f5]'}`}>{displayVal}</span>
      {pct !== null && <span className="text-[#737373] text-xs w-10 text-right">({pct}%)</span>}
    </div>
  )
}

export default function ExpensesTree({ data }: Props) {
  const last = data[data.length - 1]

  const topData = [
    { name: 'ФОТ', value: last?.expFotTotal ?? 0 },
    { name: 'Опер. расходы', value: (last?.expOp ?? 0) - (last?.expFotTotal ?? 0) },
  ].filter((d) => d.value > 0)

  const fot = last?.expFotTotal ?? null

  const rows: TreeRow[] = [
    { label: 'ФОТ итого', value: fot, pctOf: fot },
    { label: 'Маршалы', value: last?.expFotMarshals ?? null, pctOf: fot, indent: true },
    { label: 'Администраторы', value: last?.expFotAdmins ?? null, pctOf: fot, indent: true },
    { label: 'Механики', value: last?.expFotMechanics ?? null, pctOf: fot, indent: true },
    { label: 'Управление', value: last?.expFotManagement ?? null, pctOf: fot, indent: true },
    { label: 'Отдел продаж', value: last?.expFotSales ?? null, pctOf: fot, indent: true },
    { label: 'Бонусы команда', value: last?.expFotBonusTeam ?? null, pctOf: fot, indent: true },
    { label: 'Бонусы управление', value: last?.expFotBonusMgmt ?? null, pctOf: fot, indent: true },
    { label: 'Маркетолог', value: last?.expFotMarketer ?? null, pctOf: fot, indent: true },
    { label: 'Тренер', value: last?.expFotTrainer ?? null, pctOf: fot, indent: true },
    { label: 'Бухгалтер', value: last?.expFotAccountant ?? null, pctOf: fot, indent: true },
    { label: 'Фотограф', value: last?.expFotPhotographer ?? null, pctOf: fot, indent: true },
    { label: 'Дизайнер', value: last?.expFotDesigner ?? null, pctOf: fot, indent: true },
  ]

  const preview = (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={topData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 80 }}>
          <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#737373', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'М' : v >= 1000 ? (v / 1000).toFixed(0) + 'К' : v}
          />
          <YAxis dataKey="name" type="category" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid #1f1f1f', borderRadius: 8 }}
            formatter={(v: number) => [formatRub(v)]}
          />
          <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <Accordion title="Расходы" preview={preview}>
      <div className="mt-2 divide-y divide-[#1f1f1f]/50">
        {rows.map((r) => (
          <TreeBar key={r.label} {...r} />
        ))}
      </div>
    </Accordion>
  )
}
