import Cookies from 'js-cookie';

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
 * Sube un archivo a la biblioteca de medios de Directus
 */
export const uploadImageToDirectus = async (file: File): Promise<DirectusFileResponse | null> => {
  const token = Cookies.get('access_token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Creamos el FormData necesario para el envío de archivos
  const formData = new FormData();
  formData.append('file', file);
  
  // Opcional: puedes añadir un título o carpeta específica
  // formData.append('title', `Upload-${Date.now()}`);
  // formData.append('folder', 'ID-DE-TU-CARPETA');

  try {
    const response = await fetch(`${API_URL}/files`, {
      method: 'POST',
      headers: {
        // Importante: No setear 'Content-Type', el navegador lo hace 
        // automáticamente con el boundary correcto para FormData
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error Directus Upload:', errorData);
      throw new Error('No se pudo subir la imagen');
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Error en uploadImage service:", error);
    return null;
  }
};

