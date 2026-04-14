// lib/utils.ts

/**
 * Genera la URL para un asset de Directus pasando por nuestro proxy seguro.
 * @param id - El ID del archivo en Directus.
 * @param params - Opciones de transformación (width, quality, etc).
 */
 export function getAssetUrl(
  id: string | null | undefined, 
  params?: Record<string, string | number>
): string {
  if (!id) return "";

  // Construimos la URL hacia nuestro endpoint interno
  // Al ser una ruta relativa, el navegador la resuelve correctamente
  const url = new URL(`/api/image/${id}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Devolvemos solo la ruta relativa para evitar problemas de hidratación
  return `${url.pathname}${url.search}`;
}