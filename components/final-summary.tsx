"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useApp } from "@/hooks/use-app"
import { useAtomValue } from "jotai"
import { totalSelectionPriceAtom } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ChevronRight, Loader2, CheckCircle2, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getImageUrl } from "@/lib/image-directus"

export default function FinalSummary() {
  const { selection, nextStep } = useApp()
  const totalPrice = useAtomValue(totalSelectionPriceAtom)

  const [orderStatus, setOrderStatus] = useState<'processing' | 'success' | 'completed'>('processing')

  // Referencia SKU real de la orden creada
  const reference = selection.orderNumber || "---"

  useEffect(() => {
    const procTimer = setTimeout(() => {
      setOrderStatus('success')
      const successTimer = setTimeout(() => {
        setOrderStatus('completed')
      }, 3000)
      return () => clearTimeout(successTimer)
    }, 2500)
    return () => clearTimeout(procTimer)
  }, [])

  const summaryItems = useMemo(() => {
    const items = []

    // 1. MICA
    if (selection.config?.includes_mica) {
      items.push({
        title: selection.micaName || "Mica de vidrio templado",
        price: selection.config.prices.mica,
        desc: "Protección premium de pantalla.",
        preview: selection.micaImage ? getImageUrl(selection.micaImage) : "/icons/mica-placeholder.png"
      })
    }

    const selectedColor = selection.availableColors.find(c => c.caseId === selection.caseId);


    // 2. CASE
    if (selection.config?.includes_case) {
      selection.availableColors
      items.push({
        title: `Case 3D - ${selection.caseColor || 'Standard'}`,
        price: selection.config.prices.case,
        desc: `Diseño para ${selection.brand} ${selection.model.name}.`,
        preview: selectedColor?.caseImage
          ? getImageUrl(selectedColor.caseImage)
          : "/icons/case-placeholder.png"
      })
    }

    // 3. IMAGEN + SERVICIO DE IMPRESIÓN UV
    if (selection.config?.includes_uv_print) {
      const isCustom = selection.imageSourceType === "custom"

      // La imagen de preview: si es custom usamos el ID subido (orderCustomImage), 
      // si es brand usamos el catalog_image.
      const imageId = isCustom
        ? selection.orderCustomImage
        : selection.catalog_image

      // LÓGICA DE PRECIO:
      // Usamos directamente selection.config.prices.uv porque ya contiene el cálculo:
      // (Precio Base UV - Licencia Anterior) + Licencia Actual
      const totalImageStepPrice = selection.config.prices.uv || 0

      items.push({
        title: isCustom ? "Imagen personal + Impresión" : "Diseño catálogo + Impresión",
        price: totalImageStepPrice,
        desc: isCustom
          ? "Tu foto con acabado UV de alta resistencia."
          : "Arte seleccionado con acabado UV premium.",
        preview: imageId ? getImageUrl(imageId) : "/icons/image-placeholder.png"
      })
    }

    return items
  }, [selection])

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans overflow-hidden">

      <div className={`flex-1 p-3 space-y-4 overflow-y-auto no-scrollbar transition-all duration-700 ${orderStatus !== 'completed' ? 'opacity-0 blur-lg scale-95' : 'opacity-100 blur-0 scale-100'}`}>

        {/* TARJETA DE RESUMEN TIPO TICKET */}
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">

          {/* Header de Referencia */}
          <div className="p-3 text-center border-b border-dashed border-slate-100 relative">
            <h2 className="text-[16px] min-[960px]:text-[35px] font-semibold text-slate-900 tracking-tight">
              Referencia: <span className="text-[#1C42E8] uppercase">{reference}</span>
            </h2>
            <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#f8fafc] rounded-full border border-slate-100" />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#f8fafc] rounded-full border border-slate-100" />
          </div>

          {/* Listado de Items */}
          <div className="p-6 space-y-3">
            {summaryItems.map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-16 h-16 min-[960px]:w-40 min-[960px]:h-40 bg-slate-50 rounded-[8px] border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                  <img
                    src={item.preview || ""}
                    className="w-full h-full object-cover"
                    alt={item.title}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between font-semibold text-slate-900 text-[15px] min-[960px]:text-[32px]">
                    <h4 className="tracking-tighter">{item.title}</h4>
                    <span>${item.price}</span>
                  </div>
                  <p className="text-[12px] min-[960px]:text-[28px] text-slate-400 font-normal line-clamp-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Banner de Tiempo de Espera */}
          <div className="mx-6 p-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 w-fit min-[960px]:mx-auto">
            <Clock className="w-5 h-5 text-emerald-500 min-[960px]:w-8 min-[960px]:h-8" />

            <p className="text-[13px] min-[960px]:text-[22px] font-semibold text-emerald-700 leading-tight">
              Tu pedido estará listo en 30 min.
            </p>
          </div>

          {/* Footer del Ticket: Total */}
          <div className="px-6 py-3 min-[960px]:p-8 mt-4 bg-slate-50/50 border-t border-dashed border-slate-100 flex justify-between items-center">
            <span className="text-[16px] min-[960px]:text-[28px] font-semibold text-slate-900">Total a pagar</span>
            <span className="text-2xl min-[960px]:text-[52px] font-semibold text-[#1C42E8]">${totalPrice}</span>
          </div>
        </div>

        <Button
          onClick={() => nextStep()}
          className="w-full h-14 bg-[#1C42E8] rounded-[14px] text-[20px] min-[960px]:text-[35px] min-[960px]:h-28"
        >
          Generar Cupón de pago <ChevronRight size={18} className="min-[960px]:w-40 min-[960px]:h-40" />
        </Button>
      </div>

      {/* MODAL DE PROCESAMIENTO */}
      <AnimatePresence>
        {orderStatus !== 'completed' && (
          <motion.div
            initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center p-8 text-center"
          >
            <AnimatePresence mode="wait">
              {orderStatus === 'processing' ? (
                <motion.div key="p" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <Loader2 className="w-20 h-20 text-[#1C42E8] animate-spin stroke-[1px]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#1C42E8] rounded-full animate-ping" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-[28px] font-semibold text-slate-900">Confirmando...</h2>
                    <p className="text-slate-400 font-semibold text-[10px] tracking-[0.3em]">Preparando tu resumen final</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="s" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center max-w-sm">
                  <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-400 flex items-center justify-center mb-10 shadow-xl shadow-emerald-100">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-[28px] leading-none font-semibold text-slate-900 mb-6">¡Pedido enviado!</h2>
                  <p className="text-slate-500 text-lg font-medium leading-tight">
                    Tu orden <span className="text-[#1C42E8] font-semibold">#{reference}</span> ha sido procesada correctamente.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}