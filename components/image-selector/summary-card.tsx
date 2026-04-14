"use client"

import React, { useState } from "react"
import { Pencil, Check, RotateCw, Loader2 } from "lucide-react"
import { ColorSelector } from "@/components/shared/color-selector"
import { motion } from "framer-motion"
import Image from "next/image"

interface SummaryCardProps {
  url: string
  type: 'brand' | 'custom'
  title: string
  caseHex: string
  config: {
    size: "Pequeña" | "Mediana" | "Grande"
    rotation: number
  }
  onEdit: () => void
  onClear: () => void
  acceptedTerms?: boolean
  onAccept?: (val: boolean) => void
}

export function SummaryCard({ 
  url, 
  type, 
  title, 
  caseHex, 
  config,
  onEdit, 
  onClear, 
  acceptedTerms, 
  onAccept 
}: SummaryCardProps) {

  const [isLoaded, setIsLoaded] = useState(false)

  const getImageStyle = () => {
    const rotation = config.rotation;
    let baseScale = config.size === "Mediana" ? 0.75 : config.size === "Pequeña" ? 0.5 : 1;
    const finalScale = Math.abs(rotation % 180) === 90 ? baseScale * 0.7 : baseScale;
    
    return {
      transform: `rotate(${rotation}deg) scale(${finalScale})`,
      transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)", 
    };
  };

  return (
    // Animación de entrada suave para todo el contenedor
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8"
    >
      
      {/* SECCIÓN DE PREVIEW E INFO */}
      <div className="flex gap-6 items-start">
        {/* Celular Preview */}
        <div className="relative w-[50%] shrink-0">
          <motion.div 
            layoutId="case-preview"
            className="aspect-[3/4.2] rounded-[14px] shadow-2xl border-[6px] overflow-hidden relative flex items-center justify-center transition-colors duration-500"
            style={{ borderColor: caseHex, backgroundColor: caseHex }}
          >
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            )}

            <div className="relative w-full h-full flex items-center justify-center">
              <Image 
                src={url} 
                alt="Final Preview"
                fill
                priority
                unoptimized
                style={getImageStyle()}
                className={`object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                sizes="300px"
              />
            </div>
          </motion.div>
        </div>

        {/* Info y Botones */}
        <div className="flex-1 pt-2">
          <h3 className="text-2xl font-semibold text-slate-900 leading-none tracking-tighter break-words mb-4">
            {title}
          </h3>

          <div className="space-y-2">
            <button 
              onClick={onEdit} 
              className="flex items-center gap-3 text-[13px] border-2 border-slate-100 font-medium text-slate-700 bg-white py-2 px-4 rounded-[8px] w-full justify-center active:scale-95 transition-all shadow-sm"
            >
              <Pencil size={16} strokeWidth={3} className="text-[#6b21a8]" /> 
              Editar
            </button>

            <button 
              onClick={onClear} 
              className="flex items-center gap-3 text-[13px] border-2 border-red-50 font-medium text-red-500 bg-red-50/30 py-4 px-4 rounded-2xl w-full justify-center active:scale-95 transition-all"
            >
              <RotateCw size={16} strokeWidth={3} /> 
              Cambiar
            </button>
          </div>

          {/* TÉRMINOS Y CONDICIONES */}
          {type === 'brand' && onAccept && (
            <div className="mt-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="peer sr-only" 
                  checked={acceptedTerms} 
                  onChange={(e) => onAccept(e.target.checked)} 
                />
                <div className={`mt-0.5 w-6 h-6 shrink-0 border-2 rounded-lg flex items-center justify-center transition-all ${
                  acceptedTerms 
                    ? 'bg-[#6b21a8] border-[#6b21a8] shadow-lg shadow-purple-200' 
                    : 'bg-white border-slate-300'
                }`}>
                  <Check 
                    size={18} 
                    strokeWidth={4} 
                    className={`text-white transition-transform ${acceptedTerms ? 'scale-100' : 'scale-0'}`} 
                  />
                </div>
                <span className={`text-[11px] font-medium leading-snug ${acceptedTerms ? 'text-slate-900' : 'text-slate-500'}`}>
                  Acepto los términos de uso de <b>{title}</b>.
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* SELECTOR DE COLOR INFERIOR */}
     
        <ColorSelector layout="flex" />
     
     
    </motion.div>
  )
}