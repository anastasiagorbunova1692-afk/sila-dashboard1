import { NextRequest, NextResponse } from 'next/server'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxRga7jflxMELmI9t4r9MvDaU7lFsJqp-HcYY39kBypp401GuLisjheAcHy4mIn1ZqDyg/exec'

export async function GET() {
  try {
    const res = await fetch(SCRIPT_URL, {
      cache: 'no-store',
      redirect: 'follow',
      headers: { 'Accept': 'application/json' },
    })
    const text = await res.text()
    if (text.trim().startsWith('<')) {
      return NextResponse.json({ success: false, error: 'Apps Script returned HTML instead of JSON', plans: {} })
    }
    const data = JSON.parse(text)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), plans: {} })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
    })
    const text = await res.text()
    if (text.trim().startsWith('<')) {
      return NextResponse.json({ success: false, error: 'Apps Script returned HTML instead of JSON' })
    }
    const data = JSON.parse(text)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
