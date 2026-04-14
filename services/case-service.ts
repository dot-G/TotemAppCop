import Cookies from 'js-cookie';

// --- Interfaces ---

export interface CaseOffering {
  id: string; // UUID
  code: string;
  name: string;
  price: string; // "50.00"
}

export interface CaseCutType {
  id: string; // UUID
  name: string;
  offerings: CaseOffering[];
}

export interface CaseColour {
  id: string;       // Agregado para coincidir con la respuesta
  code: string;     // COL-RED
  name: string;     // Red
  hex_code: string; // #FF0000
}

export interface CaseImage {
  directus_files_id: string; // UUID del archivo
}

export interface CaseCut {
  id: string; // UUID
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
 */
export const getCaseCuts = async (): Promise<CaseCut[]> => {
  const token = Cookies.get('access_token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const fields = [
    'id', 'code', 'name', 'description', 'featured_image', 'status', 'sort', 'selected',
    'colour.id', 'colour.code', 'colour.name', 'colour.hex_code', // Incluimos colour.id
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
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener los diseños de fundas');
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
  // Según tu JSON, el precio está en case_cut_type.offerings[0].price
  const price = caseCut.case_cut_type?.offerings?.[0]?.price;
  return price ? parseFloat(price) : 0;
};