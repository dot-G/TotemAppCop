"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface ExitModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ExitModal({ isOpen, onClose, onConfirm }: ExitModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop con Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Card del Modal */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[340px] bg-white rounded-[2.5rem] p-8 shadow-2xl z-[110]"
          >
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex justify-center mb-6 mt-4">
              <div className="w-20 h-20 rounded-full border-[3px] border-[#f87171] flex items-center justify-center">
                <span className="text-[#f87171] text-4xl font-light">!</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-[22px] font-bold text-[#0f172a] mb-3 leading-tight">
                ¿Deseas salir?
              </h3>
              <p className="text-[#64748b] text-base leading-snug">
                Recuerda que esta acción es irreversible y perderás tu diseño.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={onConfirm} 
                className="w-full h-[60px] rounded-[1.2rem] border-[1.5px] border-slate-200 text-slate-900 font-bold text-lg active:bg-slate-50 transition-colors"
              >
                Si, quiero salir
              </button>
              <button 
                onClick={onClose} 
                className="w-full h-[60px] rounded-[1.2rem] bg-[#1C42E8] text-white font-bold text-lg shadow-lg shadow-purple-200 active:scale-[0.98] transition-all"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}