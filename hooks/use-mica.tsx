import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMicas } from '@/services/mica-service';

// Clave única para el caché de micas
export const MICAS_KEY = ['micas-offerings'];

/**
 * Hook para obtener el catálogo de micas desde Directus
 */
export function useMicas() {
  return useQuery({
    queryKey: MICAS_KEY,
    queryFn: getMicas,
    // Mantenemos los datos frescos por 1 hora (ajustable según necesidad del kiosko)
    staleTime: 1000 * 60 * 60, 
    // Mantenemos los datos en caché incluso si el componente se desmonta
    gcTime: 1000 * 60 * 60 * 24,
  });
}

/**
 * Hook para pre-cargar las micas en el fondo.
 * Útil para dispararlo cuando el usuario está en 'phone-selector' o 'combo-selector'.
 */
export function usePrefetchMicas() {
  const queryClient = useQueryClient();
  
  return () => queryClient.prefetchQuery({
    queryKey: MICAS_KEY,
    queryFn: getMicas,
  });
}