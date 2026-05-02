"use client"

import React from "react"

interface ColorSelectorProps {
  casesApi: any[]
  selectedCaseId: string | null
  onCaseChange: (caseItem: any) => void
}

export const ColorSelectorVertical = ({ 
  casesApi, 
  selectedCaseId, 
  onCaseChange 
}: ColorSelectorProps) => {
  
  const currentCase = casesApi.find(c => c.id === selectedCaseId) || casesApi[0]

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* HEADER: Solo el nombre del color arriba */}
      <div className="flex flex-col">
        <label className="hidden text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Color
        </label>
        <span className="hidden text-sm font-bold text-slate-900 ml-1">
          {currentCase?.colour?.name || "Seleccionar"}
        </span>
      </div>

      {/* LISTA DE COLORES EN LÍNEA */}
      <div className="flex flex-wrap gap-2 items-center">
        {casesApi.map((c) => {
          const isSelected = selectedCaseId === c.id;
          const isWhite =
            c.colour?.hex_code?.toLowerCase() === '#ffffff' ||
            c.colour?.hex_code?.toLowerCase() === '#fff';

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCaseChange(c)}
              className="relative flex items-center justify-center outline-none group shrink-0"
            >
              {/* Anillo exterior */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border-[2px]
                  ${isSelected 
                    ? "border-slate-900 scale-110 shadow-md bg-white" 
                    : "border-transparent group-hover:border-slate-200"}
                `}
              >
                {/* Círculo de color (Dot) */}
                <div
                  style={{ backgroundColor: c.colour?.hex_code }}
                  className={`w-7 h-7 rounded-full transition-all duration-200 shadow-inner
                    ${isWhite ? "border border-slate-200" : ""}
                    ${isSelected ? "scale-90" : "group-hover:scale-105"}
                  `}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  )
}