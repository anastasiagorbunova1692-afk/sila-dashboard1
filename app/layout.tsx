import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SILA Картинг — Дашборд',
  description: 'Аналитический дашборд картинг-центра SILA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="blob-tl" />
        <div className="blob-br" />
        {children}
      </body>
    </html>
  )
}
