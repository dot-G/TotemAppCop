"use client"

import React from "react"
import { ImageIcon, Check, Smartphone, ShieldCheck } from "lucide-react"
import { useApp } from "@/hooks/use-app"

export function StepIndicator() {
  const { currentStep, stepsPath } = useApp()

  // 1. Definimos los pasos que pertenecen a la "Fase de Configuración"
  const configStepIds = ["mica-selector", "case-selector", "image-selector"]
  
  // 2. Filtramos para ver cuáles de esos pasos existen en el combo actual
  const visibleSteps = [
    { id: "mica-selector", label: "Mica", icon: ShieldCheck },
    { id: "case-selector", label: "Case", icon: Smartphone },
    { id: "image-selector", label: "Imagen", icon: ImageIcon },
  ].filter(step => stepsPath.includes(step.id as any))

  // 3. REGLA DE ORO: Solo mostrar si el usuario está DENTRO de uno de estos pasos
  // y si el combo tiene más de un paso personalizable (si es solo 1, no hace falta indicador)
  const isInsideConfig = configStepIds.includes(currentStep)
  if (!isInsideConfig || visibleSteps.length <= 1) return null

  const globalIndex = stepsPath.indexOf(currentStep)

  return (
    <div className="relative flex justify-around items-center px-4 pt-2 bg-[#f8fafc] shrink-0">
      
      {/* Línea de fondo (conectora) dinámica */}
      <div className="absolute top-[2.9rem] left-[10%] right-[10%] h-[1px] bg-slate-300 -z-0" />

      {visibleSteps.map((step) => {
        const stepIndexInPath = stepsPath.indexOf(step.id as any)
        const isActive = currentStep === step.id
        const isCompleted = globalIndex > stepIndexInPath
        const Icon = step.icon

        return (
          <div key={step.id} className="relative flex flex-col items-center gap-1 z-10 transition-all duration-500">
            {/* Círculo del Icono */}
              {/* Etiqueta */}
            <span className={`
              text-[11px] font-normal transition-colors
              ${isActive ? "text-[#0D51A1]" : isCompleted ? "text-[#0D51A1]" : "text-slate-400"}
            `}>
              {step.label}
            </span>
            <div className={`
              w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-300
              ${isActive 
                ? "bg-[#0D51A1]" 
                : isCompleted 
                  ? "bg-[#0D51A1]" 
                  : "bg-white"
              }
            `}>
              {isCompleted ? (
                <Check className="w-4 h-4 text-white" strokeWidth={2} />
              ) : (
                <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-white" : "text-slate-300"}`} />
              )}
            </div>

          

          </div>
        )
      })}
    </div>
  )
}