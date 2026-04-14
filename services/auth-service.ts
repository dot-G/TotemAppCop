// Definimos la interfaz según el JSON que recibes de la API
export interface AuthResponse {
  data: {
    expires: number;
    refresh_token: string;
    access_token: string;
  };
}

export const loginUser = async (credentials: any): Promise<AuthResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Manejo genérico de errores basado en la estructura de Directus/Custom API
    throw new Error(errorData?.errors?.[0]?.message || 'Error al iniciar sesión');
  }

  return response.json();
};

export const logoutUser = async () => {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Error al cerrar sesión');
  }

  return response.json();
};