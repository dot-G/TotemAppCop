"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useApp } from "@/hooks/use-app";
import { useQueryClient } from "@tanstack/react-query";
import { BRANDS_KEY } from "@/hooks/use-brands";
import { AnimatePresence, motion } from "framer-motion";

// --- Types ---
import { OnboardSlide } from "@/services/onboarding";
import { Brand } from "@/services/phone-service2";
import { Combo } from "@/services/combo-service2";
import { Mica } from "@/services/mica-service2";
import { CaseCut } from "@/services/case-service2";
import { CatalogOffering } from "@/services/image-service2";
import { StepType } from "@/lib/store";

// --- UI Components ---
import { TelcelHeader } from "@/components/shared/telcel-header";
import { StepHeader } from "@/components/shared/step-header";
import { SimpleHeader } from "@/components/shared/simple-header";
import { UnifiedFooter } from "@/components/shared/unified-footer";
import { ExitModal } from "@/components/shared/exit-modal";
import { StepIndicator } from "@/components/shared/step-indicator2";

// --- Steps ---
import { Onboarding } from "./onboarding2";
import PhoneSelectorPage from "./phone-selector2";
import ComboSelector from "./combo-selector2";
import MicaSelector from "./mica-selector2";
import CaseSelector from "./case-selector2";
import ImageSelector from "./catalog-selector";
import ContactForm from "./contact-form";
import FinalSummary from "./final-summary";
import Payment from "./payment";

// --- Constantes de Caché ---
export const COMBOS_KEY = ["combos"];
export const MICAS_KEY = ["offerings", "mica"];
export const CASES_KEY = ["offerings", "cases"];
export const CATALOG_KEY = ["offerings", "catalog"];

// Tipamos los Records con Partial<Record<StepType, ...>> para que acepten los pasos del enum
const STEP_CONFIG: Partial<Record<StepType, { title: string }>> = {
  "phone-selector": { title: "Selecciona tu celular" },
  "combo-selector": { title: "Elige tu combo" },
  "mica-selector": { title: "Protector de pantalla" },
  "case-selector": { title: "Case de celular" },
  "image-selector": { title: "Personaliza tu diseño" },
  "contact-form": { title: "Enviar a producción" },
};

const STEP_NAMES: Partial<Record<StepType, string>> = {
  onboarding: "Inicio",
  "phone-selector": "Tu celular",
  "combo-selector": "Tu combo",
  "mica-selector": "Protector",
  "case-selector": "Tu Case",
  "image-selector": "Diseño",
  "contact-form": "Contacto",
  "final-summary": "Resumen",
  payment: "Cupón de Pago",
};

interface AppShell2Props {
  initialOnboarding?: OnboardSlide[];
  initialBrands?: Brand[];
  initialCombos?: Combo[];
  initialMicas?: Mica[];
  initialCases?: CaseCut[];
  initialCatalog?: CatalogOffering[];
  token?: string;
  storeCode?: string | null;
}

