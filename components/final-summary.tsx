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

  // Usamos el número de orden real devuelto por la API en el paso anterior
  const reference = selection.orderSku  || "---"

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

    // 2. CASE
    if (selection.config?.includes_case) {
      items.push({
        title: `Case 3D - ${selection.caseColor || 'Standard'}`,
        price: selection.config.prices.case,
        desc: `Diseño para ${selection.model}.`,
        preview: selection.caseImage ? getImageUrl(selection.caseImage) : "/icons/case-placeholder.png"
      })
    }

    // 3. IMAGEN (CATÁLOGO O PERSONAL)
    // 3. IMAGEN (CATÁLOGO O PERSONAL)
    if (selection.config?.includes_uv_print) {
      const isCustom = selection.imageSourceType === "custom"
      
      // Determinamos el ID de la imagen:
      // Si es custom, usamos el ID que guardamos al subir (orderCustomImage)
      // Si es catálogo, usamos el catalog_image
      const imageId = isCustom 
        ? selection.orderCustomImage 
        : selection.catalog_image

      items.push({
        title: isCustom ? "Imagen personal" : "Diseño de catálogo",
        price: isCustom ? selection.imageCustomPrice : selection.imageBrandPrice,
        desc: isCustom ? "Tu foto personalizada." : "Arte seleccionado.",
        preview: imageId ? getImageUrl(imageId) : "/icons/image-placeholder.png"
      })
    }

    return items
  }, [selection])

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans overflow-hidden">
      
      <main className={`flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar transition-all duration-700 ${orderStatus !== 'completed' ? 'opacity-0 blur-lg scale-95' : 'opacity-100 blur-0 scale-100'}`}>
        
        {/* TARJETA DE RESUMEN TIPO TICKET */}
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">
          
          {/* Header de Referencia */}
          <div className="p-6 text-center border-b border-dashed border-slate-100 relative">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Referencia: <span className="text-[#6b21a8] uppercase">{reference}</span>
            </h2>
            {/* Círculos decorativos para efecto ticket */}
            <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#f8fafc] rounded-full border border-slate-100" />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#f8fafc] rounded-full border border-slate-100" />
          </div>

          {/* Listado de Items */}
          <div className="p-6 space-y-6">
            {summaryItems.map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                  <img 
                    src={item.preview || ""} 
                    className="w-full h-full object-cover" 
                    alt={item.title} 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between font-semibold text-slate-900 text-base">
                    <h4 className="tracking-tighter">{item.title}</h4>
                    <span>${item.price}</span>
                  </div>
                  <p className="text-[12px] text-slate-400 font-normal line-clamp-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Banner de Tiempo de Espera */}
          <div className="mx-6 p-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                <Clock className="w-5 h-5 text-emerald-500" />
             </div>
             <p className="text-[13px] font-semibold text-emerald-700 leading-tight">
                Tu pedido estará listo en 30 min.
             </p>
          </div>

          {/* Footer del Ticket: Total */}
          <div className="p-6 mt-4 bg-slate-50/50 border-t border-dashed border-slate-100 flex justify-between items-center">
            <span className="text-xl font-semibold text-slate-900">Precio paquete</span>
            <span className="text-4xl font-semibold text-[#6b21a8] tracking-tighter">${totalPrice}</span>
          </div>
        </div>

        <Button 
          onClick={() => nextStep()} 
          className="w-full h-16 rounded-[14px] bg-[#6b21a8] hover:bg-[#581c87] text-white font-semibold text-[18px] flex gap-3 active:scale-95 transition-all shadow-lg shadow-purple-200"
        >
          Generar Cupón de pago <ChevronRight size={24} />
        </Button>
      </main>

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
                    <Loader2 className="w-20 h-20 text-[#6b21a8] animate-spin stroke-[1px]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-2 h-2 bg-[#6b21a8] rounded-full animate-ping" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Confirmando</h2>
                    <p className="text-slate-400 font-bold text-[10px] tracking-[0.3em] uppercase">Preparando tu resumen final</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="s" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center max-w-sm">
                  <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-400 flex items-center justify-center mb-10 shadow-xl shadow-emerald-100">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-[36px] leading-none font-black text-slate-900 mb-6 uppercase tracking-tighter italic">¡Pedido enviado!</h2>
                  <p className="text-slate-500 text-lg font-medium leading-tight">
                    Tu orden <span className="text-[#6b21a8] font-bold">#{reference}</span> ha sido procesada correctamente.
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