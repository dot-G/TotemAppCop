import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cookieStore = cookies();
  
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const targetUrl = new URL(callbackUrl, request.url);
  
  // Parámetros que inyectó el middleware en el callbackUrl
  const storeValue = targetUrl.searchParams.get('store');
  const totemValue = targetUrl.searchParams.get('totem');

  // Si no hay parámetros, es un login manual (staff/admin)
  if (!storeValue && !totemValue) {
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  // Definición dinámica según el parámetro presente
  let incomingType: 'store' | 'totem' = totemValue ? 'totem' : 'store';
  let finalSlug = totemValue || storeValue;
  let staticToken = incomingType === 'totem' 
    ? process.env.TOTEM_STATIC_TOKEN 
    : process.env.STORE_STATIC_TOKEN;

  if (!staticToken) {
    console.error(`ERROR: Token para ${incomingType} no configurado en .env`);
    return NextResponse.json({ error: "Security Config Missing" }, { status: 500 });
  }

  const res = NextResponse.redirect(targetUrl);

  const cookieOptions = {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 365, // 1 año
    path: '/',
  };

  // Seteamos / Sobrescribimos cookies
  res.cookies.set('access_token', staticToken, cookieOptions);
  
  // Estas son httpOnly: false para que el cliente las lea
  res.cookies.set('current_store', finalSlug!, { ...cookieOptions, httpOnly: false });
  res.cookies.set('type_user', incomingType, { ...cookieOptions, httpOnly: false });

  return res;
}