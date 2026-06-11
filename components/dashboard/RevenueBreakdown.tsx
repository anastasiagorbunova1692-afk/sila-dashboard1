'use client'

import type { DashboardRow } from '@/lib/sheets'
import { formatRub } from '@/lib/formatters'

interface Props {
  data: DashboardRow[]
}

interface Category {
  label: string
  value: number
}

export default function RevenueBreakdown({ data }: Props) {
  const total = data.reduce((s, r) => s + (r.revenue ?? 0), 0)

  const categories: Category[] = [
    { label: 'Заезды',      value: data.reduce((s, r) => s + (r.revenueRaces  ?? 0), 0) },
    { label: 'Мероприятия', value: data.reduce((s, r) => s + (r.revenueEvents ?? 0), 0) },
    { label: 'Сертификаты', value: data.reduce((s, r) => s + (r.revenueCerts  ?? 0), 0) },
    { label: 'Абонементы',  value: data.reduce((s, r) => s + (r.revenueAbos   ?? 0), 0) },
  ]
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)

  if (total === 0 || categories.length === 0) return null

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
      <p
        className="text-xs font-medium uppercase mb-4"
        style={{ color: '#8888aa', letterSpacing: '0.1em' }}
      >
        Структура выручки текущего месяца
      </p>

      <div className="space-y-3">
        {categories.map((c) => {
          const pct = total > 0 ? (c.value / total) * 100 : 0
          const pctLabel = pct.toFixed(1) + '%'
          return (
            <div key={c.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm" style={{ color: '#f0f0ff' }}>{c.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: '#f0f0ff' }}>{formatRub(c.value)}</span>
                  <span
                    className="text-xs w-10 text-right"
                    style={{ color: '#8888aa' }}
                  >
                    {pctLabel}
                  </span>
                </div>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
