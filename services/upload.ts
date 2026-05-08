import axios from 'axios';

export interface DirectusFileResponse {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  folder: string | null;
  filesize: number;
  width: number;
  height: number;
}

/**
 * Sube un archivo a Directus usando Axios.
 * @param file Archivo binario de la imagen
 * @param token Token de acceso recibido del componente padre
 */
export const uploadImageToDirectus = async (
  file: File,
  token: string | null
): Promise<DirectusFileResponse | null> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const FOLDER_ID = process.env.NEXT_PUBLIC_DIRECTUS_CUSTOM_IMAGES_FOLDER;

  // FormData equivale a los flags -F de un comando CURL
  const formData = new FormData();


  // Si existe el ID de la carpeta en el .env, lo adjuntamos
  if (FOLDER_ID) {
    formData.append("folder", FOLDER_ID);
  }
 formData.append("file", file);

  try {
    const response = await axios.post(`${API_URL}/files`, formData, {
      headers: {
        // Inyectamos el token recibido por parámetro
        ...(token && { Authorization: `Bearer ${token}` }),
        
        // Importante: No definir Content-Type manualmente.
        // Axios y el navegador gestionarán el boundary para el FormData.
      },
    });

    // Directus devuelve el objeto dentro de la propiedad 'data'
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error Directus Upload:",
      error.response?.data || error.message
    );
    return null;
  }
};