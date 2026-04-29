// --- Interfaces --- (Se mantienen igual)
export interface CaseOffering {
  id: string;
  code: string;
  name: string;
  price: string;
}

export interface CaseCutType {
  id: string;
  name: string;
  offerings: CaseOffering[];
}

export interface CaseColour {
  id: string;
  code: string;
  name: string;
  hex_code: string;
}

export interface CaseImage {
  directus_files_id: string;
}

export interface CaseCut {
  id: string;
  code: string;
  name: string;
  description: string;
  featured_image: string | null;
  status: string;
  sort: number;
  selected: boolean;
  colour: CaseColour | null;
  case_cut_type: CaseCutType | null;
  images: CaseImage[];
}

// --- Service ---

/**
 * Obtiene la lista de cortes de funda (Case Cuts) activos
 * @param token Token de acceso (obligatorio para llamadas desde el servidor)
 */
export const getCaseCuts = async (token?: string): Promise<CaseCut[]> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const fields = [
    'id', 'code', 'name', 'description', 'featured_image', 'status', 'sort', 'selected',
    'colour.id', 'colour.code', 'colour.name', 'colour.hex_code',
    'case_cut_type.id', 'case_cut_type.name',
    'case_cut_type.offerings.id', 'case_cut_type.offerings.code', 
    'case_cut_type.offerings.name', 'case_cut_type.offerings.price',
    'images.directus_files_id'
  ].join(',');

  const endpoint = `${API_URL}/items/case_cuts?filter[status][_eq]=active&sort=sort&fields=${fields}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      // Importante para Next.js 13+: 
      // Si quieres que se refresque, puedes usar { next: { revalidate: 3600 } }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudieron obtener los diseños de fundas`);
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Error en getCaseCuts service:", error);
    return [];
  }
};

/**
 * Helper para obtener el precio de un CaseCut.
 */
export const getCasePrice = (caseCut: CaseCut): number => {
  const price = caseCut.case_cut_type?.offerings?.[0]?.price;
  return price ? parseFloat(price) : 0;
};