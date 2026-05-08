import Cookies from 'js-cookie';

// --- Interfaces ---

export interface OfferingImageFile {
  id: string;
}

export interface OfferingImage {
  id: number;
  sort: number;
  directus_files_id: OfferingImageFile;
}

export interface CatalogOffering {
  id: string;
  type: string;
  section: string;
  offering_type: string;
  code: string;
  name: string;
  description: string;
  price: string;
  icon: string | null;
  featured_image: string | null;
  status: string;
  sort: number;
  images: OfferingImage[];
}

// --- Service ---

/**
 * Obtiene la lista de catálogos de imágenes activos.
 * @param token Opcional. Si se provee (en Server Components), se usa para la petición. 
 * Si no se provee, intenta obtenerlo de las cookies (Client Side).
 */
export const getCatalogOfferings = async (token?: string): Promise<CatalogOffering[]> => {
  // 1. Prioridad al token pasado por parámetro, sino buscamos en cookies
  const accessToken = token || Cookies.get('access_token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Definición de campos para traer la data necesaria de Directus incluyendo imágenes relacionadas
  const fields = [
    'id',
    'type',
    'section',
    'offering_type',
    'code',
    'name',
    'description',
    'price',
    'icon',
    'featured_image',
    'status',
    'sort',
    'images.id',
    'images.sort',
    'images.directus_files_id.id'
  ].join(',');

  // Filtramos por tipo catalog_image y estado activo
  const endpoint = `${API_URL}/items/offerings?filter[type][_eq]=catalog_image&filter[status][_eq]=active&sort=sort&fields=${fields}&deep[images][_sort]=sort`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
      },
      // Cache opcional: 3600 segundos (1 hora) si estás en Next.js App Router
      //next: { revalidate: 3600 } 
    } as any);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error Response:", errorData);
      throw new Error(`Error ${response.status} al obtener los catálogos de imágenes`);
    }

    const json = await response.json();
    
    // Aseguramos que siempre retorne un array
    return json.data || [];
    
  } catch (error) {
    console.error("Error en getCatalogOfferings service:", error);
    // Retornamos array vacío para no romper el flujo de Promise.all
    return [];
  }
};

/**
 * Helper para obtener el precio formateado del catálogo como número
 */
export const getOfferingPrice = (offering: CatalogOffering): number => {
  if (!offering || !offering.price) return 0;
  return parseFloat(offering.price);
};