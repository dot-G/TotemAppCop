import { useQuery } from '@tanstack/react-query';
import { OnboardSlide } from '@/services/onboarding';

export function useOnboarding(initialData: OnboardSlide[] = []) {
  return useQuery<OnboardSlide[]>({
    queryKey: ['onboarding-slides'],
    // Eliminamos el fetch. Si no hay datos, devolvemos el array vacío.
    queryFn: () => Promise.resolve(initialData), 
    initialData,
    // Configuramos para que nunca intente "refrescar" automáticamente
    staleTime: Infinity, 
    gcTime: Infinity,
    // Importante: Si ya tenemos initialData, no hay necesidad de que Query haga nada
    enabled: initialData.length > 0, 
  });
}