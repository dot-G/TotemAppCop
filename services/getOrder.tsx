// services/orderService.ts

export interface OrderData {
  id: string;
  order_number: string;
  sku_code: string;
  final_combo_price: number;
}

/**
 * Obtiene los detalles de una orden desde el endpoint de AI-Labs.
 */
export async function getOrder(slug: string): Promise<OrderData> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${API_URL}/api/v1/orders/${slug}`);
  
  if (!response.ok) {
    throw new Error(`Error al obtener la orden: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;
}