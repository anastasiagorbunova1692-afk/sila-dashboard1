'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { formatRub, formatNum } from '@/lib/formatters'

const MONTHS = ['окт.25','ноя.25','дек.25','янв.26','фев.26','март.26','апр.26','май.26','июн.26']

interface MonthData {
  month: string
  revenue: string
  expenses: string
  ebitda: string
  ebitdaMargin: string
  balanceTotal: string
  balanceGorbunova: string
  balanceSafe: string
  racesRevenue: string
  racesCerts: string
  racesCount: string
  fotTotal: string
  fotMarshals: string
  fotAdmins: string
  fotMechanics: string
  fotManagement: string
  fotSales: string
  clientsTotal: string
  clientsNew: string
  racesTotal: string
  trackLoad: string
  incomingTraffic: string
  leadsRaces: string
}

const EMPTY: MonthData = {
  month: MONTHS[0],
  revenue: '', expenses: '', ebitda: '', ebitdaMargin: '',
  balanceTotal: '', balanceGorbunova: '', balanceSafe: '',
  racesRevenue: '', racesCerts: '', racesCount: '',
  fotTotal: '', fotMarshals: '', fotAdmins: '', fotMechanics: '', fotManagement: '', fotSales: '',
  clientsTotal: '', clientsNew: '', racesTotal: '', trackLoad: '', incomingTraffic: '', leadsRaces: '',
}

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

function loadAllMonths(): MonthData[] {
  return MONTHS.map(loadMonth).filter((m) =>
    Object.entries(m).some(([k, v]) => k !== 'month' && v !== '')
  )
}

// Input component
function Field({ label, value, onChange, type = 'number', unit }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; unit?: string
}) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>
        {label}{unit ? <span style={{ color: '#555577' }}> ({unit})</span> : ''}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
          color: '#f0f0ff', padding: '8px 12px', fontSize: 14, outline: 'none',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
        onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
      />
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="uppercase font-medium mb-3 mt-6" style={{ fontSize: 11, color: '#8888aa', letterSpacing: '0.1em' }}>
      {title}
    </p>
  )
}

