/**
 * phone-case.service.ts
 */

// --- Interfaces ---

export interface DirectusFile {
  id: string;
  filename_download: string;
  width: number;
  height: number;
}

export interface GalleryImage {
  sort: number;
  directus_files_id: DirectusFile;
}

export interface PhoneCaseGallery {
  id: string;
  status: string;
  sort: number | null;
  featured_image: DirectusFile;
  model: {
    id: string;
    name: string;
    brand: {
      id: string;
      name: string;
    };
  };
  case_cut: {
    id: string;
    code: string;
    case_cut_type: {
      id: string;
      name: string;
    };
    colour: {
      id: string;
      name: string;
      hex_code: string;
    };
  };
  images: GalleryImage[];
}

// --- Service ---

/**
 * Obtiene las galerías de fundas activas (model_case_galleries)
 * @param token Token de acceso (opcional)
 * @param filters Filtros dinámicos para modelo, tipo de corte o color
 */
export const getPhoneCaseGalleries = async (
  token?: string,
  filters?: { modelId?: string; cutTypeId?: string; colourId?: string }
): Promise<PhoneCaseGallery[]> => {
  
  // Uso de variable de entorno como en tu ejemplo
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const fields = [
    "id", "status", "sort",
    "featured_image.id", "featured_image.filename_download", "featured_image.width", "featured_image.height",
    "model.id", "model.name", "model.brand.id", "model.brand.name",
    "case_cut.id", "case_cut.code", 
    "case_cut.case_cut_type.id", "case_cut.case_cut_type.name",
    "case_cut.colour.id", "case_cut.colour.name", "case_cut.colour.hex_code",
    "images.directus_files_id.id", "images.directus_files_id.filename_download", 
    "images.directus_files_id.width", "images.directus_files_id.height",
    "images.sort",
  ].join(",");

  const params = new URLSearchParams({
    "filter[status][_eq]": "active",
    "sort": "sort",
    "fields": fields,
    "deep[images][_sort]": "sort",
    "limit": "-1",
  });

  // Agregamos filtros solo si vienen informados
  if (filters?.modelId) params.append("filter[model][_eq]", filters.modelId);
  if (filters?.cutTypeId) params.append("filter[case_cut][case_cut_type][_eq]", filters.cutTypeId);
  if (filters?.colourId) params.append("filter[case_cut][colour][_eq]", filters.colourId);

  const endpoint = `${API_URL}/items/model_case_galleries?${params.toString()}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      // Configuración de caché para Next.js 13/14/15
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudo obtener la galería de fundas`);
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Error en getPhoneCaseGalleries service:", error);
    return [];
  }
};

/**
 * Helper para construir la URL de recursos de Directus
 */
export const getAssetUrl = (fileId: string): string => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  return `${API_URL}/assets/${fileId}`;
};