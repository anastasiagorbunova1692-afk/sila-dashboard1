'use client'

import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MetricCard from '@/components/dashboard/MetricCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import DailyTable from '@/components/dashboard/DailyTable'
import { fetchDashboard, type DashboardRow } from '@/lib/sheets'
import { formatRubShort, formatNum } from '@/lib/formatters'

function filterCurrentMonth(rows: DashboardRow[]): DashboardRow[] {
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  return rows.filter((r) => {
    if (!r.date) return false
    const d = new Date(r.date)
    // same month/year, not a future date, and has at least some data
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d <= now &&
      (r.revenue !== null || r.races !== null || r.clients !== null)
    )
  })
}

function sum(arr: (number | null)[]): number {
  return arr.reduce((a: number, b) => a + (b ?? 0), 0)
}

function getLast7(arr: (number | null)[]): number[] {
  return arr.slice(-7).map((v) => v ?? 0)
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchDashboard()
      setData(rows)
      setUpdatedAt(new Date())
    } catch (e) {
      setError((e as Error).message || 'Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [load])

  const monthData = filterCurrentMonth(data)

  const totalRevenue = sum(monthData.map((r) => r.revenue))
  const totalRaces = sum(monthData.map((r) => r.revenueRaces))
  const totalCerts = sum(monthData.map((r) => r.revenueCerts))
  const totalEvents = sum(monthData.map((r) => r.revenueEvents))
  const totalRacesCount = sum(monthData.map((r) => r.races))
  const totalClients = sum(monthData.map((r) => r.clients))
  const totalNewClients = sum(monthData.map((r) => r.newClients))

  const metrics = [
    {
      label: 'Выручка общая',
      value: formatRubShort(totalRevenue),
      spark: getLast7(monthData.map((r) => r.revenue)),
    },
    {
      label: 'Выручка заезды',
      value: formatRubShort(totalRaces),
      spark: getLast7(monthData.map((r) => r.revenueRaces)),
    },
    {
      label: 'Выручка сертификаты',
      value: formatRubShort(totalCerts),
      spark: getLast7(monthData.map((r) => r.revenueCerts)),
      color: '#f59e0b',
    },
    {
      label: 'Выручка мероприятия',
      value: formatRubShort(totalEvents),
      spark: getLast7(monthData.map((r) => r.revenueEvents)),
      color: '#8b5cf6',
    },
    {
      label: 'Заездов всего',
      value: formatNum(totalRacesCount),
      spark: getLast7(monthData.map((r) => r.races)),
      color: '#3b82f6',
    },
    {
      label: 'Клиентов / Новых',
      value: formatNum(totalClients),
      subValue: `${formatNum(totalNewClients)} новых`,
      spark: getLast7(monthData.map((r) => r.clients)),
      color: '#22c55e',
    },
  ]

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 md:ml-[220px] p-5 md:p-8">
        <Header
          title="SILA Картинг — Текущий месяц"
          updatedAt={updatedAt}
          onRefresh={load}
          loading={loading}
        />

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

        {!loading && !error && monthData.length === 0 && (
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-8 text-center mb-6">
            <p className="text-[#737373]">Данные появятся после заполнения таблицы</p>
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {metrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>
        )}

        {monthData.length > 0 && (
          <>
            <div className="mb-6">
              <RevenueChart data={monthData} />
            </div>
            <DailyTable data={monthData} />
          </>
        )}
      </main>
    </div>
  )
}
