import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCatalogOfferings } from '@/services/image-service'; // Ajusta la ruta según tu estructura

// Clave única para el caché de catálogos de imágenes
export const CATALOG_OFFERINGS_KEY = ['catalog-offerings'];

/**
 * Hook para obtener el catálogo de imágenes (Marvel, Disney, etc.) desde Directus
 */
export function useCatalogOfferings() {
  return useQuery({
    queryKey: CATALOG_OFFERINGS_KEY,
    queryFn: getCatalogOfferings,
    // Mantenemos los catálogos en caché por 1 hora
    staleTime: 1000 * 60 * 60, 
    // Persistencia en memoria por 24 horas
    gcTime: 1000 * 60 * 60 * 24,
    // Reintentos en caso de fallo de red
    retry: 2,
  });
}

/**
 * Hook para pre-cargar los catálogos en segundo plano.
 * Útil para disparar la carga antes de que el usuario llegue a la sección de licencias.
 */
export function usePrefetchCatalogOfferings() {
  const queryClient = useQueryClient();
  
  return () => queryClient.prefetchQuery({
    queryKey: CATALOG_OFFERINGS_KEY,
    queryFn: getCatalogOfferings,
  });
}