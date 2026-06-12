'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { formatRub, formatNum } from '@/lib/formatters'

// ── Types ────────────────────────────────────────────────────────────────────

const MONTHS = ['окт.25','ноя.25','дек.25','янв.26','фев.26','март.26','апр.26','май.26','июн.26','июл.26']

interface MonthData {
  month: string
  // Revenue
  revenue: string
  revenueRaces: string
  revenueEvents: string
  revenueCerts: string
  revenueAbos: string
  // Expenses
  expenses: string
  expOp: string
  // Calculated (stored too)
  ebitda: string
  ebitdaMargin: string
  // Balances
  balanceTotal: string
  balanceGorbunova: string
  balanceSafe: string
  // Clients
  clientsTotal: string
  clientsNew: string
  incomingTraffic: string
  leadsRaces: string
  racesTotal: string
  // Track
  trackLoad: string
}

const EMPTY: MonthData = {
  month: MONTHS[0],
  revenue: '', revenueRaces: '', revenueEvents: '', revenueCerts: '', revenueAbos: '',
  expenses: '', expOp: '',
  ebitda: '', ebitdaMargin: '',
  balanceTotal: '', balanceGorbunova: '', balanceSafe: '',
  clientsTotal: '', clientsNew: '', incomingTraffic: '', leadsRaces: '', racesTotal: '',
  trackLoad: '',
}

// ── Storage ──────────────────────────────────────────────────────────────────

function storageKey(month: string) { return `analytics_month_${month}` }

function loadMonth(month: string): MonthData {
  if (typeof window === 'undefined') return { ...EMPTY, month }
  try {
    const raw = localStorage.getItem(storageKey(month))
    if (raw) return { ...EMPTY, ...JSON.parse(raw), month }
  } catch {}
  return { ...EMPTY, month }
}

function saveMonth(data: MonthData) {
  localStorage.setItem(storageKey(data.month), JSON.stringify(data))
}

function deleteMonth(month: string) {
  localStorage.removeItem(storageKey(month))
}

function loadAllMonths(): MonthData[] {
  return MONTHS.map(loadMonth).filter(m =>
    Object.entries(m).some(([k, v]) => k !== 'month' && v !== '')
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const n = (s: string) => (s === '' ? null : parseFloat(s))
const fmt = (s: string, fn: (v: number) => string) => { const v = n(s); return v !== null ? fn(v) : '—' }

function pctChange(curr: string, prev: string): { text: string; up: boolean } | null {
  const c = n(curr), p = n(prev)
  if (c === null || p === null || p === 0) return null
  const pct = ((c - p) / Math.abs(p)) * 100
  return { text: Math.abs(pct).toFixed(1) + '%', up: pct >= 0 }
}

// ── Sub-components ───────────────────────────────────────────────────────────

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  padding: 20,
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="uppercase font-semibold mt-6 mb-3" style={{ fontSize: 11, color: '#8888aa', letterSpacing: '0.12em' }}>
      {title}
    </p>
  )
}

function Field({ label, value, onChange, unit, hint }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>
        {label}{unit ? <span style={{ color: '#444466' }}> ({unit})</span> : ''}
      </label>
      {hint && <p style={{ fontSize: 11, color: '#555577', marginBottom: 4 }}>{hint}</p>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
          color: '#f0f0ff', padding: '8px 12px', fontSize: 14, outline: 'none',
        }}
        onFocus={e => (e.target.style.borderColor = '#7c3aed')}
        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
      />
    </div>
  )
}

function CalcField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>{label}</label>
      <p style={{ fontSize: 11, color: '#555577', marginBottom: 4 }}>рассчитывается автоматически</p>
      <div style={{
        background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: 8, color: '#a855f7', padding: '8px 12px', fontSize: 14, fontWeight: 600,
      }}>
        {value || '—'}
      </div>
    </div>
  )
}

