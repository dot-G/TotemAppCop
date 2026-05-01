"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut } from "lucide-react"

interface SimpleHeaderProps {
  title: string
  subtitle: string
  onExitClick: () => void
}

export function SimpleHeader({ title, subtitle, onExitClick }: SimpleHeaderProps) {
  return (
    <header className="bg-white p-4 shadow-sm flex items-center gap-4 shrink-0 border-b border-slate-50 rounded-b-[1rem] z-[50] relative h-16">
      
      <div className="flex-1 overflow-hidden relative h-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={title} // Cambia la llave al título para animar cuando cambie el contenido
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col justify-center"
          >
            <h2 className="text-[16px] font-semibold text-slate-900 leading-tight truncate">
              {title}
            </h2>
            <p className="text-[10px] text-[#0066cc] font-semibold uppercase tracking-wider truncate">
              {subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Botón Salir */}
      <button 
        onClick={onExitClick} 
        className="flex flex-col items-center gap-0.5 text-[#0066cc] hover:text-red-500 transition-colors active:scale-90"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-[9px] font-semibold uppercase tracking-tighter">Salir</span>
      </button>
    </header>
  )
}