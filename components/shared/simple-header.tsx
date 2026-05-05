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
    <header className="bg-white py-2.5 px-3 min-[960px]:p-8 shadow-sm flex items-center gap-4 shrink-0 border-b border-slate-50 rounded-b-[1rem] z-[50] relative h-16 min-[960px]:h-24">

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
            <h2 className="text-[16px] font-semibold text-black truncate min-[960px]:text-[28px]">
              {title}
            </h2>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Botón Salir */}
      <button
        onClick={onExitClick}
        className="flex flex-col items-center justify-center min-w-[40px] text-[#0D51A1] transition-colors active:scale-95 shrink-0"
      >
        <LogOut className="w-4 h-4 min-[960px]:w-10 min-[960px]:h-10" />
        <span className="text-[13px]  text-[#0D51A1] font-normal min-[960px]:text-[18px]">Salir</span>
      </button>
    </header>
  )
}