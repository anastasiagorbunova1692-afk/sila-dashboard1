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
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1a1a1a] transition-colors"
      >
        <span className="text-[#f5f5f5] font-semibold">{title}</span>
        <span className={`text-[#737373] transition-transform duration-300 ${open ? 'rotate-90' : ''}`}>▶</span>
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
