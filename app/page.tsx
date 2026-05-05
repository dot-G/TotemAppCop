import { Suspense } from "react";
import { AppShell2 } from "@/components/app-shell2";
import { getServerToken } from "@/lib/session";
import { getOnboardingSlides } from "@/services/onboarding";
import { getBrandsAndModels } from "@/services/phone-service2";
import { getCombos } from "@/services/combo-service2"; 
import { getMicas } from "@/services/mica-service2";
import { getCaseCuts } from "@/services/case-service2";
import { getCatalogOfferings } from "@/services/image-service2";

// Definimos correctamente los tipos de Next.js para searchParams
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  const token = await getServerToken();
  
  // En Next.js 15+ searchParams es una Promise, por eso usamos await
  //const params = await searchParams;
  //const storeCode = typeof params.store === 'string' ? params.store : null;

  // Carga de datos
  const [
    initialOnboarding, 
    initialBrands, 
    initialCombos, 
    initialMicas,
    initialCases,
    initialCatalog
  ] = await Promise.all([
    getOnboardingSlides(token),
    getBrandsAndModels(token),
    getCombos(token),
    getMicas(token),
    getCaseCuts(token),
    getCatalogOfferings(token),
  ]);

  return (
    // El Suspense es OBLIGATORIO cuando usamos componentes que leen URL en el cliente
    <Suspense fallback={<div className="h-screen bg-[#f8fafc]" />}>
      <AppShell2 
        initialOnboarding={initialOnboarding} 
        initialBrands={initialBrands} 
        initialCombos={initialCombos}
        initialMicas={initialMicas}
        initialCases={initialCases}
        initialCatalog={initialCatalog}
        token={token} 
       // storeCode={storeCode} 
      />
    </Suspense>
  );
}