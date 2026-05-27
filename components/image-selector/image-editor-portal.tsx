"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, RotateCw, Minimize2, Square, Maximize, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function ImageEditorPortal({ 
  view, title, editorTarget, config, caseHex, tempImg, 
  onBack, onRotate, onSize, onConfirm, onSelectImg, galleryImages 
}: any) {
  
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})

  // Limpiar estados de carga si cambias de galería para evitar conflictos
  useEffect(() => {
    setLoadingIds({})
  }, [view])

  const getImageStyle = () => {
    const rotation = config.rotation
    let baseScale = config.size === "Mediana" ? 0.75 : config.size === "Pequeña" ? 0.5 : 1
    const finalScale = Math.abs(rotation % 180) === 90 ? baseScale * 0.7 : baseScale
    
    return {
      transform: `rotate(${rotation}deg) scale(${finalScale})`,
      transition: "transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)",
    }
  }

  return (
    <motion.div 
      initial={{ x: "100%" }} 
      animate={{ x: 0 }} 
      exit={{ x: "100%" }} 
      transition={{ type: "tween", ease: "circOut", duration: 0.5 }}
      className="fixed inset-0 z-[150] bg-white flex flex-col font-sans"
    >
      {/* HEADER */}
      <div className="p-4 border-b flex items-center gap-4 pt-12 shrink-0 bg-white">
        <button onClick={onBack} className="p-2 active:scale-90 transition-transform">
          <ArrowLeft className="text-slate-900" />
        </button>
        <h3 className="font-black uppercase text-[11px] tracking-widest text-slate-900 flex-1 text-center pr-10">
          {title}
        </h3>
      </div>

      <div className="flex-1 relative bg-slate-50 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'gallery' ? (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full p-6 grid grid-cols-3 gap-3 overflow-y-auto no-scrollbar"
            >
              {galleryImages?.map((img: any) => {
                const isStillLoading = loadingIds[img.id] !== false;

                return (
                  <button 
                    key={img.id} 
                    onClick={() => onSelectImg(img.url)} 
                    className={`aspect-[3/4] rounded-2xl relative border-4 overflow-hidden transition-all bg-slate-200 
                      ${tempImg === img.url ? "border-[#6b21a8] p-1.5 shadow-lg bg-white" : "border-transparent"}`}
                  >
                    {isStillLoading && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-100">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      </div>
                    )}
                    <Image 
                      src={img.url} 
                      alt="Gallery item"
                      fill
                      unoptimized // <--- Crucial para rutas locales y evitar el error "received null"
                      sizes="200px"
                      className={`object-cover rounded-xl transition-opacity duration-300 ${!isStillLoading ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setLoadingIds(prev => ({ ...prev, [img.id]: false }))}
                    />
                  </button>
                )
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full h-full flex flex-col items-center justify-center p-6"
            >
              <div 
                className="relative w-52 aspect-[3/4.2] rounded-[3rem] shadow-2xl border-[10px] overflow-hidden mb-10 flex items-center justify-center transition-colors duration-500"
                style={{ borderColor: caseHex, backgroundColor: caseHex }}
              >
                {editorTarget?.url && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image 
                      src={editorTarget.url} 
                      alt="Editor target"
                      fill
                      priority
                      unoptimized // <--- Crucial para que el editor no parpadee al rotar/escalar
                      style={getImageStyle()}
                      className="object-cover"
                      sizes="300px"
                    />
                  </div>
                )}
              </div>
              
              {/* CONTROLES */}
              <div className="w-full max-w-xs space-y-8">
                <button 
                  onClick={onRotate} 
                  className="mx-auto w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-[#6b21a8] border border-slate-100 active:scale-90 transition-transform"
                >
                  <RotateCw className="w-7 h-7" />
                </button>

                <div className="flex gap-2">
                  {[
                    {id:"Pequeña", icon:<Minimize2 size={18}/>}, 
                    {id:"Mediana", icon:<Square size={18}/>}, 
                    {id:"Grande", icon:<Maximize size={18}/>}
                  ].map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => onSize(s.id)} 
                      className={`flex-1 flex flex-col items-center py-5 rounded-2xl border-2 transition-all 
                        ${config.size === s.id 
                          ? "bg-[#6b21a8] text-white border-[#6b21a8] shadow-lg" 
                          : "bg-white text-slate-400 border-slate-100"}`}
                    >
                      {s.icon} 
                      <span className="text-[10px] font-black mt-2 uppercase tracking-tighter">{s.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t bg-white shrink-0">
        <Button 
          disabled={view === 'gallery' && !tempImg} 
          onClick={onConfirm} 
          className="w-full h-18 bg-[#1C42E8] hover:bg-[#581c87] text-white rounded-[14px] p-4 font-semibold text-[18px] shadow-xl active:scale-[0.98] transition-all"
        >
          {view === 'gallery' ? 'Continuar Selección' : 'Confirmar Diseño'}
        </Button>
      </div>
    </motion.div>
  )
}