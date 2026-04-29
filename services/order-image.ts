import axios from 'axios';

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

  preview_image: string | null; 
  
  final_combo_price: number;

  store_code: string | null;
}

export interface OrderImageResponse {
  id: string;
  order_number: string;
  sku_code: string;
  final_combo_price: number;
  status?: string;
  date_created?: string;
}

export interface DirectusOrderImageResponse {
  data: OrderImageResponse;
}

// --- Service ---

/**
 * Crea una nueva orden que incluye personalización de imagen (UV Print)
 * @param orderImageData Datos de la orden
 * @param token Token de acceso recibido del componente padre
 */
export const createOrderImage = async (
  orderImageData: CreateOrderImageBody,
  token: string | null
): Promise<DirectusOrderImageResponse> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const FOLDER_ID = process.env.NEXT_PUBLIC_DIRECTUS_CUSTOM_IMAGES_FOLDER;
  
  const endpoint = `${API_URL}/api/v1/orders`;

  // Combinamos los datos de la orden con el folder ID del .env
  const payload = {
    ...orderImageData,
    ...(FOLDER_ID && { folder: FOLDER_ID })
  };

  try {
    const response = await axios.post<DirectusOrderImageResponse>(
      endpoint,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      }
    );

    // Axios devuelve el body en .data. 
    // Como tu API ya devuelve { data: { ... } }, retornamos el objeto completo.
    return response.data;
  } catch (error: any) {
    console.error("Error en createOrderImage:", error.response?.data || error.message);
    const message = error.response?.data?.message || 'Error al procesar la orden con imagen';
    throw new Error(message);
  }
};