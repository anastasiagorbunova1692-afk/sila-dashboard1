'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { DashboardRow } from '@/lib/sheets'
import { formatDate, formatRub } from '@/lib/formatters'

const DAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

function formatDateWithDay(isoDate: string): string {
  const d = new Date(isoDate)
  return `${formatDate(isoDate)} ${DAYS[d.getDay()]}`
}

interface Props { data: DashboardRow[] }

export default function RevenueChart({ data }: Props) {
  const chartData = data.map((r) => ({
    isoDate: r.date,
    date: formatDate(r.date),
    revenue: r.revenue ?? 0,
    races: r.revenueRaces ?? 0,
    certs: r.revenueCerts ?? 0,
    events: r.revenueEvents ?? 0,
  }))

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
      <h2 className="text-[#f5f5f5] font-semibold mb-4">Выручка по дням</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#737373', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#737373', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'М' : v >= 1000 ? (v / 1000).toFixed(0) + 'К' : v}
              width={50}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #1f1f1f', borderRadius: 8 }}
              labelStyle={{ color: '#737373', fontSize: 12 }}
              labelFormatter={(label: string, payload) => {
                const iso = payload?.[0]?.payload?.isoDate as string | undefined
                return iso ? formatDateWithDay(iso) : label
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  revenue: 'Общая',
                  races: 'Заезды',
                  certs: 'Сертификаты',
                  events: 'Мероприятия',
                }
                return [formatRub(value), labels[name] || name]
              }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="races" stroke="#3b82f6" strokeWidth={1} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="certs" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="events" stroke="#8b5cf6" strokeWidth={1} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {[
          { color: '#22c55e', label: 'Общая' },
          { color: '#3b82f6', label: 'Заезды' },
          { color: '#f59e0b', label: 'Сертификаты' },
          { color: '#8b5cf6', label: 'Мероприятия' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: color }} />
            <span className="text-[#737373] text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
