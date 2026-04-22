/**
 * Interface del modelo de datos de Directus
 */
export interface OnboardSlide {
  id: string;
  title: string;
  description: string;
  image_caption: string;
  sort: number;
  image: {
    id: string;
  };
}

/**
 * Obtiene los slides de onboarding desde Directus.
 * @param token - Token Bearer (Estático de tienda o JWT de usuario).
 * Se pasa como argumento para soportar cookies HttpOnly desde el servidor.
 */
export const getOnboardingSlides = async (token?: string): Promise<OnboardSlide[]> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  if (!API_URL) {
    console.error("Critical: NEXT_PUBLIC_API_URL is not defined");
    return [];
  }

  const endpoint = `${API_URL}/items/onboards?sort=sort&fields=id,title,description,image_caption,sort,image.id`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      // Cache de Next.js: útil para que el tótem no pegue a la API en cada refresh
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Directus Error [${response.status}]:`, errorData);
      throw new Error('Error al obtener los datos de onboarding');
    }

    const json = await response.json();
    return json.data || [];

  } catch (error) {
    console.error("Fetch error in getOnboardingSlides:", error);
    // Devolvemos array vacío para no romper el renderizado del carrusel
    return [];
  }
};

/**
 * Función auxiliar para generar la URL de la imagen de Directus
 */
export const getDirectusImageUrl = (imageId: string): string => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  return `${API_URL}/assets/${imageId}`;
};