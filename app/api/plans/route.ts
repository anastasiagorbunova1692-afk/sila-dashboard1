import { NextRequest, NextResponse } from 'next/server'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxRga7jflxMELmI9t4r9MvDaU7lFsJqp-HcYY39kBypp401GuLisjheAcHy4mIn1ZqDyg/exec'

export async function GET() {
  const res = await fetch(SCRIPT_URL, { cache: 'no-store' })
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data)
}
