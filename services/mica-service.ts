import Cookies from 'js-cookie';

// --- Interfaces ---

export interface Mica {
  id: string;
  type: "mica";
  offering_type: "product" | string;
  code: string;
  name: string;
  price: string;
  icon: string | null;
  featured_image: string | null;
  status: string;
}

// --- Service ---

/**
 * Obtiene la lista de micas activas desde el endpoint de Offerings.
 * Soporta ejecución en Server Components y Client Components.
 * 
 * @param serverToken - Opcional: token de acceso obtenido en el servidor.
 */
export const getMicas = async (serverToken?: string): Promise<Mica[]> => {
  // Prioridad: 1. Token manual (Server) -> 2. Cookie (Client)
  const token = serverToken || Cookies.get('access_token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Campos requeridos para la UI de selección
  const fields = [
    'id', 
    'type', 
    'offering_type', 
    'code', 
    'name', 
    'price', 
    'icon', 
    'featured_image', 
    'status'
  ].join(',');

  // Filtramos por tipo "mica" y estado "active"
  const endpoint = `${API_URL}/items/offerings?filter[type][_eq]=mica&filter[status][_eq]=active&fields=${fields}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      // Cache de Next.js por una hora
      //next: { revalidate: 60, tags: ['micas'] }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching micas:', errorData);
      throw new Error(`Error al obtener las micas: ${response.statusText}`);
    }

    const json = await response.json();
    console.log(json)
    return json.data || [];
  } catch (error) {
    console.error("Error en getMicas service:", error);
    // Retornamos array vacío para evitar que la app explote si falla la API
    return [];
  }
};

/**
 * Función auxiliar para obtener la diferencia de precio respecto al combo base.
 * Útil si quieres mostrar "+$50" en la UI al elegir una mica de mayor costo.
 */
export const calculateMicaSurcharge = (micaPrice: string, basePrice: number): number => {
  const price = parseFloat(micaPrice || "0");
  const diff = price - basePrice;
  return diff > 0 ? diff : 0;
};