import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/auth/login', request.url))
  
  // Borrar cookies
  response.cookies.set('access_token', '', { path: '/', expires: new Date(0) })
  response.cookies.set('current_store', '', { path: '/', expires: new Date(0) })
  response.cookies.set('refresh_token', '', { path: '/', expires: new Date(0) })
  
  return response
}