export function AppShell2({ 
  initialOnboarding, 
  initialBrands, 
  initialCombos, 
  initialMicas = [],
  initialCases = [],
  initialCatalog = [],
  token,
  storeCode
}: AppShell2Props) {
  const { 
    currentStep, 
    isHydrated, 
    progress, 
    resetApp, 
    setStoreCode 
  } = useApp();
  
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (storeCode) {
      setStoreCode(storeCode);
    }
  }, [storeCode, setStoreCode]);

  useMemo(() => {
    if (initialBrands?.length) queryClient.setQueryData(BRANDS_KEY, initialBrands);
    if (initialCombos?.length) queryClient.setQueryData(COMBOS_KEY, initialCombos);
    if (initialMicas?.length) queryClient.setQueryData(MICAS_KEY, initialMicas);
    if (initialCases?.length) queryClient.setQueryData(CASES_KEY, initialCases);
    if (initialCatalog?.length) queryClient.setQueryData(CATALOG_KEY, initialCatalog);
  }, [initialBrands, initialCombos, initialMicas, initialCases, initialCatalog, queryClient]);

  const handleFullReset = useCallback(() => {
    setIsExitModalOpen(false);
    resetApp();
    queryClient.invalidateQueries({ queryKey: BRANDS_KEY });
    queryClient.invalidateQueries({ queryKey: COMBOS_KEY });
    queryClient.invalidateQueries({ queryKey: MICAS_KEY });
    queryClient.invalidateQueries({ queryKey: CASES_KEY });
    queryClient.invalidateQueries({ queryKey: CATALOG_KEY });
  }, [resetApp, queryClient]);

  const renderStep = () => {
    switch (currentStep) {
      case "onboarding":     
        return <Onboarding initialSlides={initialOnboarding} />;
      case "phone-selector": 
        return <PhoneSelectorPage initialBrands={initialBrands} token={token} />;
      case "combo-selector": 
        return <ComboSelector initialCombos={initialCombos} />;
      case "mica-selector":  
        return <MicaSelector initialMicas={initialMicas} />;
      case "case-selector":  
        return <CaseSelector initialCases={initialCases} />;
      case "image-selector": 
        return <ImageSelector initialCatalog={initialCatalog} />;
      case "contact-form":   
        return <ContactForm token={token || null} />;
      case "final-summary":  
        return <FinalSummary />;
      case "payment":        
        return <Payment />;
      default:               
        return <Onboarding initialSlides={initialOnboarding} />;
    }
  };

  if (!isHydrated) return null;

  const isOnboarding = currentStep === "onboarding";
  const isSummary = currentStep === "final-summary";
  const isPayment = currentStep === "payment";
  const showSubSteps = ["mica-selector", "case-selector", "image-selector"].includes(currentStep);

  return (
    <div className="w-full h-[100dvh] bg-[#0f172a] flex justify-center items-center overflow-hidden font-sans">
    <div className="
    relative h-full w-full 
    /* Comportamiento base (móvil) */
    aspect-auto 
    
    /* A partir de 1100px: Aspecto, límites y escalado */
    min-[1100px]:aspect-[9/16] 
    min-[1100px]:w-full 
    min-[1100px]:max-w-[960px] 
    min-[1100px]:mx-auto
    
    /* Escalado al 50% */
    min-[1100px]:scale-70
    min-[1100px]:origin-center
    
    bg-[#f8fafc] shadow-2xl flex flex-col overflow-hidden transition-transform duration-300"
>


        <AnimatePresence mode="wait">
          {!isOnboarding && (
            <motion.header
              key="app-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="shrink-0 z-[60]"
            >
              <TelcelHeader />
              {isPayment || isSummary ? (
                <SimpleHeader
                  title={isPayment ? "Cupón de Pago" : "Resumen de pedido"}
                  subtitle={isSummary ? "Referencia de compra" : ""}
                  onExitClick={() => setIsExitModalOpen(true)}
                />
              ) : (
                <StepHeader
                  currentStepNumber={progress.current}
                  totalSteps={progress.total}
                  title={STEP_CONFIG[currentStep]?.title || ""}
                  subtitle={`Sig: ${STEP_NAMES[progress.next as StepType] || "Fin"}`}
                  backTo={progress.previous as StepType}
                  onExitClick={() => setIsExitModalOpen(true)}
                />
              )}

              <AnimatePresence>
                {showSubSteps && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-50/50"
                  >
                    <StepIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.header>
          )}
        </AnimatePresence>

        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: isOnboarding ? 0 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isOnboarding ? 0 : -20 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 35, 
                opacity: { duration: 0.2 } 
              }}
              className="absolute inset-0 w-full h-full"
            >
              <div className="h-full w-full overflow-y-auto no-scrollbar overscroll-contain">
                 {renderStep()}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {!isSummary && <UnifiedFooter />}

        <ExitModal
          isOpen={isExitModalOpen}
          onClose={() => setIsExitModalOpen(false)}
          onConfirm={handleFullReset}
        />
      </div>
    </div>
  );
}