import { useQuery } from '@tanstack/react-query';
import { getOnboardingSlides } from '@/services/onboarding-service';

export const ONBOARDING_KEY = ['onboarding-slides'];

export function useOnboarding() {
  return useQuery({
    queryKey: ONBOARDING_KEY,
    queryFn: getOnboardingSlides,
    staleTime: 1000 * 60 * 60 * 24, // Los datos de onboarding cambian poco, guardamos 24h
  });
}