'use client'

import { useState } from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface MetricCardProps {
  label: string
  value: string
  subValue?: string
  sparkData?: number[]
}

export default function MetricCard({ label, value, subValue, sparkData = [] }: MetricCardProps) {
  const [hovered, setHovered] = useState(false)
  const chartData = sparkData.map((v, i) => ({ i, v: v ?? 0 }))

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        boxShadow: hovered ? '0 4px 32px rgba(124,58,237,0.15)' : '0 4px 24px rgba(0,0,0,0.4)',
        padding: 20,
        transition: 'all 0.3s ease',
      }}
    >
      <p
        className="text-xs font-medium mb-2 uppercase"
        style={{ color: '#8888aa', letterSpacing: '0.1em' }}
      >
        {label}
      </p>
      <p className="text-2xl font-bold leading-tight" style={{ color: '#f0f0ff' }}>{value}</p>
      {subValue && <p className="text-sm mt-0.5" style={{ color: '#8888aa' }}>{subValue}</p>}
      {chartData.length > 1 && (
        <div className="mt-3 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`sg-${label.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#7c3aed"
                strokeWidth={1.5}
                fill={`url(#sg-${label.replace(/\s/g,'')})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
