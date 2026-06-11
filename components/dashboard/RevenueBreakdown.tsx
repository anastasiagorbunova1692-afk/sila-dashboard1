'use client'

import type { DashboardRow } from '@/lib/sheets'
import { formatRub, formatNum } from '@/lib/formatters'

interface Props {
  data: DashboardRow[]
}

interface BarRow {
  label: string
  display: string
  pct: number
}

function ProgressSection({ title, rows }: { title: string; rows: BarRow[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase mb-3" style={{ color: '#8888aa', letterSpacing: '0.1em' }}>
        {title}
      </p>
      <div className="space-y-3">
        {rows.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm" style={{ color: '#f0f0ff' }}>{c.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: '#f0f0ff' }}>{c.display}</span>
                <span className="text-xs w-10 text-right" style={{ color: '#8888aa' }}>
                  {c.pct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${c.pct}%`,
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RevenueBreakdown({ data }: Props) {
  const total = data.reduce((s, r) => s + (r.revenue ?? 0), 0)
  const totalClients = data.reduce((s, r) => s + (r.clients ?? 0), 0)
  const totalNew = data.reduce((s, r) => s + (r.newClients ?? 0), 0)
  const totalRepeat = Math.max(0, totalClients - totalNew)

  const revenueRows: BarRow[] = [
    { label: 'Заезды',      display: formatRub(data.reduce((s, r) => s + (r.revenueRaces  ?? 0), 0)), pct: total > 0 ? data.reduce((s, r) => s + (r.revenueRaces  ?? 0), 0) / total * 100 : 0 },
    { label: 'Мероприятия', display: formatRub(data.reduce((s, r) => s + (r.revenueEvents ?? 0), 0)), pct: total > 0 ? data.reduce((s, r) => s + (r.revenueEvents ?? 0), 0) / total * 100 : 0 },
    { label: 'Сертификаты', display: formatRub(data.reduce((s, r) => s + (r.revenueCerts  ?? 0), 0)), pct: total > 0 ? data.reduce((s, r) => s + (r.revenueCerts  ?? 0), 0) / total * 100 : 0 },
    { label: 'Абонементы',  display: formatRub(data.reduce((s, r) => s + (r.revenueAbos   ?? 0), 0)), pct: total > 0 ? data.reduce((s, r) => s + (r.revenueAbos   ?? 0), 0) / total * 100 : 0 },
  ]
    .sort((a, b) => b.pct - a.pct)

  const clientRows: BarRow[] = [
    { label: 'Новых клиентов', display: `${formatNum(totalNew)} чел`, pct: totalClients > 0 ? totalNew / totalClients * 100 : 0 },
    { label: 'Повторных',      display: `${formatNum(totalRepeat)} чел`, pct: totalClients > 0 ? totalRepeat / totalClients * 100 : 0 },
  ].filter((c) => c.pct > 0)

  if (total === 0 && totalClients === 0) return null

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
      <p className="text-xs font-medium uppercase mb-4" style={{ color: '#8888aa', letterSpacing: '0.1em' }}>
        Структура выручки текущего месяца
      </p>

      <div className="space-y-6">
        {revenueRows.length > 0 && (
          <ProgressSection title="Выручка" rows={revenueRows} />
        )}

        {clientRows.length > 0 && (
          <>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }} />
            <ProgressSection title="Клиенты" rows={clientRows} />
          </>
        )}
      </div>
    </div>
  )
}
