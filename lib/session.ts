// lib/session.ts
import { cookies } from 'next/headers';

/**
 * Recupera el token de acceso de forma segura en el servidor.
 * Centraliza la lógica para que cualquier Server Action o Route Handler 
 * pueda consumirlo sin conocer el nombre de la cookie.
 */
export async function getServerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value;
}

/**
 * Opcional: Una versión que lanza error si no hay sesión, 
 * útil para rutas protegidas.
 */
export async function requireServerToken(): Promise<string> {
  const token = await getServerToken();
  if (!token) throw new Error('Unauthorized');
  return token;
}