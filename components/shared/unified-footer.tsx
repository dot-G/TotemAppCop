"use client"

import React, { useMemo, useEffect, useState } from "react"
import { useApp } from "@/hooks/use-app"
import { useAtomValue } from "jotai"
import { totalSelectionPriceAtom, selectionAtom } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

export function UnifiedFooter() {
  const { currentStep, setStep, progress } = useApp()
  const selection = useAtomValue(selectionAtom)
  const totalPrice = useAtomValue(totalSelectionPriceAtom)
  
  // Estado para controlar si estamos en proceso de envío (desde ContactForm)
  const [isGlobalSubmitting, setIsGlobalSubmitting] = useState(false)

  // ESCUCHA DE EVENTOS: El ContactForm nos avisa si está subiendo datos
  useEffect(() => {
    const handleSubmitting = (e: any) => setIsGlobalSubmitting(e.detail)
    window.addEventListener("form-submitting", handleSubmitting)
    
    // Si cambiamos de paso por cualquier razón, reseteamos el loading
    return () => {
      window.removeEventListener("form-submitting", handleSubmitting)
    }
  }, [])

  // Reset local al cambiar de step para evitar que estados viejos afecten la UI
  useEffect(() => {
    setIsGlobalSubmitting(false)
  }, [currentStep])

  // LÓGICA DE VALIDACIÓN (Botón habilitado/deshabilitado)
  const canContinue = useMemo(() => {
    if (isGlobalSubmitting) return false

    switch (currentStep) {
      case "phone-selector":
        return !!selection.brand && !!selection.model

      case "image-selector":
        if (selection.imageSourceType === "brand") {
          return !!selection.catalog_image && selection.acceptedTerms === true
        }
        if (selection.imageSourceType === "custom") {
          return !!selection.imageCustomUrl
        }
        return false

      case "contact-form":
        const isNameValid = selection.contact.name.trim().length >= 3
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selection.contact.email)
        const isPhoneValid = selection.contact.phone.length >= 8
        return isNameValid && isEmailValid && isPhoneValid

      default:
        // ComboSelector y CaseSelector ya validan mediante sus propios hooks, 
        // pero aquí aseguramos que existan los IDs
        return true 
    }
  }, [currentStep, selection, isGlobalSubmitting])

  // ACCIÓN DEL BOTÓN
  const handleMainAction = () => {
    if (currentStep === "contact-form") {
      // Disparamos evento para que el Formulario de Contacto inicie el submit
      window.dispatchEvent(new CustomEvent("trigger-contact-submit"))
    } else {
      setStep(progress.next)
    }
  }

  // PASOS DONDE NO SE MUESTRA EL FOOTER (Onboarding, Éxito, etc.)
  if (["onboarding", "final-summary", "success", "payment"].includes(currentStep)) {
    return null
  }

  const isContactForm = currentStep === "contact-form"
  const buttonText = isContactForm ? "Confirmar Pedido" : "Siguiente"
  const shouldShowPrice = currentStep !== "phone-selector" && !!selection.model

  return (
    <footer className="p-4 shrink-0 z-[70] pb-6">
      <AnimatePresence mode="wait">
        {!isGlobalSubmitting ? (
          <motion.div
            key="footer-active-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* CARD DE RESUMEN Y PRECIO */}
            {selection.brand && (
              <div className="bg-white border border-[#3E3E3E] rounded-[14px] p-4 flex justify-between items-center mb-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-[16px] mb-0.5">Detalle de tu pedido</h4>
                  <p className="text-[#606166] font-normal text-[14px] leading-tight">

  
  {selection.micaName && `${selection.micaName}`}
  {selection.caseName && ` • Case ${selection.caseName}`}
  {selection.config?.includes_uv_print && (
    selection.imageSourceType === "brand" 
      ? ` • ${selection.selectedBrandTag || 'Diseño de catálogo'}` 
      : selection.imageSourceType === "custom" 
        ? " • Imagen personalizada" 
        : ""
  )}
</p>
                </div>

                {shouldShowPrice && (
                  <div className="text-right pl-4 border-l border-slate-200">
                    <p className="text-[13px] font-semibold">Desde</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      ${totalPrice.toLocaleString('es-AR')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* BOTÓN DE ACCIÓN PRINCIPAL */}
            <Button 
              disabled={!canContinue}
              onClick={handleMainAction}
              className={`w-full h-16 rounded-[14px] text-[20px] font-semibold transition-all duration-300
                ${canContinue 
                  ? "bg-[#6b21a8] text-white shadow-xl shadow-purple-100 active:scale-[0.97]" 
                  : "bg-slate-100 text-slate-300"}`}
            >
              {buttonText}
            </Button>
          </motion.div>
        ) : (
          /* ESTADO DE ENVÍO: Ocultamos el botón y mostramos un feedback sutil en el footer */
          <motion.div
            key="footer-submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-6"
          >
            <div className="flex items-center gap-3 text-[#6b21a8] font-black text-[11px] tracking-[0.3em] uppercase">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sincronizando Orden...</span>
            </div>
            <p className="text-[9px] text-[20px] font-semibold mt-2">
              Por favor, no cierres esta pantalla
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  )
}