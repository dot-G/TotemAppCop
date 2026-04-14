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
 * Obtiene la lista de catálogos de imágenes activos
 */
export const getCatalogOfferings = async (): Promise<CatalogOffering[]> => {
  const token = Cookies.get('access_token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Definición de campos basada en tu query específica
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

  // Construcción del endpoint con filtros y ordenamiento profundo para las imágenes
  const endpoint = `${API_URL}/items/offerings?filter[type][_eq]=catalog_image&filter[status][_eq]=active&sort=sort&fields=${fields}&deep[images][_sort]=sort`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener los catálogos de imágenes');
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Error en getCatalogOfferings service:", error);
    return [];
  }
};

/**
 * Helper para obtener el precio formateado del catálogo
 */
export const getOfferingPrice = (offering: CatalogOffering): number => {
  return offering.price ? parseFloat(offering.price) : 0;
};