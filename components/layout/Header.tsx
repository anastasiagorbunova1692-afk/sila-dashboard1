'use client'

interface HeaderProps {
  title: string
  updatedAt?: Date | null
  onRefresh?: () => void
  loading?: boolean
}

export default function Header({ title, updatedAt, onRefresh, loading }: HeaderProps) {
  const timeStr = updatedAt
    ? updatedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
      <div>
        <h1 className="text-xl font-bold text-[#f5f5f5]">{title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-block w-2 h-2 rounded-full bg-[#22c55e] animate-pulse-dot" />
          <span className="text-[#22c55e] text-xs font-medium">Live</span>
          {timeStr && (
            <span className="text-[#737373] text-xs">· Обновлено в {timeStr}</span>
          )}
        </div>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1f1f1f] bg-[#141414] hover:bg-[#1a1a1a] text-sm text-[#f5f5f5] transition-colors disabled:opacity-50"
        >
          <span className={loading ? 'animate-spin' : ''}>↻</span>
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      )}
    </div>
  )
}
