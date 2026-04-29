import axios from 'axios';

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
  store_code: string | null;    
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
 * Crea una nueva orden simple (Mica o Case liso) usando Axios.
 * @param orderData Datos de la orden.
 * @param token Token de acceso recibido del componente padre.
 */
export const createOrder = async (
  orderData: CreateOrderBody,
  token: string | null
): Promise<DirectusOrderResponse> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const endpoint = `${API_URL}/api/v1/orders`;

  try {
    const response = await axios.post<DirectusOrderResponse>(
      endpoint,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      }
    );

    // Axios ya entrega el body parseado en .data
    // Retornamos el objeto completo para mantener compatibilidad con el destructuring
    return response.data;
  } catch (error: any) {
    console.error("Error en createOrder:", error.response?.data || error.message);
    const message = error.response?.data?.message || 'Error al procesar la orden';
    throw new Error(message);
  }
};