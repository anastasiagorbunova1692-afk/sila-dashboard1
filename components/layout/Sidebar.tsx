'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const nav = [
  { href: '/dashboard', label: 'Дашборд', icon: '⚡' },
  { href: '/analytics', label: 'Аналитика', icon: '📊' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden flex flex-col gap-1.5 p-2 rounded-xl"
        style={{ background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Меню"
      >
        <span className={`block w-5 h-0.5 bg-[#f0f0ff] transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-0.5 bg-[#f0f0ff] transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-[#f0f0ff] transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-[220px] flex flex-col transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{
          background: 'rgba(8,8,16,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SILA
            </span>
            <span className="text-[#8888aa] text-xs mt-1">картинг</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative"
                style={active ? {
                  background: 'rgba(124,58,237,0.15)',
                  color: '#a855f7',
                  borderLeft: '2px solid #7c3aed',
                  paddingLeft: 10,
                } : {
                  color: '#8888aa',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)'; (e.currentTarget as HTMLElement).style.color = '#f0f0ff' }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#8888aa' } }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[#8888aa] text-xs mb-2">v1.0</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
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
              }}
              title="Экспорт всех данных"
              style={{ fontSize: 11, color: '#8888aa', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', flex: 1 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#a855f7')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8888aa')}
            >
              💾 Экспорт
            </button>
            <label
              title="Импорт данных из файла"
              style={{ fontSize: 11, color: '#8888aa', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', flex: 1, textAlign: 'center' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#a855f7')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#8888aa')}
            >
              📂 Импорт
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = ev => {
                  try {
                    const parsed = JSON.parse(ev.target?.result as string) as Record<string, unknown>
                    let count = 0
                    Object.entries(parsed).forEach(([k, v]) => {
                      if (k.startsWith('plan_') || k.startsWith('analytics_month_')) {
                        localStorage.setItem(k, JSON.stringify(v)); count++
                      }
                    })
                    alert(`Восстановлено ${count} записей`)
                  } catch { alert('Ошибка импорта — неверный формат файла') }
                }
                reader.readAsText(file)
                e.target.value = ''
              }} />
            </label>
          </div>
        </div>
      </aside>
    </>
  )
}
