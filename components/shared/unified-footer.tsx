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

  const [isGlobalSubmitting, setIsGlobalSubmitting] = useState(false)

  useEffect(() => {
    const handleSubmitting = (e: any) => setIsGlobalSubmitting(e.detail)
    window.addEventListener("form-submitting", handleSubmitting)
    return () => {
      window.removeEventListener("form-submitting", handleSubmitting)
    }
  }, [])

  useEffect(() => {
    setIsGlobalSubmitting(false)
  }, [currentStep])

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
        return true
    }
  }, [currentStep, selection, isGlobalSubmitting])

  const handleMainAction = () => {
    if (currentStep === "contact-form") {
      window.dispatchEvent(new CustomEvent("trigger-contact-submit"))
    } else {
      setStep(progress.next)
    }
  }

  if (["onboarding", "final-summary", "success", "payment"].includes(currentStep)) {
    return null
  }

  const isContactForm = currentStep === "contact-form"
  const buttonText = isContactForm ? "Confirmar Pedido" : "Siguiente"
  const shouldShowPrice = currentStep !== "phone-selector" && !!selection.model.id

  // Lógica para el label dinámico del precio
  const priceLabel = ["mica-selector", "combo-selector"].includes(currentStep) ? "Desde" : "Total"

  return (
    <footer className="p-4 shrink-0 z-[70] pb-4">
      <AnimatePresence mode="wait">
        {!isGlobalSubmitting ? (
          <motion.div
            key="footer-active-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {selection.brand && currentStep !== "phone-selector" && (
              <div className="bg-white border border-[#3E3E3E] rounded-[14px] px-3 min-[960px]:p-8 py-2 flex justify-between items-center mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-[14px] min-[960px]:text-[28px]  mb-0.5 truncate min-[960px]:max-w-[900px] max-w-[240px]">Detalle para {selection.brand} {selection.model.name}</h4>
                  <p className="text-[#606166] font-normal text-[14px] min-[960px]:text-[28px] leading-tight">
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
                  <div className="text-right pb-0 pt-0 pl-4 border-l border-slate-200 flex flex-col justify-center">
                    <p className="text-[12px] min-[960px]:text-[22px] font-semibold mb-[0px] leading-[tight] text-slate-500 tracking-wider">
                      {priceLabel}
                    </p>
                    <p className="text-2xl min-[960px]:text-[50px] font-semibold text-slate-900 leading-none">
                      ${totalPrice.toLocaleString('es-AR')}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              disabled={!canContinue}
              onClick={handleMainAction}
              className={`w-full h-14 rounded-[14px] text-[20px] min-[960px]:text-[35px] min-[960px]:h-28 font-semibold transition-all duration-300
    ${canContinue
                  ? "bg-[#6b21a8] text-white shadow-xl shadow-purple-100 active:scale-[0.97]"
                  : "bg-slate-100 text-slate-300"}`}
            >
              {buttonText}
            </Button>
          </motion.div>
        ) : (
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
            <p className="text-[12px] font-semibold mt-2 text-slate-900">
              Por favor, no cierres esta pantalla
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  )
}