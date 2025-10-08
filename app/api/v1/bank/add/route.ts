import { NextResponse } from 'next/server'

async function forwardRequest(targetUrl: string, req: Request) {
  const headers: Record<string, string> = {}
  // forward content-type and authorization if present
  if (req.headers.get('content-type')) headers['content-type'] = req.headers.get('content-type') as string
  if (req.headers.get('authorization')) headers['authorization'] = req.headers.get('authorization') as string

  const body = await req.text()

  const resp = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body,
  })

  const text = await resp.text()
  const contentType = resp.headers.get('content-type') || 'text/plain'

  return new NextResponse(text, {
    status: resp.status,
    headers: {
      'content-type': contentType,
    },
  })
}

export async function POST(req: Request) {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || ''
    if (!base) {
      return NextResponse.json({ message: 'No backend configured (NEXT_PUBLIC_API_BASE_URL)' }, { status: 500 })
    }

    const apiPath = '/api/v1/bank/add'
    const fallbackPath = '/bank/add'

    const primaryUrl = `${base.replace(/\/$/, '')}${apiPath}`
    const fallbackUrl = `${base.replace(/\/$/, '')}${fallbackPath}`

    // Try primary path first
    let resp = await fetch(primaryUrl, {
      method: req.method,
      headers: req.headers as any,
      body: await req.text(),
    })

    if (resp.status === 404) {
      // Try fallback
      resp = await fetch(fallbackUrl, {
        method: req.method,
        headers: req.headers as any,
        body: await req.text(),
      })
    }

    const text = await resp.text()
    const ct = resp.headers.get('content-type') || 'application/json'

    return new NextResponse(text, { status: resp.status, headers: { 'content-type': ct } })
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || String(err) }, { status: 500 })
  }
}
