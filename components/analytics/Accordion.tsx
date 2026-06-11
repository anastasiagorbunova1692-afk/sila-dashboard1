'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  preview?: React.ReactNode
}

export default function Accordion({ title, defaultOpen = false, children, preview }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [maxH, setMaxH] = useState(defaultOpen ? 'none' : '0px')

  useEffect(() => {
    if (!contentRef.current) return
    if (open) {
      setMaxH(contentRef.current.scrollHeight + 'px')
      const t = setTimeout(() => setMaxH('none'), 310)
      return () => clearTimeout(t)
    } else {
      setMaxH(contentRef.current.scrollHeight + 'px')
      requestAnimationFrame(() => setMaxH('0px'))
    }
  }, [open])

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-all duration-300"
        style={{ background: 'rgba(255,255,255,0.03)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
      >
        <span className="font-semibold" style={{ color: '#f0f0ff', letterSpacing: '0.05em' }}>{title}</span>
        <span
          className="transition-transform duration-300"
          style={{ color: '#7c3aed', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
        >
          ▶
        </span>
      </button>

      {!open && preview && (
        <div className="px-5 pb-5">{preview}</div>
      )}

      <div
        ref={contentRef}
        style={{ maxHeight: maxH, overflow: 'hidden', transition: 'max-height 300ms ease' }}
      >
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  )
}
