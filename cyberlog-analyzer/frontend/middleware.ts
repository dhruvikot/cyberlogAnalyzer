import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Token is stored in sessionStorage (client-side only).
// Middleware cannot access sessionStorage — auth is handled
// client-side in useAuth and page components.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
