import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBrandsAndModels } from '@/services/phone-service';

export const BRANDS_KEY = ['brands-catalog'];

export function useBrands() {
  return useQuery({
    queryKey: BRANDS_KEY,
    queryFn: getBrandsAndModels,
    staleTime: 1000 * 60 * 60, 
  });
}

// ESTA ES LA PARTE CLAVE
export function usePrefetchBrands() {
  const queryClient = useQueryClient();
  
  // Devolvemos la función directamente
  return () => queryClient.prefetchQuery({
    queryKey: BRANDS_KEY,
    queryFn: getBrandsAndModels,
  });
}