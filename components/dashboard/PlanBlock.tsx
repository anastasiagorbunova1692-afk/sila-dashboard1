'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatRub } from '@/lib/formatters'

const API_URL = '/api/plans'

interface Plan {
  real: number
  positive: number
}

interface Props {
  totalRevenue: number
}

const MONTH_NAMES_RU = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь']

function planKey(year: number, month: number) {
  return `${year}_${String(month + 1).padStart(2, '0')}`
}

function localKey(year: number, month: number) {
  return `plan_${planKey(year, month)}`
}

function loadFromLocal(year: number, month: number): Plan | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(localKey(year, month))
    if (raw) {
      const p = JSON.parse(raw)
      return { real: p.real ?? p.realPlan ?? 0, positive: p.positive ?? p.positivePlan ?? 0 }
    }
  } catch {}
  return null
}

function saveToLocal(year: number, month: number, plan: Plan) {
  localStorage.setItem(localKey(year, month), JSON.stringify(plan))
}

async function fetchPlans(): Promise<Record<string, Plan>> {
  const res = await fetch(API_URL + '?t=' + Date.now())
  const data = await res.json() as { plans?: Record<string, { realPlan: number; positivePlan: number }> }
  const plans: Record<string, Plan> = {}
  for (const [k, v] of Object.entries(data.plans ?? {})) {
    plans[k] = { real: v.realPlan, positive: v.positivePlan }
  }
  return plans
}

async function savePlanRemote(year: number, month: number, plan: Plan): Promise<void> {
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: planKey(year, month), realPlan: plan.real, positivePlan: plan.positive }),
  })
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
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, flex: 1 }}>
      <p style={{ fontSize: 11, color: '#8888aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
      <div className="flex justify-between items-baseline mb-1">
        <span style={{ fontSize: 13, color: '#f0f0ff' }}>{formatRub(revenue)}</span>
        <span style={{ fontSize: 12, color: '#8888aa' }}>из {formatRub(plan)}</span>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${Math.min(completionPct, 100)}%`, borderRadius: 999, background: gradientMap[color], transition: 'width 0.5s ease' }} />
      </div>
      <div className="flex justify-between">
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{completionPct.toFixed(1)}% выполнено</span>
        <span style={{ fontSize: 12, color: '#8888aa' }}>{today} из {daysInMonth} дн. ({daysElapsedPct.toFixed(0)}%)</span>
      </div>
    </div>
  )
}

export default function PlanBlock({ totalRevenue }: Props) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysElapsedPct = (today / daysInMonth) * 100
  const monthLabel = `${MONTH_NAMES_RU[month]} ${year}`
  const key = planKey(year, month)

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [networkError, setNetworkError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [realInput, setRealInput] = useState('')
  const [posInput, setPosInput] = useState('')
  const [toast, setToast] = useState(false)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setNetworkError(false)
    try {
      const plans = await fetchPlans()
      const p = plans[key] ?? null
      if (p) {
        saveToLocal(year, month, p)
        setPlan(p)
      } else {
        setPlan(null)
      }
    } catch {
      setNetworkError(true)
      setPlan(loadFromLocal(year, month))
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => { loadPlans() }, [loadPlans])

  function openForm() {
    setRealInput(plan ? String(plan.real) : '')
    setPosInput(plan ? String(plan.positive) : '')
    setEditing(true)
  }

  async function handleSave() {
    const r = parseFloat(realInput)
    const p = parseFloat(posInput)
    if (!r || !p) return
    const newPlan = { real: r, positive: p }
    setSaving(true)
    try {
      await savePlanRemote(year, month, newPlan)
      saveToLocal(year, month, newPlan)
      setPlan(newPlan)
      setEditing(false)
      setToast(true)
      setTimeout(() => setToast(false), 5000)
      loadPlans()
    } catch {
      saveToLocal(year, month, newPlan)
      setPlan(newPlan)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#f0f0ff', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.4)', padding: 20 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold" style={{ color: '#f0f0ff', letterSpacing: '0.05em' }}>
            План на {monthLabel}
          </h2>
          {plan && !editing && (
            <p style={{ fontSize: 12, color: '#8888aa', marginTop: 2 }}>
              Реальный: {formatRub(plan.real)} · Позитивный: {formatRub(plan.positive)}
            </p>
          )}
        </div>
        <button
          onClick={openForm}
          disabled={loading}
          style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: loading ? 'default' : 'pointer', border: '1px solid rgba(124,58,237,0.5)', color: '#a855f7', background: 'transparent', opacity: loading ? 0.5 : 1 }}
          onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = 'rgba(124,58,237,0.1)') }}
          onMouseLeave={e => { (e.currentTarget.style.background = 'transparent') }}
        >
          {plan ? 'Изменить план' : 'Установить план'}
        </button>
      </div>

      {/* Network error banner */}
      {networkError && !loading && (
        <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
          Не удалось загрузить план. Используются локальные данные.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p style={{ color: '#8888aa', fontSize: 13 }}>Загрузка плана...</p>
      )}

      {/* Inline form */}
      {!loading && editing && (
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
            <button onClick={handleSave} disabled={saving} style={{ padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: 'white', border: 'none', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button onClick={() => setEditing(false)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: 'transparent', color: '#8888aa', border: '1px solid rgba(255,255,255,0.1)' }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* No plan placeholder */}
      {!loading && !plan && !editing && (
        <p style={{ color: '#8888aa', fontSize: 13 }}>
          План не установлен — нажмите &laquo;Установить план&raquo;
        </p>
      )}

      {/* Progress bars */}
      {!loading && plan && !editing && (
        <div className="flex gap-4 flex-col md:flex-row">
          <PlanCard label="Реальный план" plan={plan.real} revenue={totalRevenue}
            completionPct={plan.real > 0 ? totalRevenue / plan.real * 100 : 0}
            daysElapsedPct={daysElapsedPct} today={today} daysInMonth={daysInMonth} />
          <PlanCard label="Позитивный план" plan={plan.positive} revenue={totalRevenue}
            completionPct={plan.positive > 0 ? totalRevenue / plan.positive * 100 : 0}
            daysElapsedPct={daysElapsedPct} today={today} daysInMonth={daysInMonth} />
        </div>
      )}

      {/* Save success toast */}
      {toast && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>План сохранён в Google Sheets ✓</span>
          <button onClick={() => setToast(false)} style={{ marginLeft: 'auto', fontSize: 16, color: '#8888aa', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
      )}
    </div>
  )
}
