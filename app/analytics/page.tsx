'use client'

import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import HealthCards from '@/components/analytics/HealthCards'
import MainChart from '@/components/analytics/MainChart'
import RevenueStructure from '@/components/analytics/RevenueStructure'
import ExpensesTree from '@/components/analytics/ExpensesTree'
import ClientsBlock from '@/components/analytics/ClientsBlock'
import SummaryTable from '@/components/analytics/SummaryTable'
import { fetchAnalytics, type MonthlyData } from '@/lib/sheets'

const ALL_MONTHS = ['окт.25', 'ноя.25', 'дек.25', 'янв.26', 'фев.26', 'март.26', 'апр.26', 'май.26']

export default function AnalyticsPage() {
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonths, setSelectedMonths] = useState<string[]>(ALL_MONTHS)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchAnalytics()
      setData(rows)
    } catch (e) {
      setError((e as Error).message || 'Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = data.filter((d) => selectedMonths.includes(d.month))

  const toggleMonth = (m: string) => {
    setSelectedMonths((prev) =>
      prev.includes(m)
        ? prev.length > 1 ? prev.filter((x) => x !== m) : prev
        : [...prev, m]
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#080810' }}>
      <Sidebar />
      <main className="flex-1 md:ml-[220px] p-5 md:p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold" style={{ color: '#f0f0ff', letterSpacing: '0.05em' }}>Аналитика</h1>
        </div>

        {/* Month filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ALL_MONTHS.map((m) => {
            const active = selectedMonths.includes(m)
            return (
              <button
                key={m}
                onClick={() => toggleMonth(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={active ? {
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: 'white',
                  border: '1px solid transparent',
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  color: '#8888aa',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {m}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="rounded-xl p-5 mb-6" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="font-medium mb-2" style={{ color: '#ef4444' }}>Ошибка загрузки данных</p>
            <p className="text-sm mb-3" style={{ color: '#8888aa' }}>{error}</p>
            <button
              onClick={load}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
            >
              Попробовать снова
            </button>
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse h-28 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
              ))}
            </div>
            <div className="animate-pulse h-72 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: '#8888aa' }}>Данные появятся после заполнения таблицы</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Block 1: Health */}
            <section>
              <p className="text-xs font-medium uppercase mb-3" style={{ color: '#8888aa', letterSpacing: '0.1em' }}>Здоровье бизнеса</p>
              <HealthCards data={filtered} />
            </section>

            {/* Block 2: Main chart */}
            <MainChart data={filtered} />

            {/* Block 3: Revenue structure */}
            <RevenueStructure data={filtered} />

            {/* Block 4: Expenses */}
            <ExpensesTree data={filtered} />

            {/* Block 5: Clients */}
            <ClientsBlock data={filtered} />

            {/* Block 6: Summary table */}
            <SummaryTable data={filtered} />
          </div>
        )}
      </main>
    </div>
  )
}
