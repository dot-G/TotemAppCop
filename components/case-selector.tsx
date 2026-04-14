"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { Search, X, Loader2, ImageIcon } from "lucide-react"
import { useApp } from "@/hooks/use-app"
import { useCaseCuts } from "@/hooks/use-case"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { getImageUrl } from '@/lib/image-directus'
import { ColorSelector } from "./shared/color-selector2" 

export default function CaseSelector() {
  const { selection, updateSelection, isHydrated } = useApp()
  const { data: casesApi = [], isLoading } = useCaseCuts()
  
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [selectedImgIdx, setSelectedImgIdx] = useState(0)
  const [mounted, setMounted] = useState(false)
  
  const isInitialMounted = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  // Ahora selectedCase usa consistentemente .id
  const selectedCase = useMemo(() => {
    return casesApi.find(c => c.id === selection.caseId) || casesApi[0]
  }, [casesApi, selection.caseId])

  const gallery = useMemo(() => {
    if (!selectedCase) return []
    const extraImages = selectedCase.images?.map((img: any) => img.directus_files_id) || []
    return [selectedCase.featured_image, ...extraImages].filter(Boolean) as string[]
  }, [selectedCase])

  const handleCaseChange = useCallback((caseItem: any) => {
    if (!caseItem) return
  
    const rawPrice = caseItem.case_cut_type?.offerings?.[0]?.price || "0"
    const newCasePrice = parseFloat(rawPrice)
    const mainImage = caseItem.featured_image || null
  
    // Preparamos los colores para el Editor (PhoneCaseEditor)
    const availableColors = casesApi.map(c => ({
      caseId: c.id || "",
      colourId: c.colour?.id || "",
      name: c.colour?.name || c.name || "Sin nombre",
      hex: c.colour?.hex_code || "#000000"
    }))
  
    updateSelection({ 
      caseId: caseItem.id, // Esto es lo que ColorSelector usa como "id"
      caseName: caseItem.name,
      caseImage: mainImage,
      caseTypeId: caseItem.case_cut_type?.id || null, 
      
      colourId: caseItem.colour?.id || null,         
      caseColor: caseItem.colour?.name || "Standard",
      colourHex: caseItem.colour?.hex_code || null, 
      
      availableColors: availableColors, 
  
      config: {
        ...selection.config,
        prices: {
          ...selection.config?.prices,
          case: newCasePrice 
        }
      } as any
    })
  
    setSelectedImgIdx(0)
  }, [casesApi, selection.config, updateSelection])

  useEffect(() => {
    if (isHydrated && !isLoading && casesApi.length > 0 && !isInitialMounted.current) {
      const savedIdx = casesApi.findIndex(c => c.id === selection.caseId)
      if (!selection.caseId || savedIdx === -1) handleCaseChange(casesApi[0])
      isInitialMounted.current = true
    }
  }, [isHydrated, isLoading, casesApi, selection.caseId, handleCaseChange])

  if (!isHydrated || !mounted || isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#6b21a8]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full px-6 pb-28 pt-12 font-sans bg-[#f8fafc]">
      
      {/* SECCIÓN DE PREVIEW 50/50 */}
      <div className="flex items-stretch mb-10 min-h-[200px]">
        <div className="relative w-1/2 aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200 border-4 border-white shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCase?.id + '-' + selectedImgIdx}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
              {gallery[selectedImgIdx] ? (
                <Image 
                  src={`${getImageUrl(gallery[selectedImgIdx])}?width=200`}
                  alt="Case Preview" fill unoptimized 
                  className="object-cover object-center" priority 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                  <ImageIcon className="w-12 h-12 text-slate-200" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <button onClick={() => setIsGalleryOpen(true)} className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-900 shadow-lg z-10">
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="w-1/2 flex flex-col pl-6 py-2">
          <h3 className="text-[30px] font-semibold text-[#1d1d1f] leading-tight tracking-tight">
            {selectedCase?.name}
          </h3>
          <span className="text-[28px] font-semibold text-[#1d1d1f] mb-4 block">
            ${parseFloat(selectedCase?.case_cut_type?.offerings?.[0]?.price || "0").toFixed(0)}
          </span>
          <p className="text-[14px] text-slate-500 leading-relaxed font-normal mb-6">
            {selectedCase?.description || "Diseño ergonómico con corte láser de alta precisión."}
          </p>
          <div className="text-[12px] text-slate-400 font-bold tracking-wider">
             <p>Modelo: <span className="text-slate-700">{selectedCase?.case_cut_type?.name}</span></p>
             <p>Compatibilidad: <span className="text-slate-700">{selection.brand} {selection.model}</span></p>
          </div>
        </div>
      </div>

      {/* COLOR SELECTOR:
          Al haber corregido el componente para usar .id, 
          machea directo con casesApi[].id y selection.caseId.
      */}
      <ColorSelector 
        casesApi={casesApi} 
        selectedCaseId={selection.caseId} 
        onCaseChange={handleCaseChange} 
      />

      {/* MODAL DE GALERÍA */}
      {isGalleryOpen && mounted && createPortal(
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-white flex flex-col p-6">
            <button onClick={() => setIsGalleryOpen(false)} className="self-end p-2 mb-2"><X className="w-9 h-9" /></button>
            <div className="flex-1 w-full rounded-[2.5rem] relative mb-6 overflow-hidden bg-slate-50">
               <Image src={getImageUrl(gallery[selectedImgIdx])} alt="Zoom" fill unoptimized className="object-contain" />
            </div>
            <div className="grid grid-cols-4 gap-3 mb-8">
              {gallery.map((imgId, i) => (
                <button key={imgId} onClick={() => setSelectedImgIdx(i)} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${selectedImgIdx === i ? "border-slate-900" : "border-transparent opacity-40"}`}>
                  <Image src={`${getImageUrl(imgId)}?width=100`} alt="Thumb" fill unoptimized className="object-cover p-1" />
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