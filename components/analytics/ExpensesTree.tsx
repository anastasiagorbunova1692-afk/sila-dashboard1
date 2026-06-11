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
      <span
        className={`${indent ? 'text-xs w-44 shrink-0' : 'text-sm font-medium w-44 shrink-0'}`}
        style={{ color: indent ? '#8888aa' : '#f0f0ff' }}
      >
        {indent ? '├ ' : ''}{label}
      </span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {pct !== null && (
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}
          />
        )}
      </div>
      <span className="text-right w-28 text-xs" style={{ color: indent ? '#8888aa' : '#f0f0ff' }}>{displayVal}</span>
      {pct !== null && <span className="text-xs w-10 text-right" style={{ color: '#8888aa' }}>({pct}%)</span>}
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
          <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#8888aa', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'М' : v >= 1000 ? (v / 1000).toFixed(0) + 'К' : v}
          />
          <YAxis dataKey="name" type="category" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
          <Tooltip
            contentStyle={{ background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10 }}
            formatter={(v: number) => [formatRub(v)]}
          />
          <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <Accordion title="Расходы" preview={preview}>
      <div className="mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {rows.map((r) => (
          <div key={r.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <TreeBar {...r} />
          </div>
        ))}
      </div>
    </Accordion>
  )
}
