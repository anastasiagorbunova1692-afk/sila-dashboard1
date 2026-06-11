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
        className="fixed top-4 left-4 z-50 md:hidden flex flex-col gap-1.5 p-2 rounded-lg bg-[#141414] border border-[#1f1f1f]"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Меню"
      >
        <span className={`block w-5 h-0.5 bg-[#f5f5f5] transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-0.5 bg-[#f5f5f5] transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-[#f5f5f5] transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-[220px] bg-[#0d0d0d] border-r border-[#1f1f1f] flex flex-col transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <span className="text-[#22c55e] text-2xl font-black tracking-tight">SILA</span>
            <span className="text-[#737373] text-xs mt-1">картинг</span>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative
                  ${active
                    ? 'text-[#22c55e] bg-[#22c55e]/10'
                    : 'text-[#737373] hover:text-[#f5f5f5] hover:bg-[#1a1a1a]'
                  }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#22c55e] rounded-r" />
                )}
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-[#1f1f1f]">
          <p className="text-[#737373] text-xs">v1.0</p>
        </div>
      </aside>
    </>
  )
}
