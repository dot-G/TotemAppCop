"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { X, Loader2, ImageIcon, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useApp } from "@/hooks/use-app"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { getImageUrl } from '@/lib/image-directus'
import { ColorSelector } from "./shared/color-selector" 
import { CaseCut } from "@/services/case-service"

interface CaseSelectorProps {
  initialCases: CaseCut[];
}

export default function CaseSelector({ initialCases = [] }: CaseSelectorProps) {
  const { selection, updateSelection, isHydrated } = useApp()
  const casesApi = initialCases;
  
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [selectedImgIdx, setSelectedImgIdx] = useState(0)
  const [mounted, setMounted] = useState(false)
  const isInitialMounted = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  const selectedCase = useMemo(() => {
    return casesApi.find(c => String(c.id) === String(selection.caseId)) || casesApi[0]
  }, [casesApi, selection.caseId])

  const gallery = useMemo(() => {
    if (!selectedCase) return []
    const extraImages = selectedCase.images?.map((img: any) => img.directus_files_id) || []
    return [selectedCase.featured_image, ...extraImages].filter(Boolean) as string[]
  }, [selectedCase])

  const handleCaseChange = useCallback((caseItem: CaseCut) => {
    if (!caseItem) return
    const rawPrice = caseItem.case_cut_type?.offerings?.[0]?.price || "0"
    const newCasePrice = parseFloat(rawPrice)
    const mainImage = caseItem.featured_image || null
    const availableColors = casesApi.map(c => ({
      caseId: c.id || "",
      colourId: c.colour?.id || "",
      name: c.colour?.name || c.name || "Sin nombre",
      hex: c.colour?.hex_code || "#000000"
    }))
  
    updateSelection({ 
      caseId: caseItem.id,
      caseName: caseItem.name,
      caseImage: mainImage,
      caseTypeId: caseItem.case_cut_type?.id || null, 
      colourId: caseItem.colour?.id || null,         
      caseColor: caseItem.colour?.name || "Standard",
      colourHex: caseItem.colour?.hex_code || null, 
      availableColors: availableColors, 
      config: {
        ...selection.config,
        prices: { ...selection.config?.prices, case: newCasePrice }
      } as any
    })
    setSelectedImgIdx(0)
  }, [casesApi, selection.config, updateSelection])

  useEffect(() => {
    if (isHydrated && casesApi.length > 0 && !isInitialMounted.current) {
      const savedIdx = casesApi.findIndex(c => String(c.id) === String(selection.caseId))
      if (!selection.caseId || savedIdx === -1) handleCaseChange(casesApi[0])
      isInitialMounted.current = true
    }
  }, [isHydrated, casesApi, selection.caseId, handleCaseChange])

  const paginate = (newDirection: number) => {
    const nextIdx = selectedImgIdx + newDirection
    if (nextIdx >= 0 && nextIdx < gallery.length) {
      setSelectedImgIdx(nextIdx)
    }
  }

  if (!isHydrated || !mounted || casesApi.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#6b21a8]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full px-6 pb-28 pt-12 font-sans bg-[#f8fafc]">
      
      <div className="flex items-stretch mb-10 min-h-[200px]">
        {/* Click en la imagen o en el icono de zoom abre la galería */}
        <div 
          onClick={() => setIsGalleryOpen(true)}
          className="relative w-1/2 aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200 border-4 border-white shrink-0 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCase?.id}-${selectedImgIdx}`}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
              {gallery[selectedImgIdx] ? (
                <Image 
                  src={`${getImageUrl(gallery[selectedImgIdx])}?width=400`}
                  alt="Case Preview" 
                  fill 
                  unoptimized 
                  className="object-cover object-center" 
                  priority 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                  <ImageIcon className="w-12 h-12 text-slate-200" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Icono de Zoom solicitado */}
          <div className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-900 shadow-lg z-10">
            <Search className="w-5 h-5" />
          </div>
        </div>

        <div className="w-1/2 flex flex-col pl-6 py-2">
          <h3 className="text-[22px] font-semibold text-[#1d1d1f] leading-tight">
            {selectedCase?.name}
          </h3>
          <p className="text-[14px] text-slate-500 leading-relaxed font-normal mb-4">
            {selectedCase?.description || "Diseño ergonómico con corte láser de alta precisión."}
          </p>
          <div className="text-[12px] text-slate-600 font-semibold tracking-wider space-y-1">
             <p>Modelo: <span className="text-slate-700 font-normal">{selectedCase?.case_cut_type?.name}</span></p>
             <p>Compatibilidad: <span className="text-slate-700 font-normal">{selection.brand} {selection.model}</span></p>
          </div>
          <ColorSelector casesApi={casesApi} selectedCaseId={selection.caseId} onCaseChange={handleCaseChange} />
        </div>
      </div>

      {/* MODAL DE GALERÍA MEJORADA */}
      {isGalleryOpen && mounted && createPortal(
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9999] bg-white flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 shrink-0">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">Galería {selectedImgIdx + 1}/{gallery.length}</span>
              <button onClick={() => setIsGalleryOpen(false)} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-transform">
                <X className="w-6 h-6 text-slate-900" />
              </button>
            </div>
            
            {/* Contenedor de Imagen con Drag y Fade */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden touch-none">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={selectedImgIdx}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.05 }}
                   transition={{ duration: 0.3 }}
                   drag="x"
                   dragConstraints={{ left: 0, right: 0 }}
                   dragElastic={0.4}
                   onDragEnd={(_, info) => {
                     if (info.offset.x < -60) paginate(1)
                     if (info.offset.x > 60) paginate(-1)
                   }}
                   className="w-full h-full p-4 flex items-center justify-center cursor-grab active:cursor-grabbing"
                 >
                   <Image 
                     src={getImageUrl(gallery[selectedImgIdx])} 
                     alt="Zoom" 
                     fill 
                     unoptimized 
                     className="object-contain pointer-events-none" 
                   />
                 </motion.div>
               </AnimatePresence>

               {/* Navegación lateral sutil */}
               {selectedImgIdx > 0 && (
                 <button onClick={() => paginate(-1)} className="absolute left-4 p-3 bg-white/30 backdrop-blur-sm rounded-full active:scale-90 transition-transform">
                   <ChevronLeft className="w-6 h-6 text-slate-400" />
                 </button>
               )}
               {selectedImgIdx < gallery.length - 1 && (
                 <button onClick={() => paginate(1)} className="absolute right-4 p-3 bg-white/30 backdrop-blur-sm rounded-full active:scale-90 transition-transform">
                   <ChevronRight className="w-6 h-6 text-slate-400" />
                 </button>
               )}
            </div>
            
            {/* Thumbnails inferiores */}
            <div className="p-6 overflow-x-auto no-scrollbar flex gap-3 bg-slate-50/50">
              {gallery.map((imgId, i) => (
                <button 
                  key={imgId} 
                  onClick={() => setSelectedImgIdx(i)} 
                  className={`relative shrink-0 w-20 aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedImgIdx === i ? "border-slate-900 scale-105" : "border-transparent opacity-50"
                  }`}
                >
                  <Image 
                    src={`${getImageUrl(imgId)}?width=150`} 
                    alt="Thumb" 
                    fill 
                    unoptimized 
                    className="object-cover" 
                  />
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}