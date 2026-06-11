'use client'

import { useState } from 'react'

interface MetricCardProps {
  label: string
  value: string
  subValue?: string
  subValueAccent?: string
  progressPct?: number
  color?: string
  // spark/sparkData accepted but intentionally unused (removed from UI)
  spark?: number[]
  sparkData?: number[]
}

export default function MetricCard({
  label,
  value,
  subValue,
  subValueAccent,
  progressPct,
  color,
}: MetricCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        boxShadow: hovered ? '0 4px 32px rgba(124,58,237,0.15)' : '0 4px 24px rgba(0,0,0,0.4)',
        padding: 16,
        transition: 'all 0.3s ease',
      }}
    >
      <p
        className="uppercase"
        style={{ fontSize: 11, color: '#8888aa', letterSpacing: '0.08em', marginBottom: 6 }}
      >
        {label}
      </p>

      <p style={{ fontSize: '1.4rem', fontWeight: 700, color: color ?? '#f0f0ff', lineHeight: 1.2 }}>
        {value}
      </p>

      {(subValue || subValueAccent) && (
        <p style={{ fontSize: 12, color: '#8888aa', marginTop: 4 }}>
          {subValue && <span>{subValue}</span>}
          {subValue && subValueAccent && <span> · </span>}
          {subValueAccent && <span style={{ color: '#a855f7' }}>{subValueAccent}</span>}
        </p>
      )}

      {progressPct !== undefined && (
        <div
          style={{
            height: 3,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
            marginTop: 8,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(progressPct, 100)}%`,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}
    </div>
  )
}
