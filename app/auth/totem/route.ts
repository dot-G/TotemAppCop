import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  /**
   * 1. Gestión de Redirección y Captura de Store
   * El middleware nos envía algo como: /?store=visto
   */
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const targetUrl = new URL(callbackUrl, request.url);
  
  // Extraemos el valor de la tienda del query param si existe
  const storeValue = targetUrl.searchParams.get('store');
  
  // El token estático desde tu variable de entorno
  const staticToken = process.env.TOTEM_STATIC_TOKEN;

  // Validación de seguridad
  if (!staticToken) {
    console.error("ERROR: TOTEM_STATIC_TOKEN no está definido en el archivo .env");
    return NextResponse.json(
      { error: "Error de configuración en el servidor" }, 
      { status: 500 }
    );
  }

  // Preparamos la respuesta de redirección absoluta
  const res = NextResponse.redirect(targetUrl);

  /**
   * 2. Persistencia de Autenticación
   * Token de acceso para las llamadas a Directus/API
   */
  res.cookies.set('access_token', staticToken, {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 año
    path: '/',
  });

  /**
   * 3. Persistencia del Identificador de Tienda
   * Guardamos el slug (ej: 'visto') en una cookie.
   * Esto permite que el servidor y el cliente sepan qué tienda es
   * incluso si el usuario refresca la página en /prueba
   */
  if (storeValue) {
    res.cookies.set('current_store', storeValue, {
      httpOnly: false, // Permitimos que JS (Jotai) pueda leerla si es necesario
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 año
      path: '/',
    });
  }

  return res;
}