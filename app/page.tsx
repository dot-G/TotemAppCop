import { Suspense } from "react";
import { AppShell2 } from "@/components/app-shell";
import { getServerToken } from "@/lib/session";
import { getOnboardingSlides } from "@/services/onboarding";
import { getBrandsAndModels } from "@/services/phone-service";
import { getCombos } from "@/services/combo-service"; 
import { getMicas } from "@/services/mica-service";
import { getCaseCuts } from "@/services/case-service";
import { getPhoneCaseGalleries } from "@/services/phone-case-service";
import { getCatalogOfferings } from "@/services/image-service";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page({ searchParams }: PageProps) {
  const token = await getServerToken();
  
  // Si necesitas el storeCode en el futuro:
  const params = await searchParams;
  const storeCode = typeof params.store === 'string' ? params.store : null;

  // Carga de datos en paralelo
  const [
    initialOnboarding, 
    initialBrands, 
    initialCombos, 
    initialMicas,
    initialCases,
    initialGalleries, // Renombrado para mayor claridad según el servicio
    initialCatalog
  ] = await Promise.all([
    getOnboardingSlides(token),
    getBrandsAndModels(token),
    getCombos(token),
    getMicas(token),
    getCaseCuts(token),
    getPhoneCaseGalleries(token),
    getCatalogOfferings(token),
  ]);

  return (
    <Suspense fallback={<div className="h-screen bg-[#f8fafc]" />}>
      <AppShell2 
        initialOnboarding={initialOnboarding} 
        initialBrands={initialBrands} 
        initialCombos={initialCombos}
        initialMicas={initialMicas}
        initialCases={initialCases}
        initialGalleries={initialGalleries} // Pasamos la data de las galerías aquí
        initialCatalog={initialCatalog}
        token={token} 
        storeCode={storeCode} 
      />
    </Suspense>
  );
}