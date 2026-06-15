'use client'

import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MetricCard from '@/components/dashboard/MetricCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import DailyTable from '@/components/dashboard/DailyTable'
import MtdBlock from '@/components/dashboard/MtdBlock'
import RevenueBreakdown from '@/components/dashboard/RevenueBreakdown'
import PlanBlock from '@/components/dashboard/PlanBlock'
import { fetchDashboard, type DashboardRow } from '@/lib/sheets'
import { formatRubShort, formatNum } from '@/lib/formatters'

function filterCurrentMonth(rows: DashboardRow[]): DashboardRow[] {
  const today = new Date()
  return rows.filter((r) => {
    if (!r.date) return false
    // r.date is always "YYYY-MM-DD" built from local Date components — safe to split
    const [y, m] = r.date.split('-').map(Number)
    return y === today.getFullYear() && m === today.getMonth() + 1
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
  const newClientsPct = totalClients > 0
    ? parseFloat((totalNewClients / totalClients * 100).toFixed(1))
    : null

  const TRACK_CAPACITY = 180
  const today = new Date().getDate()
  const avgRevenuePerDay = today > 0 ? totalRevenue / today : null
  const daysWithRides = monthData.filter((r) => (r.races ?? 0) > 0)
  const avgLoad = daysWithRides.length > 0
    ? parseFloat((daysWithRides.reduce((s, r) => s + (r.races ?? 0) / TRACK_CAPACITY * 100, 0) / daysWithRides.length).toFixed(1))
    : null
  const loadColor = avgLoad === null ? '#8888aa' : avgLoad >= 70 ? '#22c55e' : avgLoad >= 40 ? '#f59e0b' : '#ef4444'

  const metrics = [
    {
      label: 'Выручка общая',
      value: formatRubShort(totalRevenue),
      spark: getLast7(monthData.map((r) => r.revenue)),
    },
    {
      label: 'Выручка / день',
      value: avgRevenuePerDay !== null ? formatRubShort(avgRevenuePerDay) : '—',
      subValue: `среднее за ${today} дней`,
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
      subValueAccent: newClientsPct !== null ? `${newClientsPct}%` : undefined,
      progressPct: newClientsPct ?? undefined,
      spark: getLast7(monthData.map((r) => r.clients)),
      color: '#22c55e',
    },
    {
      label: 'Средняя загрузка',
      value: avgLoad !== null ? `${avgLoad}%` : '—',
      subValue: 'картодром',
      progressPct: avgLoad ?? undefined,
      spark: getLast7(monthData.map((r) => (r.races ?? 0) > 0 ? parseFloat(((r.races ?? 0) / TRACK_CAPACITY * 100).toFixed(1)) : null)),
      color: loadColor,
    },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#080810' }}>
      <Sidebar />
      <main className="flex-1 md:ml-[220px] p-5 md:p-8 relative z-10">
        <Header
          title="SILA Картинг — Текущий месяц"
          updatedAt={updatedAt}
          onRefresh={load}
          loading={loading}
        />

        {error && (
          <div className="rounded-xl p-5 mb-6" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="font-medium mb-2" style={{ color: '#ef4444' }}>Ошибка загрузки данных</p>
            <p className="text-sm mb-3" style={{ color: '#8888aa' }}>{error}</p>
            <button
              onClick={load}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
            >
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && monthData.length === 0 && (
          <div className="rounded-xl p-8 text-center mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: '#8888aa' }}>Данные появятся после заполнения таблицы</p>
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse h-24 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {metrics.map((m) => (
                <MetricCard key={m.label} {...m} />
              ))}
            </div>
            {monthData.length > 0 && (
              <div className="mb-4">
                <RevenueBreakdown data={monthData} />
              </div>
            )}
          </>
        )}

        {monthData.length > 0 && (
          <>
            <div className="mb-4">
              <RevenueChart data={monthData} />
            </div>
            <div className="mt-4">
              <PlanBlock totalRevenue={totalRevenue} />
            </div>
            {data.length > 0 && <MtdBlock allData={data} />}
            <div className="mt-6">
              <DailyTable data={monthData} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
