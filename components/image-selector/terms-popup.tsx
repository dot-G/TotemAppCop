"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";

interface TermsPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsPopup({ isOpen, onOpenChange }: TermsPopupProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !content) {
      const fetchTerms = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            "https://admin3pa.ai-labs.com.mx/items/terms_and_conditions?filter[section][_eq]=catalogue_images"
          );
          const result = await response.json();
          if (result.data && result.data.length > 0) {
            setContent(result.data[0].text);
          }
        } catch (error) {
          console.error("Error fetching terms:", error);
          setContent("No se pudieron cargar los términos en este momento.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchTerms();
    }
  }, [isOpen, content]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          fixed !top-0 !right-0 !left-auto !translate-x-0 !translate-y-0 z-[300] 
          flex flex-col 
          w-full sm:max-w-[425px] h-[100dvh] 
          m-0 rounded-none border-l bg-white 
          focus:outline-none p-0 shadow-2xl
          /* Animación simplificada al máximo para evitar parpadeos */
          data-[state=open]:animate-in 
          data-[state=closed]:animate-out 
          data-[state=open]:fade-in-0 
          data-[state=closed]:fade-out-0
          duration-200
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-800">
                Términos de Licencia
              </DialogTitle>
            </DialogHeader>
            
          </div>
          
          {/* Contenido: Eliminamos animaciones internas para evitar el flicker */}
          <div className="flex-1 overflow-y-auto p-6 text-[15px] leading-relaxed text-slate-500 no-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
              </div>
            ) : (
              <div className="max-w-full">
                <p className="whitespace-pre-line">
                  {content}
                </p>
                <div className="h-10" />
              </div>
            )}
          </div>

          {/* Botón inferior */}
          <div className="p-6 border-t bg-slate-50/50 shrink-0">
            <button 
              onClick={() => onOpenChange(false)}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-600 py-3.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Cerrar ventana
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}