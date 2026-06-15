'use client'

import { useState, useEffect } from 'react'
import { formatRub } from '@/lib/formatters'

interface Plan {
  real: number
  positive: number
}

interface Props {
  totalRevenue: number
}

const MONTH_NAMES_RU = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь']
const MONTH_NAMES_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

function planKey(date: Date) {
  return `plan_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`
}

function loadPlan(date: Date): Plan | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(planKey(date))
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function savePlan(date: Date, plan: Plan) {
  localStorage.setItem(planKey(date), JSON.stringify(plan))
}

function PlanCard({
  label, plan, revenue, completionPct, daysElapsedPct, today, daysInMonth,
}: {
  label: string
  plan: number
  revenue: number
  completionPct: number
  daysElapsedPct: number
  today: number
  daysInMonth: number
}) {
  const color = completionPct >= daysElapsedPct
    ? '#22c55e'
    : completionPct < daysElapsedPct - 10
    ? '#ef4444'
    : '#f59e0b'

  const gradientMap: Record<string, string> = {
    '#22c55e': 'linear-gradient(90deg, #16a34a, #22c55e)',
    '#f59e0b': 'linear-gradient(90deg, #d97706, #f59e0b)',
    '#ef4444': 'linear-gradient(90deg, #dc2626, #ef4444)',
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 16,
      flex: 1,
    }}>
      <p style={{ fontSize: 11, color: '#8888aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>

      <div className="flex justify-between items-baseline mb-1">
        <span style={{ fontSize: 13, color: '#f0f0ff' }}>{formatRub(revenue)}</span>
        <span style={{ fontSize: 12, color: '#8888aa' }}>из {formatRub(plan)}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: '100%',
          width: `${Math.min(completionPct, 100)}%`,
          borderRadius: 999,
          background: gradientMap[color],
          transition: 'width 0.5s ease',
        }} />
      </div>

      <div className="flex justify-between">
        <span style={{ fontSize: 13, fontWeight: 600, color }}>
          {completionPct.toFixed(1)}% выполнено
        </span>
        <span style={{ fontSize: 12, color: '#8888aa' }}>
          {today} из {daysInMonth} дн. ({daysElapsedPct.toFixed(0)}%)
        </span>
      </div>
    </div>
  )
}

export default function PlanBlock({ totalRevenue }: Props) {
  const now = new Date()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [editing, setEditing] = useState(false)
  const [realInput, setRealInput] = useState('')
  const [posInput, setPosInput] = useState('')
  const [toast, setToast] = useState(false)

  useEffect(() => {
    setPlan(loadPlan(now))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const today = now.getDate()
  const month = now.getMonth()
  const year = now.getFullYear()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysElapsedPct = (today / daysInMonth) * 100

  const monthLabel = `${MONTH_NAMES_RU[month]} ${year}`
  const hasPlan = plan !== null

  function openForm() {
    if (plan) {
      setRealInput(String(plan.real))
      setPosInput(String(plan.positive))
    } else {
      setRealInput('')
      setPosInput('')
    }
    setEditing(true)
  }

  function handleSave() {
    const r = parseFloat(realInput)
    const p = parseFloat(posInput)
    if (!r || !p) return
    const newPlan = { real: r, positive: p }
    savePlan(now, newPlan)
    setPlan(newPlan)
    setEditing(false)
    setToast(true)
    setTimeout(() => setToast(false), 5000)
  }

  function handleExport() {
    const data: Record<string, unknown> = {}
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('plan_') || k.startsWith('analytics_month_')) {
        try { data[k] = JSON.parse(localStorage.getItem(k) ?? '') } catch {}
      }
    })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sila-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast(false)
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#f0f0ff', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      padding: 20,
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold" style={{ color: '#f0f0ff', letterSpacing: '0.05em' }}>
            План на {monthLabel}
          </h2>
          {hasPlan && !editing && (
            <p style={{ fontSize: 12, color: '#8888aa', marginTop: 2 }}>
              Реальный: {formatRub(plan.real)} · Позитивный: {formatRub(plan.positive)}
            </p>
          )}
        </div>
        <button
          onClick={openForm}
          style={{
            fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            border: '1px solid rgba(124,58,237,0.5)', color: '#a855f7', background: 'transparent',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {hasPlan ? 'Изменить план' : 'Установить план'}
        </button>
      </div>

      {/* Inline form */}
      {editing && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label style={{ fontSize: 12, color: '#8888aa', display: 'block', marginBottom: 4 }}>Реальный план, ₽</label>
              <input type="number" value={realInput} onChange={e => setRealInput(e.target.value)} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                placeholder="2000000" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#8888aa', display: 'block', marginBottom: 4 }}>Позитивный план, ₽</label>
              <input type="number" value={posInput} onChange={e => setPosInput(e.target.value)} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                placeholder="2500000" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} style={{ padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: 'white', border: 'none' }}>
              Сохранить
            </button>
            <button onClick={() => setEditing(false)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: 'transparent', color: '#8888aa', border: '1px solid rgba(255,255,255,0.1)' }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* No plan placeholder */}
      {!hasPlan && !editing && (
        <p style={{ color: '#8888aa', fontSize: 13 }}>
          План не установлен — нажмите &laquo;Установить план&raquo;
        </p>
      )}

      {/* Progress bars */}
      {hasPlan && !editing && (
        <div className="flex gap-4 flex-col md:flex-row">
          <PlanCard
            label="Реальный план"
            plan={plan.real}
            revenue={totalRevenue}
            completionPct={plan.real > 0 ? totalRevenue / plan.real * 100 : 0}
            daysElapsedPct={daysElapsedPct}
            today={today}
            daysInMonth={daysInMonth}
          />
          <PlanCard
            label="Позитивный план"
            plan={plan.positive}
            revenue={totalRevenue}
            completionPct={plan.positive > 0 ? totalRevenue / plan.positive * 100 : 0}
            daysElapsedPct={daysElapsedPct}
            today={today}
            daysInMonth={daysInMonth}
          />
        </div>
      )}

      {/* Backup reminder toast */}
      {toast && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
          color: '#22c55e', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>План сохранён ✓ &nbsp;Совет: сделайте экспорт для резервной копии.</span>
          <button onClick={handleExport} style={{ fontSize: 12, color: '#a855f7', background: 'none', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Экспорт
          </button>
          <button onClick={() => setToast(false)} style={{ marginLeft: 'auto', fontSize: 16, color: '#8888aa', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
      )}
    </div>
  )
}
