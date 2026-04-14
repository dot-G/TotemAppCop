import Cookies from 'js-cookie';

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
 * Obtiene los slides de onboarding desde Directus
 */
export const getOnboardingSlides = async (): Promise<OnboardSlide[]> => {
  const token = Cookies.get('access_token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Endpoint con los campos específicos solicitados
  const endpoint = `${API_URL}/items/onboards?sort=sort&fields=id,title,description,image_caption,sort,image.id`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    throw new Error('Error al obtener los datos de onboarding');
  }

  const json = await response.json();
  return json.data || [];
};

/**
 * Función auxiliar para generar la URL de la imagen de Directus
 */
export const getDirectusImageUrl = (imageId: string): string => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  return `${API_URL}/assets/${imageId}`;
};