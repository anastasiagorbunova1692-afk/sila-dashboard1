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
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '12px 16px',
      }}
    >
      <p className="text-xs mb-1 uppercase" style={{ color: '#8888aa', letterSpacing: '0.1em' }}>{label}</p>
      <p className="font-bold text-lg" style={{ color: '#f0f0ff' }}>{value}</p>
    </div>
  )
}

function FunnelBar({ label, value, max }: { label: string; value: number | null; max: number }) {
  const w = value && max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs w-36 shrink-0" style={{ color: '#8888aa' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${w}%`, background: 'linear-gradient(90deg, rgba(124,58,237,0.6), rgba(168,85,247,0.6))' }}
        />
      </div>
      <span className="text-xs w-12 text-right" style={{ color: '#f0f0ff' }}>{formatNum(value)}</span>
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
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10 }}
                labelStyle={{ color: '#8888aa', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ color: '#8888aa', fontSize: 12 }} />
              <Line type="monotone" dataKey="Всего" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }} connectNulls={false} />
              <Line type="monotone" dataKey="Новых" stroke="#a855f7" strokeWidth={2} dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-xs font-medium mb-2 uppercase" style={{ color: '#8888aa', letterSpacing: '0.1em' }}>Воронка</p>
          {funnelItems.map((f) => (
            <FunnelBar key={f.label} label={f.label} value={f.value} max={incomingMax} />
          ))}
        </div>
      </div>
    </Accordion>
  )
}
