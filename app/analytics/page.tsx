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
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 md:ml-[220px] p-5 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#f5f5f5]">Аналитика</h1>
        </div>

        {/* Month filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ALL_MONTHS.map((m) => {
            const active = selectedMonths.includes(m)
            return (
              <button
                key={m}
                onClick={() => toggleMonth(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                  ${active
                    ? 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/40'
                    : 'text-[#737373] border-[#1f1f1f] hover:bg-[#1a1a1a]'
                  }`}
              >
                {m}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-5 mb-6">
            <p className="text-[#ef4444] font-medium mb-2">Ошибка загрузки данных</p>
            <p className="text-[#737373] text-sm mb-3">{error}</p>
            <button
              onClick={load}
              className="px-4 py-2 rounded-lg bg-[#ef4444]/20 text-[#ef4444] text-sm hover:bg-[#ef4444]/30 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 animate-pulse h-28" />
              ))}
            </div>
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 animate-pulse h-72" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-8 text-center">
            <p className="text-[#737373]">Данные появятся после заполнения таблицы</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Block 1: Health */}
            <section>
              <p className="text-[#737373] text-xs font-medium uppercase tracking-wider mb-3">Здоровье бизнеса</p>
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
