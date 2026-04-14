import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCaseCuts } from '@/services/case-service';

// Clave única para el caché de fundas (Case Cuts)
export const CASES_KEY = ['cases-catalog'];

/**
 * Hook para obtener el catálogo de diseños de fundas desde Directus
 */
export function useCaseCuts() {
  return useQuery({
    queryKey: CASES_KEY,
    queryFn: getCaseCuts,
    // Mantenemos los diseños en caché por 1 hora
    staleTime: 1000 * 60 * 60, 
    // Persistencia en memoria por 24 horas
    gcTime: 1000 * 60 * 60 * 24,
    // Reintentos en caso de fallo de red
    retry: 2,
  });
}

/**
 * Hook para pre-cargar las fundas en el fondo.
 * ESTRATEGIA: Disparar este hook dentro del componente MicaSelector
 * para que cuando el usuario dé click en "Siguiente", las fundas ya estén listas.
 */
export function usePrefetchCases() {
  const queryClient = useQueryClient();
  
  return () => queryClient.prefetchQuery({
    queryKey: CASES_KEY,
    queryFn: getCaseCuts,
  });
}