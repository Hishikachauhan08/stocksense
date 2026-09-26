import { NextResponse, type NextRequest } from 'next/server'

const allowed = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim())

function corsHeaders(origin: string | null) {
  const allowOrigin = allowed.includes('*') ? '*' : origin && allowed.includes(origin) ? origin : allowed[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export function middleware(req: NextRequest) {
  const headers = corsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers })
  }
  const res = NextResponse.next()
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v)
  return res
}

export const config = { matcher: '/api/:path*' }
