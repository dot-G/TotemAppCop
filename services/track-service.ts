import Cookies from 'js-cookie';

/**
 * Tipos para el tracking de búsquedas faltantes
 */
export type TrackType = "brand" | "model";

export interface TrackParams {
  type: TrackType;
  terms: string[];
  brand?: string; // Solo requerido si type === "model"
  token?: string; // Token opcional para SSR o llamadas manuales
}

/**
 * Registra términos de búsqueda que no están en el catálogo.
 * Soporta el paso de token por parámetro o extracción desde cookies en el cliente.
 */
export const trackMissingTerms = async ({ 
  type, 
  terms, 
  brand, 
  token 
}: TrackParams): Promise<boolean> => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  
  // Si no viene token por parámetro, intentamos sacarlo de la cookie (Client Side)
  const activeToken = token || Cookies.get('access_token');

  if (!API_BASE) {
    console.error("Critical: NEXT_PUBLIC_API_URL is not defined");
    return false;
  }

  if (!activeToken) {
    console.warn("Track Service: No session token available");
    return false;
  }

  const endpoint = `${API_BASE}/api/v1/search-terms/track`;

  const payload = {
    search: {
      type,
      ...(type === "model" && brand ? { brand } : {}),
      terms,
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeToken}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Track Service Error [${response.status}]:`, errorData);
      return false;
    }

    return true;

  } catch (error) {
    console.error("Fetch error in trackMissingTerms:", error);
    return false;
  }
};

/**
 * Helpers actualizados para soportar token opcional
 */

export const trackMissingBrand = (name: string, token?: string) => 
  trackMissingTerms({ type: "brand", terms: [name], token });

export const trackMissingModel = (brand: string, model: string, token?: string) => 
  trackMissingTerms({ type: "model", brand, terms: [model], token });