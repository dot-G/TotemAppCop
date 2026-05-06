import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const token = request.cookies.get('access_token')?.value
  const currentType = request.cookies.get('type_user')?.value
  const currentStore = request.cookies.get('current_store')?.value

  // --- REGLA 0: RUTAS ANÓNIMAS (QR) ---
  if (pathname.startsWith('/qr')) {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 2) return NextResponse.next()
  }

  // --- REGLA 1: AUTO-LOGIN PARA TÓTEM / STORE (Silent Auth) ---
  const isStorePath = pathname.startsWith('/store')
  const isTotemPath = pathname.startsWith('/totem')

  if (isStorePath || isTotemPath) {
    const parts = pathname.split('/')
    const incomingSlug = parts[2]
    const incomingType = isTotemPath ? 'totem' : 'store'

    if (token && currentType === incomingType && currentStore === incomingSlug) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const staticToken = isTotemPath 
      ? process.env.TOTEM_STATIC_TOKEN 
      : process.env.STORE_STATIC_TOKEN

    if (!staticToken) {
      return NextResponse.json({ error: "Security Config Missing" }, { status: 500 })
    }

    const response = NextResponse.rewrite(new URL('/', request.url))

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    }

    response.cookies.set('access_token', staticToken, cookieOptions)
    response.cookies.set('current_store', incomingSlug, { ...cookieOptions, httpOnly: false })
    response.cookies.set('type_user', incomingType, { ...cookieOptions, httpOnly: false })

    return response
  }

  // --- REGLA 2: LOGIN CON AUTO-LOGOUT ---
  if (pathname.startsWith('/login')) {
    // Si ya tiene un token y entra a /login, forzamos limpieza total antes de dejarlo seguir
    if (token) {
      const response = NextResponse.next()
      
      // Borramos cookies de sesión previa para "forzar" el logout silencioso
      response.cookies.delete('access_token')
      response.cookies.delete('type_user')
      response.cookies.delete('current_store')
      
      return response
    }
    return NextResponse.next()
  }

  // --- REGLA 3: PROTECCIÓN GENERAL ---
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Normalizar a 'operator' para logueados vía formulario manual
  if (token && !currentType) {
    const response = NextResponse.next()
    response.cookies.set('type_user', 'operator', {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|favicon.jpg|case.jpg).*)',
  ],
}