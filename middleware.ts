import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  // 1. Si no hay token y no está en la página de login, redirigir a login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 2. Si ya hay token e intenta entrar al login, redirigir al inicio
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Configurar qué rutas debe filtrar el middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}