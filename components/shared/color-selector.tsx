"use client"

import React from "react"
import { Check } from "lucide-react"
import { useApp } from "@/hooks/use-app"

// Colores centralizados para toda la app
export const COLORS = [
  { name: "Naranja", hex: "#f87171" },
  { name: "Verde", hex: "#22c55e" },
  { name: "Azul", hex: "#3b82f6" },
  { name: "Morado", hex: "#a855f7" },
  { name: "Amarillo", hex: "#eab308" },
]

interface ColorSelectorProps {
  layout?: "flex" | "grid"
}

export function ColorSelector({ layout = "flex" }: ColorSelectorProps) {
  const { selection, updateSelection, isHydrated } = useApp()

  if (!isHydrated) return <div className="h-14 w-full bg-slate-50 animate-pulse rounded-2xl" />

  const selectedColorName = selection.caseColor || "Naranja"

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-slate-900 leading-none">Color de Case</p>
        <p className="text-[12px] text-slate-400 font-medium mt-1">{selectedColorName}</p>
      </div>

      <div className={layout === "grid" ? "grid grid-cols-2 gap-2" : "flex gap-2.5"}>
        {COLORS.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => updateSelection({ caseColor: color.name })}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              selectedColorName === color.name 
                ? "ring-2 ring-offset-2 ring-red-400 scale-110 shadow-lg" 
                : "scale-100 opacity-80"
            }`}
            style={{ backgroundColor: color.hex }}
          >
            {selectedColorName === color.name && (
              <Check className="w-5 h-5 text-white" strokeWidth={4} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}