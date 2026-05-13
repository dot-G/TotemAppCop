"use client";

import { useState, useCallback, useEffect } from "react";
import { useApp } from "@/hooks/use-app";
import { AnimatePresence, motion } from "framer-motion";

// --- Types ---
import { OnboardSlide } from "@/services/onboarding";
import { Brand } from "@/services/phone-service";
import { Combo } from "@/services/combo-service";
import { Mica } from "@/services/mica-service";
import { CaseCut } from "@/services/case-service";
import { CatalogOffering } from "@/services/image-service";
import { PhoneCaseGallery } from "@/services/phone-case-service"; 
import { StepType } from "@/lib/store";

// --- UI Components ---
import { TelcelHeader } from "@/components/shared/telcel-header";
import { StepHeader } from "@/components/shared/step-header";
import { SimpleHeader } from "@/components/shared/simple-header";
import { UnifiedFooter } from "@/components/shared/unified-footer";
import { ExitModal } from "@/components/shared/exit-modal";
import { StepIndicator } from "@/components/shared/step-indicator2";

// --- Steps ---
import { Onboarding } from "./onboarding";
import PhoneSelectorPage from "./phone-selector";
import ComboSelector from "./combo-selector";
import MicaSelector from "./mica-selector";
import CaseSelector from "./case-selector";
import ImageSelector from "./catalog-selector";
import ContactForm from "./contact-form";
import FinalSummary from "./final-summary";
import Payment from "./payment";

// --- Configuración de Títulos ---
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
  initialGalleries?: PhoneCaseGallery[]; 
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
  initialGalleries = [], 
  token,
  storeCode
}: AppShell2Props) {
  const { 
    currentStep, 
    isHydrated, 
    progress, 
    resetApp,       // Método que limpia localStorage (telcel_selection, store_code, etc.)
    setStoreCode 
  } = useApp();
  
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  // --- LOGICA DE LIMPIEZA E INICIALIZACIÓN ---
  useEffect(() => {
    // Si estamos en el inicio, reseteamos todo el localStorage y estados de Jotai
    if (currentStep === 'onboarding') {
      resetApp();
    }

    // Seteamos el storeCode que viene del servidor (después del reset para que no se borre)
    if (storeCode) {
      setStoreCode(storeCode);
    }
  }, [storeCode, setStoreCode, resetApp, currentStep]);

  const handleFullReset = useCallback(() => {
    setIsExitModalOpen(false);
    resetApp();
  }, [resetApp]);

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
        return <CaseSelector initialCases={initialCases} initialGalleries={initialGalleries} />;
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
        min-[1100px]:aspect-[9/16] 
        min-[1100px]:max-w-[960px] 
        min-[1100px]:scale-70
        min-[1100px]:origin-center
        bg-[#f8fafc] shadow-2xl flex flex-col overflow-hidden"
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