import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCombos } from '@/services/combo-service';

// Definimos la llave como una constante exportable
export const COMBOS_KEY = ['combos-catalog'];

/**
 * Hook para obtener los combos activos
 */
export function useCombos() {
  return useQuery({
    queryKey: COMBOS_KEY,
    queryFn: getCombos,
    // En un kiosko, el catálogo no cambia cada segundo, 
    // pero queremos que sea "fresco" al menos cada hora.
    staleTime: 1000 * 60 * 60, 
  });
}

/**
 * Hook para pre-cargar los combos (útil en el Onboarding o Home)
 */
export function usePrefetchCombos() {
  const queryClient = useQueryClient();
  
  return () => queryClient.prefetchQuery({
    queryKey: COMBOS_KEY,
    queryFn: getCombos,
  });
}