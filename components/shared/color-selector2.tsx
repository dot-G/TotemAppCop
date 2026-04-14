"use client"

import React from "react"

interface ColorSelectorProps {
  casesApi: any[]
  selectedCaseId: string | null
  onCaseChange: (caseItem: any) => void
}

export const ColorSelector = ({ 
  casesApi, 
  selectedCaseId, 
  onCaseChange 
}: ColorSelectorProps) => {
  
  /**
   * FIX: Ahora usamos 'c.id' para buscar el caso actual.
   * Esto unifica la lógica con el renderizado de los dots.
   */
  const currentCase = casesApi.find(c => c.id === selectedCaseId) || casesApi[0]

  return (
    <div className="pt-8 border-t border-slate-50">
      <div className="grid grid-cols-2 gap-4 items-start">
        
        {/* COLUMNA IZQUIERDA: Texto informativo */}
        <div className="flex flex-col">
          <label className="text-[15px] font-semibold text-[#1d1d1f]">
            Color del case
          </label>
          <span className="text-[15px] font-medium text-slate-400">
            {currentCase?.colour?.name || "Seleccionar"}
          </span>
        </div>

        {/* COLUMNA DERECHA: Grilla de Dots */}
        <div className="grid grid-cols-5 gap-3 justify-items-end">
          {casesApi.map((c) => {
            /**
             * Comparamos el ID seleccionado con el ID del objeto actual.
             */
            const isSelected = selectedCaseId === c.id;
            const isWhite = 
              c.colour?.hex_code?.toLowerCase() === '#ffffff' || 
              c.colour?.hex_code?.toLowerCase() === '#fff';

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onCaseChange(c)}
                className="relative flex items-center justify-center outline-none group"
              >
                {/* Anillo exterior (Indicador de selección) */}
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border-[2.5px]
                    ${isSelected ? "border-slate-900 scale-110 shadow-sm" : "border-transparent"}
                  `}
                >
                  {/* Círculo de color (Dot) */}
                  <div 
                    style={{ backgroundColor: c.colour?.hex_code }}
                    className={`w-7 h-7 rounded-full transition-all duration-200 shadow-inner
                      ${isWhite ? "border border-slate-200" : ""}
                    `}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  )
}