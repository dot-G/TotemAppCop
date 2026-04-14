export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper para imágenes de Directus
export const getImageUrl = (imageId: string) => {
  if (!imageId) return '';
  return `${API_URL}/assets/${imageId}`;
};