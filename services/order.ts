import Cookies from 'js-cookie';

// --- Interfaces ---

export interface CreateOrderBody {
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
  final_combo_price: number;
}

export interface OrderResponse {
  id: string;
  order_number: string;
  sku_code: string;
  final_combo_price: number;
  status?: string;
  date_created?: string;
}

export interface DirectusOrderResponse {
  data: OrderResponse;
}

// --- Service ---

/**
 * Crea una nueva orden simple (Mica o Case liso)
 */
export const createOrder = async (orderData: CreateOrderBody): Promise<DirectusOrderResponse> => {
  const token = Cookies.get('access_token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const endpoint = `${API_URL}/api/v1/orders`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Error al procesar la orden');
  }

  // Retornamos el JSON completo que contiene { data: { ... } }
  return await response.json();
};