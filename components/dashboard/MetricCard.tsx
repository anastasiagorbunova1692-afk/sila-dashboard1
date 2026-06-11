'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface MetricCardProps {
  label: string
  value: string
  subValue?: string
  sparkData?: number[]
  color?: string
}

export default function MetricCard({
  label,
  value,
  subValue,
  sparkData = [],
  color = '#22c55e',
}: MetricCardProps) {
  const chartData = sparkData.map((v, i) => ({ i, v: v ?? 0 }))

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:bg-[#1a1a1a] transition-colors">
      <p className="text-[#737373] text-xs font-medium mb-2">{label}</p>
      <p className="text-[#f5f5f5] text-2xl font-bold leading-tight">{value}</p>
      {subValue && <p className="text-[#737373] text-sm mt-0.5">{subValue}</p>}
      {chartData.length > 1 && (
        <div className="mt-3 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
