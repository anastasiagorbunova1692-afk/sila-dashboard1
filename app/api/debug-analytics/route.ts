import { NextResponse } from 'next/server'

const SHEET_ID = '1bRMnBP6B4c7mctDdya9EDxYVVonebgf5vjQvLLGO3Kc'

export async function GET() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('DB_Finance')}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 500 })
  }

  const text = await res.text()
  const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '')

  let data: { table?: { cols?: { label?: string; type?: string }[]; rows?: { c: ({ v: unknown } | null)[] }[] } }
  try {
    data = JSON.parse(jsonStr)
  } catch (e) {
    return NextResponse.json({ error: 'JSON parse failed', raw: text.slice(0, 500) }, { status: 500 })
  }

  const table = data.table ?? {}
  const cols = (table.cols ?? []).map((c) => ({ label: c.label ?? '', type: c.type ?? '' }))
  const allRows = (table.rows ?? []).map((row) =>
    (row.c ?? []).map((cell) => (cell ? cell.v : null))
  )

  return NextResponse.json({
    rowCount: allRows.length,
    cols,
    rows: allRows.slice(0, 10),
  })
}
