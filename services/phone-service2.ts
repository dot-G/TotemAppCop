import Cookies from 'js-cookie';

export interface PhoneModel {
  id: string;
  name: string;
  segment: string;
  status: string;
  sort: number | null;
  has_mica: boolean;
  has_case: boolean;
  camera_layout: string;
}

export interface Brand {
  id: string;
  name: string;
  logo: string | null;
  status: string;
  sort: number;
  models: PhoneModel[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getBrandsAndModels = async (serverToken?: string): Promise<Brand[]> => {
  // Prioriza el token del servidor, si no, busca en cookies (cliente)
  const token = serverToken || Cookies.get('access_token');

  if (!token) {
    throw new Error('No se encontró sesión activa');
  }

  const endpoint = `${API_URL}/items/brands?filter[status][_eq]=active&sort=sort&fields=id,name,logo,status,sort,models.id,models.name,models.segment,models.has_mica,models.has_case,models.camera_layout,models.status,models.sort`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    next: { revalidate: 3600 } 
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/logout';
      return [];
    }
    throw new Error('Error al obtener el catálogo');
  }

  const json = await response.json();
  return json.data || [];
};