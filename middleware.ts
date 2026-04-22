import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  const isAuthPage = pathname.startsWith('/auth')
  
  // 1. Definición de rutas de Tótem
  const isStorePath = pathname.startsWith('/store')

  // FLUJO DE TÓTEM: Si intenta entrar a store y no tiene token
 if (isStorePath && !token) {
  const parts = pathname.split('/');
  const storeSlug = parts[2]; // Captura "visto" de /store/visto
  
  const loginUrl = new URL('/auth/totem', request.url);
  
  // Pasamos el slug como parámetro dentro del callbackUrl
  // URL resultante: /auth/totem?callbackUrl=/prueba?store=visto
  loginUrl.searchParams.set('callbackUrl', `/prueba?store=${storeSlug}`); 
  
  return NextResponse.redirect(loginUrl);
}

  // Si ya tiene token pero sigue en una ruta de /store que no es /prueba, 
  // lo movemos a /prueba para asegurar consistencia
  if (isStorePath && token && pathname !== '/prueba') {
    return NextResponse.redirect(new URL('/prueba', request.url));
  }

  // 2. Flujo normal de protección para el resto de la app (Admin/Dashboard)
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Evitar que un usuario logueado entre a páginas de login
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Excluimos estáticos y la propia ruta de auth/totem para evitar loops
  matcher: ['/((?!auth/totem|_next/static|_next/image|favicon.ico).*)'],
}