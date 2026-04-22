// app/page.tsx
import { AppShell2 } from "@/components/app-shell2";
import { getServerToken } from "@/lib/session"; // El helper que centraliza cookies
import { getOnboardingSlides } from "@/services/onboarding";

export default async function Page() {
  // 1. Rescatamos el token desde las cookies (Server Side)
  const token = await getServerToken();

  // 2. Buscamos la data directamente desde el servicio (Server Side)
  // Esto aprovecha el caché de Next.js (fetch con revalidate)
  const initialOnboarding = await getOnboardingSlides(token);

  return (
    <AppShell2 initialOnboarding={initialOnboarding} />
  );
}