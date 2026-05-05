"use client"

import React from "react"
import { ArrowLeft, LogOut } from "lucide-react"
import { useApp } from "@/hooks/use-app"
import { StepType } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"

interface StepHeaderProps {
  currentStepNumber: number
  totalSteps: number
  title: string
  subtitle: string
  backTo: StepType
  onExitClick: () => void // La prop que conecta con el AppShell
}

export function StepHeader({
  currentStepNumber,
  totalSteps,
  title,
  subtitle,
  backTo,
  onExitClick
}: StepHeaderProps) {
  const { setStep, isHydrated } = useApp()

  if (!isHydrated) return <div className="h-[88px]" />;

  // Porcentaje para el círculo de progreso
  const percentage = Math.min(Math.max((currentStepNumber / totalSteps) * 100, 0), 100)

  return (
    <div className="bg-white py-2.5 px-3 min-[960px]:p-8 flex items-center gap-3 shrink-0 border-b rounded-[14px] z-[50] relative">

      {/* Botón Atrás */}
      <button
        onClick={() => setStep(backTo)}
        className="w-8 h-8 min-[960px]:w-14 min-[960px]:h-14 rounded-full border-2 border-[#0D51A1] flex items-center justify-center text-[#0D51A1] active:scale-90 transition-all shrink-0"
      >
        <ArrowLeft className="w-4 h-4 min-[960px]:w-7 min-[960px]:h-7" />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Barrita Izquierda - Reducido gap a 2 */}
        <div className="w-[1px] h-10 bg-slate-200 shrink-0" />

        {/* Contenido Central: Progreso + Títulos */}
        <div className="flex flex-1 items-center gap-2.5 min-w-0">

          {/* Progreso Circular */}
          {/* Contenedor con ZOOM proporcional */}
          <div className="relative shrink-0 transition-all duration-300 origin-center scale-100 min-[960px]:scale-[2] min-[960px]:px-4">

            {/* El círculo (mantenemos su tamaño base de 40px / w-10) */}
            <div className="w-10 h-10">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16" cy="16" r="14"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-100"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="16" cy="16" r="14"
                  fill="none"
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{ strokeDasharray: `${percentage} 100` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="#71E5FF"
                />
              </svg>

              {/* Texto central (se agranda solo por el scale del padre) */}
              <div className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-black">
                {currentStepNumber}/{totalSteps}
              </div>
            </div>

          </div>

          {/* Títulos con Animación */}
          <div className="flex-1 overflow-hidden relative h-10 min-[960px]:h-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col justify-center text-right"
              >
                <h2 className="text-[16px] font-semibold text-black leading-tight truncate tracking-tight min-[960px]:text-[28px]">
                  {title}
                </h2>
                <p className="text-[13px] text-[#606166] font-medium truncate min-[960px]:text-[22px]">
                  {subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Barrita Derecha */}
        <div className="w-[1px] h-10 bg-slate-200 shrink-0" />
      </div>

      {/* Botón Salir */}
      <button
        onClick={onExitClick}
        className="flex flex-col items-center justify-center min-w-[40px] text-[#0D51A1] transition-colors active:scale-95 shrink-0"
      >
        <LogOut className="w-4 h-4 min-[960px]:w-10 min-[960px]:h-10" />
        <span className="text-[13px]  text-[#0D51A1] font-normal min-[960px]:text-[18px]">Salir</span>
      </button>
    </div>
  )
}