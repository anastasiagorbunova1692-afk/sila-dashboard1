'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import type { MonthlyData } from '@/lib/sheets'
import Accordion from './Accordion'
import { formatNum, formatPct } from '@/lib/formatters'

interface Props { data: MonthlyData[] }

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg p-3">
      <p className="text-[#737373] text-xs mb-1">{label}</p>
      <p className="text-[#f5f5f5] font-bold text-lg">{value}</p>
    </div>
  )
}

function FunnelBar({ label, value, max }: { label: string; value: number | null; max: number }) {
  const w = value && max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-[#737373] text-xs w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-[#22c55e]/60" style={{ width: `${w}%` }} />
      </div>
      <span className="text-[#f5f5f5] text-xs w-12 text-right">{formatNum(value)}</span>
    </div>
  )
}

export default function ClientsBlock({ data }: Props) {
  const last = data[data.length - 1]

  const cards = [
    { label: 'Клиентов всего', value: formatNum(last?.clientsTotal) },
    { label: 'Новых клиентов', value: formatNum(last?.clientsNew) },
    { label: 'Доля новых', value: formatPct(last?.clientsNewPct) },
    { label: 'Загрузка трассы', value: formatPct(last?.trackLoad) },
  ]

  const chartData = data.map((d) => ({
    month: d.month,
    Всего: d.clientsTotal ?? null,
    Новых: d.clientsNew ?? null,
  }))

  const incomingMax = last?.incomingTraffic ?? 1

  const funnelItems = [
    { label: 'Входящий трафик', value: last?.incomingTraffic ?? null },
    { label: 'Заявки на заезды', value: last?.leadsRaces ?? null },
    { label: 'Заездов всего', value: last?.racesWithEvents ?? null },
    { label: 'Без записи', value: last?.racesNoBooking ?? null },
  ]

  const preview = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => <MiniCard key={c.label} label={c.label} value={c.value} />)}
    </div>
  )

  return (
    <Accordion title="Клиенты" preview={preview}>
      <div className="mt-2 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.map((c) => <MiniCard key={c.label} label={c.label} value={c.value} />)}
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #1f1f1f', borderRadius: 8 }}
                labelStyle={{ color: '#737373', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ color: '#737373', fontSize: 12 }} />
              <Line type="monotone" dataKey="Всего" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} connectNulls={false} />
              <Line type="monotone" dataKey="Новых" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-[#737373] text-xs font-medium mb-2 uppercase tracking-wider">Воронка</p>
          {funnelItems.map((f) => (
            <FunnelBar key={f.label} label={f.label} value={f.value} max={incomingMax} />
          ))}
        </div>
      </div>
    </Accordion>
  )
}
