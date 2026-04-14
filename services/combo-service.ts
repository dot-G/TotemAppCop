import Cookies from 'js-cookie';
// --- Interfaces ---

export interface ComboContent {
  id: string;
  name: string;
  code: string;
  price: string;
  icon: string | null;
  sort: number;
  case_cut_type?: string; // Solo presente en case_combo_content
}

export interface Combo {
  id: string;
  code: string;
  name: string;
  description: string;
  includes_mica: boolean;
  includes_case: boolean;
  includes_uv_print: boolean;
  icon: string | null;
  featured_image: string;
  status: string;
  sort: number;
  mica_combo_content: ComboContent | null;
  case_combo_content: ComboContent | null;
  uv_print_combo_content: ComboContent | null;
}

// --- Service ---

/**
 * Obtiene la lista de combos activos desde el endpoint de Directus
 */
export const getCombos = async (): Promise<Combo[]> => {
  const token = Cookies.get('access_token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Endpoint configurado con filtros de estado y campos específicos
  const fields = [
    'id', 'code', 'name', 'description', 'includes_mica',
    'mica_combo_content.id', 'mica_combo_content.name', 'mica_combo_content.code', 
    'mica_combo_content.price', 'mica_combo_content.icon', 'mica_combo_content.sort',
    'includes_case', 
    'case_combo_content.id', 'case_combo_content.case_cut_type', 'case_combo_content.name', 
    'case_combo_content.code', 'case_combo_content.price', 'case_combo_content.icon', 'case_combo_content.sort',
    'includes_uv_print', 
    'uv_print_combo_content.id', 'uv_print_combo_content.name', 'uv_print_combo_content.code', 
    'uv_print_combo_content.price', 'uv_print_combo_content.icon', 'uv_print_combo_content.sort',
    'icon', 'featured_image', 'status', 'sort'
  ].join(',');

  const endpoint = `${API_URL}/items/combos?filter[status][_eq]=active&sort=sort&fields=${fields}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    throw new Error('Error al obtener los combos');
  }

  const json = await response.json();
  return json.data || [];
};

/**
 * Función auxiliar para obtener el precio total del combo (suma de sus partes)
 * Útil para mostrar en la UI del kiosko
 */
export const calculateComboPrice = (combo: Combo): number => {
  let total = 0;
  if (combo.mica_combo_content) total += parseFloat(combo.mica_combo_content.price);
  if (combo.case_combo_content) total += parseFloat(combo.case_combo_content.price);
  if (combo.uv_print_combo_content) total += parseFloat(combo.uv_print_combo_content.price);
  return total;
};