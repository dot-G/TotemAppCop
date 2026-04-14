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
 * Obtiene la lista de micas activas desde el endpoint de Offerings
 */
export const getMicas = async (): Promise<Mica[]> => {
  const token = Cookies.get('access_token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Campos requeridos según tu respuesta JSON
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
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener las micas');
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Error en getMicas service:", error);
    return [];
  }
};

/**
 * Función auxiliar para obtener la diferencia de precio respecto al combo base
 * Útil si quieres mostrar "+$50" en la UI al elegir una mica más cara
 */
export const calculateMicaSurcharge = (micaPrice: string, basePrice: number): number => {
  const price = parseFloat(micaPrice);
  const diff = price - basePrice;
  return diff > 0 ? diff : 0;
};