"use client"

import React from "react"
import { Check } from "lucide-react"
import { useApp } from "@/hooks/use-app"

export function StepIndicator() {
  const { currentStep, stepsPath } = useApp()

  const configStepIds = ["mica-selector", "case-selector", "image-selector"]
  
  const visibleSteps = [
    { id: "mica-selector", label: "Mica" },
    { id: "case-selector", label: "Case" },
    { id: "image-selector", label: "Imagen" },
  ].filter(step => stepsPath.includes(step.id as any))

  const isInsideConfig = configStepIds.includes(currentStep)
  if (!isInsideConfig || visibleSteps.length <= 1) return null

  const globalIndex = stepsPath.indexOf(currentStep)

  return (
    <div className="relative flex justify-between items-center px-12 py-2 bg-[#f8fafc] shrink-0 overflow-hidden">
      
      {/* Línea conectora de fondo */}
      <div className="absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-slate-200 -translate-y-1/2 z-0" />

      {visibleSteps.map((step) => {
        const stepIndexInPath = stepsPath.indexOf(step.id as any)
        const isActive = currentStep === step.id
        const isCompleted = globalIndex > stepIndexInPath
        
        return (
          <div 
            key={step.id} 
            className={`
              relative z-10 flex items-center mt-1.5 gap-1.5 px-2 py-0 rounded-full border transition-all duration-300
              ${isActive 
                ? "bg-white border-black shadow-sm" 
                : "bg-[#f8fafc] border-slate-200"
              }
            `}
          >
            {/* Check sutil si está completado o activo (según tu lógica de diseño) */}
            {(isCompleted || isActive) && (
              <Check 
                className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-slate-300"}`} 
                strokeWidth={3} 
              />
            )}

            <span className={`
              text-[13px] font-medium transition-colors
              ${isActive ? "text-black" : "text-slate-300"}
            `}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}