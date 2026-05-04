import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Datos actuales de las cookies
  const token = request.cookies.get('access_token')?.value
  const currentType = request.cookies.get('type_user')?.value
  const currentStore = request.cookies.get('current_store')?.value

  const isStorePath = pathname.startsWith('/store')
  const isTotemPath = pathname.startsWith('/totem')
  const isAuthPage = pathname.startsWith('/auth')

  // --- REGLA 1: EXCEPCIÓN PARA PÁGINAS DE AUTH ---
  // Esto permite que /auth/login cargue siempre si no hay sesión
  if (isAuthPage) {
    if (token && pathname !== '/auth/totem') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // --- REGLA 2: FLUJO DE TIENDA / TÓTEM (URL DINÁMICA) ---
  if (isStorePath || isTotemPath) {
    const parts = pathname.split('/')
    const incomingSlug = parts[2] 
    const incomingType = isTotemPath ? 'totem' : 'store'

    /**
     * FORZAR RE-LOGIN SI:
     * - No hay token.
     * - O el tipo cambió (ej: de admin a totem, o de store a totem).
     * - O el slug cambió (ej: de STORE-01 a STORE-02).
     */
    if (!token || currentType !== incomingType || currentStore !== incomingSlug) {
      const loginUrl = new URL(`/auth/totem`, request.url)
      loginUrl.searchParams.set('callbackUrl', `/?${incomingType}=${incomingSlug}`)
      
      const response = NextResponse.redirect(loginUrl)
      
      // Limpieza profunda de cookies previas para evitar conflictos
      response.cookies.delete('access_token')
      response.cookies.delete('type_user')
      response.cookies.delete('current_store')
      
      return response
    }

    // Si ya coincide todo (mismo token, tipo y tienda), limpiar URL al Home
    return NextResponse.redirect(new URL('/', request.url))
  }

  // --- REGLA 3: PROTECCIÓN GENERAL (ADMIN / DASHBOARD) ---
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Matcher para interceptar todo excepto archivos estáticos y API interna
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}