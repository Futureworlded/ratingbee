import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard']
const BOT_BLOCKLIST = ['scrapy', 'python-requests', 'curl', 'wget', 'zgrab', 'masscan', 'nmap']
const ALLOWED_COUNTRIES = ['US', 'CA', 'GB', 'AU', 'NZ', 'IE']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ua = (request.headers.get('user-agent') || '').toLowerCase()
  const country = request.headers.get('x-vercel-ip-country') || 'US'

  // Block bots
  if (BOT_BLOCKLIST.some(b => ua.includes(b))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Geo-restrict (allow US + English-speaking countries)
  if (!ALLOWED_COUNTRIES.includes(country) && !pathname.startsWith('/api/')) {
    return new NextResponse('Service not available in your region.', { status: 451 })
  }

  // Protect dashboard — redirect to home if no session
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const session = request.cookies.get('rb-session')
    if (!session) {
      return NextResponse.redirect(new URL('/?signin=required', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