function TopCard({ label, value, prev, valueStr }: {
  label: string; value: string; prev?: string; valueStr?: string
}) {
  const [hovered, setHovered] = useState(false)
  const change = prev !== undefined ? pctChange(value, prev) : null
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glass,
        border: hovered ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: hovered ? '0 4px 32px rgba(124,58,237,0.15)' : '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'all 0.3s',
        padding: '14px 16px',
      }}
    >
      <p style={{ fontSize: 11, color: '#8888aa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f0f0ff', lineHeight: 1.2 }}>{valueStr ?? (value || '—')}</p>
      {change && (
        <p style={{ fontSize: 12, color: change.up ? '#22c55e' : '#ef4444', marginTop: 4 }}>
          {change.up ? '▲' : '▼'} {change.text} vs пред. месяц
        </p>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

type SortKey = 'month' | 'revenue' | 'ebitda' | 'ebitdaMargin' | 'expenses' | 'clientsTotal' | 'racesTotal' | 'trackLoad'
type SortDir = 'asc' | 'desc'
type ChartMetric = 'revenue' | 'ebitda' | 'expenses' | 'clientsTotal' | 'racesTotal'

export default function AnalyticsPage() {
  const [tab, setTab] = useState<'view' | 'enter'>('view')
  const [form, setForm] = useState<MonthData>(EMPTY)
  const [isEditing, setIsEditing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [saved, setSaved] = useState<MonthData[]>([])
  const [chartMetric, setChartMetric] = useState<ChartMetric>('revenue')
  const [sortKey, setSortKey] = useState<SortKey>('month')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const refresh = useCallback(() => setSaved(loadAllMonths()), [])

  useEffect(() => { refresh() }, [refresh])

  // Auto-calculated fields (update in real-time as user types)
  const calcEbitda = (() => {
    const r = n(form.revenue), op = n(form.expOp)
    if (r !== null && op !== null) return (r - op).toFixed(0)
    return ''
  })()
  const calcMargin = (() => {
    const r = n(form.revenue), eb = n(calcEbitda)
    if (r !== null && eb !== null && r !== 0) return (eb / r * 100).toFixed(1)
    return ''
  })()

  function set(field: keyof MonthData) {
    return (v: string) => setForm(f => ({ ...f, [field]: v }))
  }

  function handleMonthChange(month: string) {
    setForm(loadMonth(month))
    setIsEditing(false)
  }

  function handleEdit(m: MonthData) {
    setForm(m); setIsEditing(true); setTab('enter')
  }

  function handleDelete(month: string) {
    if (!window.confirm(`Удалить данные за ${month}?`)) return
    deleteMonth(month); refresh()
  }

  function handleSave() {
    const toSave = { ...form, ebitda: calcEbitda, ebitdaMargin: calcMargin }
    saveMonth(toSave); refresh()
    setToast(isEditing ? `Данные за ${form.month} обновлены ✓` : `Данные за ${form.month} сохранены ✓`)
    setIsEditing(false)
    setTimeout(() => setToast(null), 3000)
  }

  function calcTrackLoad() {
    const races = n(form.racesTotal)
    if (races !== null) set('trackLoad')((races / 180 * 100).toFixed(1))
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function tabStyle(active: boolean): React.CSSProperties {
    return {
      padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
      background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
      color: active ? '#a855f7' : '#8888aa',
      borderBottom: active ? '2px solid #7c3aed' : '2px solid transparent',
      transition: 'all 0.2s', border: 'none',
    }
  }

  // Viewer data
  const last = saved[saved.length - 1]
  const prev = saved.length >= 2 ? saved[saved.length - 2] : undefined

  const sortedRows = [...saved].sort((a, b) => {
    const av = sortKey === 'month' ? MONTHS.indexOf(a.month) : (n(a[sortKey]) ?? -Infinity)
    const bv = sortKey === 'month' ? MONTHS.indexOf(b.month) : (n(b[sortKey]) ?? -Infinity)
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const chartData = saved.map(m => ({
    month: m.month,
    revenue: n(m.revenue) ?? 0,
    ebitda: n(m.ebitda) ?? 0,
    expenses: n(m.expenses) ?? 0,
    clientsTotal: n(m.clientsTotal) ?? 0,
    racesTotal: n(m.racesTotal) ?? 0,
  }))

  const chartLabels: Record<ChartMetric, string> = {
    revenue: 'Выручка', ebitda: 'EBITDA', expenses: 'Расходы', clientsTotal: 'Клиенты', racesTotal: 'Заезды',
  }

  function SortTh({ label, sk }: { label: string; sk: SortKey }) {
    const active = sortKey === sk
    return (
      <th
        className="text-left py-2 pr-4 font-medium uppercase whitespace-nowrap cursor-pointer select-none"
        style={{ color: active ? '#a855f7' : '#8888aa', fontSize: 11, letterSpacing: '0.1em' }}
        onClick={() => handleSort(sk)}
      >
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    )
  }

  // Revenue breakdown for last month
  const revTotal = n(last?.revenue) || 0
  const revBreakdown = last ? [
    { label: 'Заезды', val: n(last.revenueRaces) ?? 0 },
    { label: 'Мероприятия', val: n(last.revenueEvents) ?? 0 },
    { label: 'Сертификаты', val: n(last.revenueCerts) ?? 0 },
    { label: 'Абонементы', val: n(last.revenueAbos) ?? 0 },
  ].sort((a, b) => b.val - a.val) : []

  const NO_DATA = (
    <div style={{ ...glass, textAlign: 'center', padding: 60 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 16px' }}>
        <rect x="8" y="16" width="48" height="36" rx="4" stroke="#3a2a5a" strokeWidth="2" fill="none"/>
        <line x1="8" y1="26" x2="56" y2="26" stroke="#3a2a5a" strokeWidth="2"/>
        <line x1="22" y1="16" x2="22" y2="52" stroke="#3a2a5a" strokeWidth="2"/>
        <circle cx="15" cy="21" r="2" fill="#7c3aed"/>
        <rect x="26" y="31" width="8" height="10" rx="1" fill="#7c3aed" opacity="0.4"/>
        <rect x="38" y="28" width="8" height="13" rx="1" fill="#a855f7" opacity="0.6"/>
      </svg>
      <p style={{ color: '#f0f0ff', fontSize: 16, marginBottom: 8 }}>Внесите данные за первый месяц чтобы увидеть аналитику</p>
      <button onClick={() => setTab('enter')} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', border: 'none' }}>
        Внести данные
      </button>
    </div>
  )

  return (
    <div className="flex min-h-screen" style={{ background: '#080810' }}>
      <Sidebar />
      <main className="flex-1 md:ml-[220px] p-5 md:p-8 relative z-10">
        <Header title="SILA Картинг — Аналитика" updatedAt={null} onRefresh={refresh} loading={false} />

        {/* Tabs */}
        <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button style={tabStyle(tab === 'view')} onClick={() => setTab('view')}>Просмотр</button>
          <button style={tabStyle(tab === 'enter')} onClick={() => setTab('enter')}>Внести данные</button>
        </div>

        {/* ── VIEW TAB ──────────────────────────────────────────────────────── */}
        {tab === 'view' && (
          saved.length === 0 ? NO_DATA : (
            <div className="space-y-4">

              {/* Top cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <TopCard label="Выручка" value={last?.revenue ?? ''} prev={prev?.revenue} valueStr={fmt(last?.revenue ?? '', formatRub)} />
                <TopCard label="EBITDA" value={last?.ebitda ?? ''} prev={prev?.ebitda} valueStr={fmt(last?.ebitda ?? '', formatRub)} />
                <TopCard label="Маржа EBITDA" value={last?.ebitdaMargin ?? ''} prev={prev?.ebitdaMargin}
                  valueStr={last?.ebitdaMargin ? last.ebitdaMargin + '%' : '—'} />
                <TopCard label="Расходы" value={last?.expenses ?? ''} prev={prev?.expenses} valueStr={fmt(last?.expenses ?? '', formatRub)} />
              </div>

              {/* Chart */}
              <div style={glass}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="font-semibold" style={{ color: '#f0f0ff' }}>Динамика по месяцам</h2>
                  <div className="flex gap-2">
                    {(Object.keys(chartLabels) as ChartMetric[]).map(k => (
                      <button key={k} onClick={() => setChartMetric(k)} style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', border: 'none',
                        background: chartMetric === k ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                        color: chartMetric === k ? '#a855f7' : '#8888aa',
                      }}>
                        {chartLabels[k]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} width={55}
                        tickFormatter={v => v >= 1_000_000 ? (v/1_000_000).toFixed(1)+'М' : v >= 1_000 ? (v/1_000).toFixed(0)+'К' : String(v)} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10 }}
                        labelStyle={{ color: '#8888aa', fontSize: 12 }}
                        formatter={(v: number) => [
                          chartMetric === 'clientsTotal' || chartMetric === 'racesTotal' ? formatNum(v) : formatRub(v),
                          chartLabels[chartMetric],
                        ]}
                      />
                      <Line type="monotone" dataKey={chartMetric} stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue breakdown */}
              {revTotal > 0 && (
                <div style={glass}>
                  <h2 className="font-semibold mb-4" style={{ color: '#f0f0ff' }}>
                    Структура выручки — {last?.month}
                  </h2>
                  <div className="space-y-3">
                    {revBreakdown.map(row => {
                      const pct = revTotal > 0 ? row.val / revTotal * 100 : 0
                      return (
                        <div key={row.label}>
                          <div className="flex justify-between mb-1.5">
                            <span style={{ fontSize: 13, color: '#f0f0ff' }}>{row.label}</span>
                            <div className="flex gap-3">
                              <span style={{ fontSize: 13, color: '#f0f0ff' }}>{formatRub(row.val)}</span>
                              <span style={{ fontSize: 12, color: '#8888aa', width: 44, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg,#7c3aed,#a855f7)', transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Summary table */}
              <div style={glass}>
                <h2 className="font-semibold mb-4" style={{ color: '#f0f0ff' }}>Все месяцы</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <SortTh label="Месяц" sk="month" />
                        <SortTh label="Выручка" sk="revenue" />
                        <SortTh label="EBITDA" sk="ebitda" />
                        <SortTh label="Маржа%" sk="ebitdaMargin" />
                        <SortTh label="Расходы" sk="expenses" />
                        <SortTh label="Клиентов" sk="clientsTotal" />
                        <SortTh label="Заездов" sk="racesTotal" />
                        <SortTh label="Загрузка%" sk="trackLoad" />
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map(m => {
                        const isCur = m.month === last?.month
                        return (
                          <tr key={m.month}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isCur ? 'rgba(124,58,237,0.1)' : 'transparent', borderLeft: isCur ? '2px solid #7c3aed' : '2px solid transparent' }}
                            onMouseEnter={e => { if (!isCur) (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.05)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isCur ? 'rgba(124,58,237,0.1)' : 'transparent' }}>
                            <td className="py-2.5 pr-4 font-medium" style={{ color: isCur ? '#a855f7' : '#f0f0ff', paddingLeft: 8 }}>{m.month}</td>
                            <td className="py-2.5 pr-4" style={{ color: '#f0f0ff' }}>{fmt(m.revenue, formatRub)}</td>
                            <td className="py-2.5 pr-4" style={{ color: '#f0f0ff' }}>{fmt(m.ebitda, formatRub)}</td>
                            <td className="py-2.5 pr-4" style={{ color: n(m.ebitdaMargin) !== null && n(m.ebitdaMargin)! >= 0 ? '#22c55e' : '#ef4444' }}>
                              {m.ebitdaMargin ? m.ebitdaMargin + '%' : '—'}
                            </td>
                            <td className="py-2.5 pr-4" style={{ color: '#f0f0ff' }}>{fmt(m.expenses, formatRub)}</td>
                            <td className="py-2.5 pr-4" style={{ color: '#f0f0ff' }}>{fmt(m.clientsTotal, formatNum)}</td>
                            <td className="py-2.5 pr-4" style={{ color: '#f0f0ff' }}>{fmt(m.racesTotal, formatNum)}</td>
                            <td className="py-2.5 pr-4" style={{ color: '#f0f0ff' }}>{m.trackLoad ? m.trackLoad + '%' : '—'}</td>
                            <td className="py-2.5" style={{ whiteSpace: 'nowrap' }}>
                              <button onClick={() => handleEdit(m)}
                                style={{ fontSize: 12, color: '#a855f7', background: 'none', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', marginRight: 2 }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                Изменить
                              </button>
                              <button onClick={() => handleDelete(m.month)}
                                style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                Удалить
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}

        {/* ── ENTER TAB ─────────────────────────────────────────────────────── */}
        {tab === 'enter' && (
          <div style={glass}>
            <SectionHeader title="Период" />
            <div className="w-48">
              <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Месяц</label>
              <select value={form.month} onChange={e => { handleMonthChange(e.target.value) }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0ff', padding: '8px 12px', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                {MONTHS.map(m => <option key={m} value={m} style={{ background: '#1a1a2e' }}>{m}</option>)}
              </select>
            </div>

            <SectionHeader title="Выручка" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Выручка общая" unit="руб" value={form.revenue} onChange={set('revenue')} />
              <Field label="Выручка заезды" unit="руб" value={form.revenueRaces} onChange={set('revenueRaces')} />
              <Field label="Выручка мероприятия" unit="руб" value={form.revenueEvents} onChange={set('revenueEvents')} />
              <Field label="Выручка сертификаты" unit="руб" value={form.revenueCerts} onChange={set('revenueCerts')} />
              <Field label="Выручка абонементы" unit="руб" value={form.revenueAbos} onChange={set('revenueAbos')} />
            </div>

            <SectionHeader title="Расходы" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Расходы общие" unit="руб" value={form.expenses} onChange={set('expenses')} />
              <Field label="Расходы операционные" unit="руб" value={form.expOp} onChange={set('expOp')} />
            </div>

            <SectionHeader title="Результат" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CalcField label="EBITDA, руб" value={calcEbitda ? Number(calcEbitda).toLocaleString('ru') + ' ₽' : ''} />
              <CalcField label="Маржа EBITDA, %" value={calcMargin ? calcMargin + '%' : ''} />
            </div>

            <SectionHeader title="Остатки на счетах" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Остаток общий" unit="руб" value={form.balanceTotal} onChange={set('balanceTotal')} />
              <Field label="ООО ПРОКАРТ / ИП Горбунова" unit="руб" value={form.balanceGorbunova} onChange={set('balanceGorbunova')} />
              <Field label="Сейф касса" unit="руб" value={form.balanceSafe} onChange={set('balanceSafe')} />
            </div>

            <SectionHeader title="Клиенты" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Клиентов всего" unit="чел" value={form.clientsTotal} onChange={set('clientsTotal')} />
              <Field label="Новых клиентов" unit="чел" value={form.clientsNew} onChange={set('clientsNew')} />
              <Field label="Входящий трафик" unit="чел" value={form.incomingTraffic} onChange={set('incomingTraffic')} />
              <Field label="Заявок на заезды" unit="шт" value={form.leadsRaces} onChange={set('leadsRaces')} />
              <Field label="Заездов всего" unit="шт" value={form.racesTotal} onChange={set('racesTotal')} />
            </div>

            <SectionHeader title="Картодром" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Field label="Загрузка картодрома" unit="%" hint="= Заездов / 180 × 100" value={form.trackLoad} onChange={set('trackLoad')} />
                <button onClick={calcTrackLoad} style={{
                  marginTop: 8, fontSize: 12, padding: '5px 14px', borderRadius: 6, cursor: 'pointer', border: 'none',
                  background: 'rgba(124,58,237,0.2)', color: '#a855f7',
                }}>
                  Рассчитать из заездов
                </button>
              </div>
            </div>

            <div className="mt-8">
              <button onClick={handleSave} style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white',
                padding: '12px 32px', borderRadius: 8, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>
                {isEditing ? `Обновить данные за ${form.month}` : `Сохранить данные за ${form.month}`}
              </button>
            </div>
          </div>
        )}

        {toast && (
          <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 100,
            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 12, padding: '12px 20px', color: '#22c55e', fontSize: 14,
          }}>
            {toast}
          </div>
        )}
      </main>
    </div>
  )
}
