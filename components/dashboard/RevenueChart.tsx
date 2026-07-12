'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { DashboardRow } from '@/lib/sheets'
import { formatDate, formatDateWithDay, formatRub } from '@/lib/formatters'

interface Props { data: DashboardRow[] }

const TOOLTIP_STYLE = {
  background: 'rgba(13,13,26,0.95)',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: 10,
}

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
      <h2 className="font-semibold mb-4" style={{ color: '#f0f0ff', letterSpacing: '0.05em' }}>
        Выручка по дням
      </h2>
      {/* Responsive height: 200px on mobile, 224px on desktop */}
      <div style={{ height: 'clamp(180px, 30vw, 224px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#8888aa', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              // Show every 5th label to avoid crowding on mobile
              interval={4}
            />
            <YAxis
              tick={{ fill: '#8888aa', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'М' : v >= 1000 ? (v / 1000).toFixed(0) + 'К' : v}
              width={44}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: '#8888aa', fontSize: 12 }}
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
            <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="races" stroke="#a855f7" strokeWidth={1} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="certs" stroke="#22c55e" strokeWidth={1} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="events" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {[
          { color: '#7c3aed', label: 'Общая' },
          { color: '#a855f7', label: 'Заезды' },
          { color: '#22c55e', label: 'Сертификаты' },
          { color: '#f59e0b', label: 'Мероприятия' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: color }} />
            <span style={{ color: '#8888aa', fontSize: 11 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
