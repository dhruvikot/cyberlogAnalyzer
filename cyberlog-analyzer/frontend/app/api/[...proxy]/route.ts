import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000'

async function handler(req: NextRequest) {
  const path = req.nextUrl.pathname.replace('/api', '')
  const url = `${BACKEND_URL}/api${path}${req.nextUrl.search}`

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  // Forward cookies from browser to backend
  const cookie = req.headers.get('cookie')
  if (cookie) {
    headers.set('cookie', cookie)
  }

  let body: string | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.text()
    } catch {
      body = undefined
    }
  }

  const backendRes = await fetch(url, {
    method: req.method,
    headers,
    body,
    credentials: 'include',
  })

  const resHeaders = new Headers()

  // Forward Set-Cookie from backend to browser
  const setCookie = backendRes.headers.get('set-cookie')
  if (setCookie) {
    resHeaders.set('set-cookie', setCookie)
  }

  resHeaders.set(
    'content-type',
    backendRes.headers.get('content-type') || 'application/json'
  )

  const responseBody = await backendRes.text()

  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: resHeaders,
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const OPTIONS = handler
export const PATCH = handler
