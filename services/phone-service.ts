import Cookies from 'js-cookie';

// Definición de tipos para tener autocompletado total
export interface PhoneModel {
  id: string;
  name: string;
  segment: string;
  status: string;
  sort: number | null;
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

export const getBrandsAndModels = async (): Promise<Brand[]> => {
  const token = Cookies.get('access_token');

  // Si no hay token, lanzamos error antes de la petición
  if (!token) {
    throw new Error('No se encontró sesión activa');
  }

  const endpoint = `${API_URL}/items/brands?filter[status][_eq]=active&sort=sort&fields=id,name,logo,status,sort,models.id,models.name,models.segment,models.status,models.sort&deep[models][_filter][status][_eq]=active&deep[models][_sort]=sort`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    // React Query manejará el cache en el cliente, 
    // pero dejamos esto para optimización de Next.js
    next: { revalidate: 3600 } 
  });

  if (!response.ok) {
    if (response.status === 401) {
      // En un Kiosko, si falla el token, lo mandamos a limpiar sesión
      window.location.href = '/logout';
      return [];
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.errors?.[0]?.message || 'Error al obtener el catálogo');
  }

  const json = await response.json();
  
  // Siempre es bueno validar que recibimos un array para evitar errores de .map()
  return json.data || [];
};