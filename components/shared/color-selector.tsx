"use client";

import React from "react";

interface ColorSelectorProps {
  casesApi: any[];
  selectedCaseId: string | null;
  onCaseChange: (caseItem: any) => void;
}

export const ColorSelector = ({ 
  casesApi, 
  selectedCaseId, 
  onCaseChange 
}: ColorSelectorProps) => {
  
  const currentCase = casesApi.find(c => c.id === selectedCaseId) || casesApi[0];

  return (
    <div className="pt-6 border-t border-slate-50">
      <div className="flex flex-col gap-[10px]">
        
        {/* TEXTO INFORMATIVO */}
        <div className="flex flex-col items-start px-1">
          <label className="text-[14px] font-bold text-[#1d1d1f] leading-none">
            Color: <span className="text-slate-400 font-medium">{currentCase?.colour?.name || "Seleccionar"}</span>
          </label>
        </div>

        {/* GRILLA DE DOTS: gap-x reducido para mayor proximidad */}
<div className="grid grid-cols-[repeat(5,min-content)] gap-x-[5px] gap-y-[10px] justify-start w-full">          {casesApi.map((c) => {
            const isSelected = selectedCaseId === c.id;
            const isWhite = 
              c.colour?.hex_code?.toLowerCase() === '#ffffff' || 
              c.colour?.hex_code?.toLowerCase() === '#fff';

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onCaseChange(c)}
                className="relative flex items-center justify-center outline-none group h-8 w-8"
              >
                {/* Anillo exterior: más fino (1.5px) y color más suave */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-[1.5px]
                    ${isSelected 
                      ? "border-slate-900 scale-105 shadow-sm" 
                      : "border-transparent group-hover:border-slate-100"}
                  `}
                >
                  {/* Círculo de color (Dot) */}
                  <div
                    style={{ backgroundColor: c.colour?.hex_code }}
                    className={`w-[22px] h-[22px] rounded-full transition-all duration-200 shadow-inner
                      ${isWhite ? "border border-slate-100" : ""}
                      ${isSelected ? "scale-90" : "group-hover:scale-105"}
                    `}
                  />
                </div>
                
                {/* Tooltip Desktop */}
                <span className="absolute -top-8 scale-0 transition-all rounded bg-slate-800 p-1 text-[10px] text-white group-hover:scale-100 whitespace-nowrap z-20">
                  {c.colour?.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};