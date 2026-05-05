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

    // Si ya tiene sesión válida para esta tienda/tipo, lo mandamos al dashboard (home)
    if (token && currentType === incomingType && currentStore === incomingSlug) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Si no tiene token o cambió de tienda, inyectamos credenciales desde ENV
    const staticToken = isTotemPath 
      ? process.env.TOTEM_STATIC_TOKEN 
      : process.env.STORE_STATIC_TOKEN

    if (!staticToken) {
      console.error(`Security Config Missing for ${incomingType}`)
      return NextResponse.json({ error: "Security Config Missing" }, { status: 500 })
    }

    // Creamos la respuesta con REWRITE (mantiene la URL pero muestra el dashboard)
    const response = NextResponse.rewrite(new URL('/', request.url))

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 365, // 1 año para tótems
      path: '/',
    }

    // Seteamos las cookies necesarias
    response.cookies.set('access_token', staticToken, cookieOptions)
    response.cookies.set('current_store', incomingSlug, { ...cookieOptions, httpOnly: false })
    response.cookies.set('type_user', incomingType, { ...cookieOptions, httpOnly: false })

    return response
  }

  // --- REGLA 2: EXCEPCIÓN PARA PÁGINAS DE AUTH ---
  if (pathname.startsWith('/login')) {
    if (token) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // --- REGLA 3: PROTECCIÓN GENERAL ---
  // Si intenta entrar a cualquier otra ruta (incluyendo '/') sin token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}