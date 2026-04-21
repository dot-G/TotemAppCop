"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApp } from "@/hooks/use-app";
import { useQueryClient } from "@tanstack/react-query";
import { usePrefetchBrands, BRANDS_KEY } from "@/hooks/use-brands";
import { AnimatePresence, motion } from "framer-motion";

// UI Components
import { TelcelHeader } from "@/components/shared/telcel-header";
import { StepHeader } from "@/components/shared/step-header";
import { SimpleHeader } from "@/components/shared/simple-header";
import { UnifiedFooter } from "@/components/shared/unified-footer";
import { ExitModal } from "@/components/shared/exit-modal";
import { StepIndicator } from "@/components/shared/step-indicator";

// Steps
import { Onboarding } from "./onboarding";
import PhoneSelectorPage from "./phone-selector";
import ComboSelector from "./combo-selector";
import MicaSelector from "./mica-selector";
import CaseSelector from "./case-selector";
import ImageSelector from "./image-selector2";
import ContactForm from "./contact-form";
import FinalSummary from "./final-summary";
import Payment from "./payment";

export function AppShell() {
  const { currentStep, isHydrated, progress, resetApp } = useApp();
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const prefetch = usePrefetchBrands();

  useEffect(() => {
    if (isHydrated) prefetch();
  }, [isHydrated, prefetch]);

  const handleFullReset = useCallback(() => {
    setIsExitModalOpen(false);
    resetApp();
    queryClient.invalidateQueries({ queryKey: BRANDS_KEY });
  }, [resetApp, queryClient]);

  // --- MAPEO DE COMPONENTES ---
  const ActiveStep = useMemo(() => {
    switch (currentStep) {
      case "onboarding":     return Onboarding;
      case "phone-selector": return PhoneSelectorPage;
      case "combo-selector": return ComboSelector;
      case "mica-selector":  return MicaSelector;
      case "case-selector":  return CaseSelector;
      case "image-selector": return ImageSelector;
      case "contact-form":   return ContactForm;
      case "final-summary":  return FinalSummary;
      case "payment":        return Payment;
      default:               return Onboarding;
    }
  }, [currentStep]);

  if (!isHydrated) return null;

  const isOnboarding = currentStep === "onboarding";
  const isSummary = currentStep === "final-summary";
  const isPayment = currentStep === "payment";
  const showSubSteps = ["mica-selector", "case-selector", "image-selector"].includes(currentStep);

  const stepConfig: Record<string, { title: string }> = {
    "phone-selector": { title: "Selecciona tu celular" },
    "combo-selector": { title: "Elige tu combo" },
    "mica-selector": { title: "Protector de pantalla" },
    "case-selector": { title: "Funda de celular" },
    "image-selector": { title: "Personaliza tu diseño" },
    "contact-form": { title: "Enviar a producción" },
  };

  const stepNames: Record<string, string> = {
    onboarding: "Inicio",
    "phone-selector": "Tu celular",
    "combo-selector": "Tu combo",
    "mica-selector": "Protector",
    "case-selector": "Tu funda",
    "image-selector": "Diseño",
    "contact-form": "Contacto",
    "final-summary": "Resumen",
    payment: "Cupón de Pago",
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex justify-center overflow-hidden font-sans">
      <div className="w-full max-w-[380px] h-[100dvh] relative overflow-hidden shadow-2xl flex flex-col">
        
        {/* HEADER */}
        <AnimatePresence mode="wait">
          {!isOnboarding && (
            <motion.header
              key="app-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 z-[60]"
            >
              <TelcelHeader />
              {isPayment || isSummary ? (
                <SimpleHeader
                  title={isPayment ? "Cupón de Pago" : "Resumen de pedido"}
                  subtitle={isSummary ? "Referencia: A3B5C7D9" : ""}
                  onExitClick={() => setIsExitModalOpen(true)}
                />
              ) : (
                <StepHeader
                  currentStepNumber={progress.current}
                  totalSteps={progress.total}
                  title={stepConfig[currentStep]?.title || ""}
                  subtitle={`Siguiente: ${stepNames[progress.next] || "Finalizar"}`}
                  backTo={progress.previous}
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

        {/* CONTENIDO: Transición suave y SCROLL INTERNO */}
        <main className="flex-1 max-w-[380px] h-[100dvh] relative overflow-hidden bg-[#f8fafc]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: isOnboarding ? 0 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isOnboarding ? 0 : -30 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 35,
                opacity: { duration: 0.25 } 
              }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Este es el contenedor real del scroll */}
              <div className="h-full w-full overflow-y-auto no-scrollbar overscroll-contain">
                 <ActiveStep />
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