function glassCard(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    padding: 20,
    ...extra,
  }
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<'view' | 'enter'>('view')
  const [form, setForm] = useState<MonthData>(EMPTY)
  const [toast, setToast] = useState<string | null>(null)
  const [savedMonths, setSavedMonths] = useState<MonthData[]>([])

  useEffect(() => {
    setSavedMonths(loadAllMonths())
  }, [])

  function set(field: keyof MonthData) {
    return (v: string) => setForm((f) => ({ ...f, [field]: v }))
  }

  function handleMonthChange(month: string) {
    setForm(loadMonth(month))
  }

  function handleSave() {
    saveMonth(form)
    setSavedMonths(loadAllMonths())
    setToast(`Данные за ${form.month} сохранены ✓`)
    setTimeout(() => setToast(null), 3000)
  }

  function tabStyle(active: boolean): React.CSSProperties {
    return {
      padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
      background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
      color: active ? '#a855f7' : '#8888aa',
      borderBottom: active ? '2px solid #7c3aed' : '2px solid transparent',
      transition: 'all 0.2s',
    }
  }

  const n = (s: string) => (s === '' ? null : parseFloat(s))
  const fmt = (s: string, fn: (v: number) => string) => { const v = n(s); return v !== null ? fn(v) : '—' }

  return (
    <div className="flex min-h-screen" style={{ background: '#080810' }}>
      <Sidebar />
      <main className="flex-1 md:ml-[220px] p-5 md:p-8 relative z-10">
        <Header title="SILA Картинг — Аналитика" updatedAt={null} onRefresh={() => setSavedMonths(loadAllMonths())} loading={false} />

        {/* Tabs */}
        <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button style={tabStyle(tab === 'view')} onClick={() => setTab('view')}>Просмотр</button>
          <button style={tabStyle(tab === 'enter')} onClick={() => setTab('enter')}>Внести данные</button>
        </div>

        {/* TAB: VIEW */}
        {tab === 'view' && (
          savedMonths.length === 0 ? (
            <div style={{ ...glassCard(), textAlign: 'center', padding: 60 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 16px' }}>
                <rect x="8" y="16" width="48" height="36" rx="4" stroke="#3a2a5a" strokeWidth="2" fill="none"/>
                <line x1="8" y1="26" x2="56" y2="26" stroke="#3a2a5a" strokeWidth="2"/>
                <line x1="22" y1="16" x2="22" y2="52" stroke="#3a2a5a" strokeWidth="2"/>
                <circle cx="15" cy="21" r="2" fill="#7c3aed"/>
                <rect x="26" y="31" width="8" height="10" rx="1" fill="#7c3aed" opacity="0.4"/>
                <rect x="38" y="28" width="8" height="13" rx="1" fill="#a855f7" opacity="0.6"/>
              </svg>
              <p style={{ color: '#f0f0ff', fontSize: 16, marginBottom: 8 }}>Данные появятся после заполнения</p>
              <p style={{ color: '#8888aa', fontSize: 13 }}>Перейдите во вкладку «Внести данные» и заполните показатели за нужный месяц</p>
              <button
                onClick={() => setTab('enter')}
                style={{ marginTop: 20, padding: '10px 24px', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', border: 'none' }}
              >
                Внести данные
              </button>
            </div>
          ) : (
            <div style={glassCard()}>
              <h2 className="font-semibold mb-4" style={{ color: '#f0f0ff' }}>Сводная таблица по месяцам</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Месяц','Выручка','EBITDA','Маржа %','Расходы','Клиентов','Заездов'].map((h) => (
                        <th key={h} className="text-left py-2 pr-6 font-medium uppercase" style={{ color: '#8888aa', fontSize: 11, letterSpacing: '0.1em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {savedMonths.map((m) => (
                      <tr key={m.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <td className="py-2.5 pr-6 font-medium" style={{ color: '#a855f7' }}>{m.month}</td>
                        <td className="py-2.5 pr-6" style={{ color: '#f0f0ff' }}>{fmt(m.revenue, formatRub)}</td>
                        <td className="py-2.5 pr-6" style={{ color: '#f0f0ff' }}>{fmt(m.ebitda, formatRub)}</td>
                        <td className="py-2.5 pr-6" style={{ color: n(m.ebitdaMargin) !== null && n(m.ebitdaMargin)! >= 0 ? '#22c55e' : '#ef4444' }}>
                          {fmt(m.ebitdaMargin, (v) => v.toFixed(1) + '%')}
                        </td>
                        <td className="py-2.5 pr-6" style={{ color: '#f0f0ff' }}>{fmt(m.expenses, formatRub)}</td>
                        <td className="py-2.5 pr-6" style={{ color: '#f0f0ff' }}>{fmt(m.clientsTotal, formatNum)}</td>
                        <td className="py-2.5 pr-6" style={{ color: '#f0f0ff' }}>{fmt(m.racesTotal, formatNum)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* TAB: ENTER */}
        {tab === 'enter' && (
          <div style={glassCard()}>
            <div className="mb-4">
              <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Месяц</label>
              <select
                value={form.month}
                onChange={(e) => handleMonthChange(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#f0f0ff', padding: '8px 12px', fontSize: 14, outline: 'none', cursor: 'pointer',
                }}
              >
                {MONTHS.map((m) => <option key={m} value={m} style={{ background: '#1a1a2e' }}>{m}</option>)}
              </select>
            </div>

            <SectionHeader title="Основные показатели" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Выручка общая" unit="руб" value={form.revenue} onChange={set('revenue')} />
              <Field label="Расходы общие" unit="руб" value={form.expenses} onChange={set('expenses')} />
              <Field label="EBITDA" unit="руб" value={form.ebitda} onChange={set('ebitda')} />
              <Field label="Маржа EBITDA" unit="%" value={form.ebitdaMargin} onChange={set('ebitdaMargin')} />
            </div>

            <SectionHeader title="Остатки на счетах" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Остаток общий" unit="руб" value={form.balanceTotal} onChange={set('balanceTotal')} />
              <Field label="ООО ПРОКАРТ / ИП Горбунова" unit="руб" value={form.balanceGorbunova} onChange={set('balanceGorbunova')} />
              <Field label="Сейф касса" unit="руб" value={form.balanceSafe} onChange={set('balanceSafe')} />
            </div>

            <SectionHeader title="Продукты — выручка" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Заезды сумма" unit="руб" value={form.racesRevenue} onChange={set('racesRevenue')} />
              <Field label="Оплачено сертификатами" unit="руб" value={form.racesCerts} onChange={set('racesCerts')} />
              <Field label="Заезды количество" unit="шт" value={form.racesCount} onChange={set('racesCount')} />
            </div>

            <SectionHeader title="Расходы ФОТ" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="ФОТ итого" unit="руб" value={form.fotTotal} onChange={set('fotTotal')} />
              <Field label="Маршалы" unit="руб" value={form.fotMarshals} onChange={set('fotMarshals')} />
              <Field label="Администраторы" unit="руб" value={form.fotAdmins} onChange={set('fotAdmins')} />
              <Field label="Механики" unit="руб" value={form.fotMechanics} onChange={set('fotMechanics')} />
              <Field label="Управление" unit="руб" value={form.fotManagement} onChange={set('fotManagement')} />
              <Field label="Отдел продаж" unit="руб" value={form.fotSales} onChange={set('fotSales')} />
            </div>

            <SectionHeader title="Клиенты" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Клиентов всего" unit="чел" value={form.clientsTotal} onChange={set('clientsTotal')} />
              <Field label="Новых клиентов" unit="чел" value={form.clientsNew} onChange={set('clientsNew')} />
              <Field label="Заездов всего" unit="шт" value={form.racesTotal} onChange={set('racesTotal')} />
              <Field label="Загрузка картодрома" unit="%" value={form.trackLoad} onChange={set('trackLoad')} />
              <Field label="Входящий трафик" unit="чел" value={form.incomingTraffic} onChange={set('incomingTraffic')} />
              <Field label="Заявок на заезды" unit="шт" value={form.leadsRaces} onChange={set('leadsRaces')} />
            </div>

            <div className="mt-8">
              <button
                onClick={handleSave}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: 'white', padding: '12px 32px', borderRadius: 8,
                  fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
                }}
              >
                Сохранить данные
              </button>
            </div>
          </div>
        )}

        {/* Toast */}
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
