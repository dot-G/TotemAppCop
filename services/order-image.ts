import Cookies from 'js-cookie';

// --- Interfaces ---

export interface CreateOrderImageBody {
  brand: string;
  model: string;
  customer_name: string;
  customer_email: string;
  customer_cell_phone: string;
  customer_place: "in_store" | "online";
  combo: string; 
  combo_includes_mica: boolean;
  combo_includes_case: boolean;
  combo_includes_uv_print: boolean;
  combo_includes_catalog_image: boolean;
  
  mica_combo_content?: string | null;
  case_combo_content?: string | null;

  case_cut?: string | null;          
  colour?: string | null;            
  
  uv_print_combo_content?: string | null;
  catalog_image_combo_content?: string | null; 
  
  image_source_type: "catalog" | "personal";
  catalog_image?: string | null; 
  personal_image?: string | null; 
  image_size: "small" | "medium" | "large";
  image_orientation_degrees: number; 
  
  final_combo_price: number;
}

/**
 * Interface que refleja la respuesta real de tu API
 */
export interface OrderImageResponse {
  id: string;
  order_number: string;
  sku_code: string;
  final_combo_price: number;
  status?: string;
  date_created?: string;
}

/**
 * Wrapper para la respuesta de Directus
 */
export interface DirectusOrderImageResponse {
  data: OrderImageResponse;
}

// --- Service ---

/**
 * Crea una nueva orden que incluye personalización de imagen (UV Print)
 */
export const createOrderImage = async (orderImageData: CreateOrderImageBody): Promise<DirectusOrderImageResponse> => {
  const token = Cookies.get('access_token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const endpoint = `${API_URL}/api/v1/orders`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(orderImageData)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Error al procesar la orden con imagen');
  }

  // IMPORTANTE: Retornamos el json completo (que contiene { data: { ... } })
  // para que el componente ContactForm pueda hacer destructuring de .data
  return await response.json();
};