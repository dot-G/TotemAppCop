"use client"

import React from "react"

interface ColorOption {
  id: string
  name: string
  hex: string
}

interface ColorSelectorProps {
  colors: ColorOption[]
  selectedColor: string
  onColorChange: (hex: string) => void
}

export const ColorSelector = ({ 
  colors, 
  selectedColor, 
  onColorChange 
}: ColorSelectorProps) => {
  
  const currentColor = colors.find(c => c.hex === selectedColor) || colors[0]

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        
        {/* Label */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-zinc-400">
            Color
          </label>
          <span className="text-sm font-medium text-white">
            {currentColor?.name || "Seleccionar"}
          </span>
        </div>

        {/* Color dots */}
        <div className="flex gap-2">
          {colors.map((c) => {
            const isSelected = selectedColor === c.hex
            const isWhite = c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#fff'

            return (
              <button
                key={c.id}
                onClick={() => onColorChange(c.hex)}
                className="relative flex items-center justify-center outline-none"
                title={c.name}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-2
                    ${isSelected ? "border-white scale-110" : "border-transparent"}
                  `}
                >
                  <div 
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full transition-all duration-200
                      ${isWhite ? "border border-zinc-600" : ""}
                    `}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Default colors for case
export const defaultCaseColors: ColorOption[] = [
  { id: "red", name: "Rojo", hex: "#dc2626" },
  { id: "green", name: "Verde", hex: "#16a34a" },
  { id: "blue", name: "Azul", hex: "#2563eb" },
  { id: "gold", name: "Dorado", hex: "#c9a55c" },
  { id: "pink", name: "Rosa", hex: "#ec4899" },
  { id: "black", name: "Negro", hex: "#1a1a1a" },
  { id: "silver", name: "Plata", hex: "#94a3b8" },
  { id: "white", name: "Blanco", hex: "#ffffff" },
]
