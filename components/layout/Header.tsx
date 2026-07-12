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
      {/* On mobile: indent right of hamburger button (which is fixed top-left) */}
      <div className="md:ml-0 ml-12">
        <h1 className="text-lg md:text-xl font-semibold text-[#f0f0ff]" style={{ letterSpacing: '0.05em' }}>
          {title}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-block w-2 h-2 rounded-full bg-[#a855f7]" />
          <span className="text-[#a855f7] text-xs font-medium">Live</span>
          {timeStr && (
            <span className="text-[#8888aa] text-xs hidden sm:inline">· Обновлено в {timeStr}</span>
          )}
        </div>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm text-[#f0f0ff] transition-all duration-300 disabled:opacity-50"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minHeight: 44,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.2)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.5)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
          }}
        >
          <span className={loading ? 'animate-spin' : ''}>↻</span>
          {/* Show text only on desktop */}
          <span className="hidden sm:inline">{loading ? 'Загрузка...' : 'Обновить'}</span>
        </button>
      )}
    </div>
  )
}
