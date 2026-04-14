"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Check,
  ShieldCheck,
  Loader2,
  Info,
  Zap,
  Shield,
  EyeOff,
} from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useMicas } from "@/hooks/use-mica";
import { getImageUrl } from "@/lib/image-directus";
import Image from "next/image";

export default function MicaSelector() {
  const { selection, updateSelection, isHydrated } = useApp();
  const { data: micasApi = [], isLoading } = useMicas();

  const [activeIdx, setActiveIdx] = useState(0);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInternalScrolling = useRef(false);

  const micaDefault = selection.config?.prices?.micaDefault || 0;

  const handleMicaChange = useCallback(
    (index: number, forceUpdate = false) => {
      const mica = micasApi[index];
      if (!mica || !selection.config) return;

      const currentMicaPrice = parseFloat(mica.price) || 0;
      const storeMicaPrice = selection.config.prices?.mica;

      // Solo actualizamos si realmente hay un cambio para evitar re-renders innecesarios
      const isDifferentId = String(selection.micaId) !== String(mica.id);
      const isDifferentPrice = storeMicaPrice !== currentMicaPrice;

      if (isDifferentId || isDifferentPrice || forceUpdate) {
        updateSelection({
          micaId: mica.id,
          micaName: mica.name,
          mica_combo_content: mica.id,
          micaImage: mica.featured_image || mica.icon || null,
          config: {
            ...selection.config,
            prices: {
              ...selection.config.prices,
              mica: currentMicaPrice,
            },
          },
        });
      }
    },
    [micasApi, updateSelection, selection.config, selection.micaId]
  );

  const centerCard = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = scrollRef.current;
      const card = cardsRef.current[index];
      if (container && card) {
        isInternalScrolling.current = true;
        const targetScroll =
          card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2;
        
        container.scrollTo({ left: targetScroll, behavior });
        setActiveIdx(index);
        handleMicaChange(index);

        // Bloqueamos el listener de scroll un momento para que la animación termine limpia
        setTimeout(() => { isInternalScrolling.current = false; }, 500);
      }
    },
    [handleMicaChange]
  );

  useEffect(() => {
    if (isHydrated && !isLoading && micasApi.length > 0) {
      const savedIdx = micasApi.findIndex((m) => String(m.id) === String(selection.micaId));
      const targetIdx = savedIdx === -1 ? 0 : savedIdx;
      
      setActiveIdx(targetIdx);
      // Forzamos actualización por si el combo reseteó el precio
      handleMicaChange(targetIdx, true); 
      
      const timer = setTimeout(() => {
        centerCard(targetIdx, "instant");
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, isLoading, micasApi.length, selection.micaId === null]);

  const handleScroll = () => {
    if (!scrollRef.current || micasApi.length === 0 || isInternalScrolling.current) return;

    const container = scrollRef.current;
    const centerPoint = container.scrollLeft + container.offsetWidth / 2;

    let closestIdx = 0;
    let minDistance = Infinity;

    cardsRef.current.forEach((card, idx) => {
      if (card) {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(centerPoint - cardCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }
      }
    });

    if (closestIdx !== activeIdx) {
      // Solo actualizamos el índice visual inmediatamente para el feedback táctil
      setActiveIdx(closestIdx);
      
      // Debounceamos la actualización del store (el pesado) para evitar saltos de precio
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        handleMicaChange(closestIdx);
      }, 150); 
    }
  };

  if (!isHydrated || isLoading)
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0D51A1]" />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; }` }} />

      <main className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-none flex overflow-x-auto snap-x snap-mandatory hide-scrollbar items-center px-[12%] py-8 scroll-smooth"
        >
          {micasApi.map((mica, idx) => {
            const isActive = activeIdx === idx;
            const priceVal = parseFloat(mica.price) || 0;
            const priceDifference = priceVal - micaDefault;
            const priceLabel = priceDifference <= 0 ? "Incluida" : `+$${Math.round(priceDifference)}`;
            const isPrivacy = mica.name.toLowerCase().includes("privacy") || mica.code?.includes("PRIVA");
            const isPremium = mica.name.toLowerCase().includes("premium") || mica.code?.includes("PREMI");

            return (
              <div
                key={mica.id}
                ref={(el) => { cardsRef.current[idx] = el; }}
                className="min-w-[95%] flex flex-col px-2 snap-center cursor-pointer"
                onClick={() => centerCard(idx)}
              >
                {/* Agregamos transform-gpu para que el renderizado sea por hardware y más fluido */}
                <div className={`relative w-full bg-white rounded-[14px] p-3 transition-all duration-500 ease-in-out transform-gpu flex flex-col
                  ${isActive ? "border-[#6b21a8] scale-105 z-10 shadow-lg" : "border-transparent scale-90 opacity-40 grayscale"}`}>
                  
                  {isActive && (
                    <div className="absolute top-4 right-4 bg-[#6b21a8] text-white rounded-full p-1.5 shadow-xl z-50 animate-in zoom-in duration-300">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </div>
                  )}

                  <div className="relative aspect-[16/10] w-full bg-slate-100 rounded-[8px] mb-2 overflow-hidden flex items-center justify-center">
                    {(mica.featured_image || mica.icon) ? (
                      <Image
                        src={getImageUrl(mica.featured_image || mica.icon || "")}
                        alt={mica.name}
                        fill
                        className={`object-contain transition-opacity duration-500 ${loadingImages[mica.id] === false ? "opacity-100" : "opacity-0"}`}
                        onLoadingComplete={() => setLoadingImages(prev => ({ ...prev, [mica.id]: false }))}
                        unoptimized
                      />
                    ) : (
                      <ShieldCheck className="text-slate-200 w-16 h-16 stroke-[1]" />
                    )}
                  </div>

                  <div className="px-1 flex flex-col">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-[16px] font-bold text-[#1d1d1f] truncate mr-2">{mica.name}</h3>
                      {/* El precio ahora es estable gracias al debounce y validación de ID */}
                      <span className="text-[18px] font-bold text-[#1d1d1f]">{priceLabel}</span>
                    </div>
                    {/* ... Resto de la UI igual ... */}
                    <p className="text-[12px] text-slate-500 mb-3 leading-tight">
                      {isPrivacy ? "Protección lateral a 30°." : "Cristal templado de máxima transparencia."}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-[#0D51A1]">
                        {isPrivacy ? <EyeOff className="w-4 h-4" /> : isPremium ? <Zap className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">
                          {isPrivacy ? "FILTRO ANTIESPÍA" : isPremium ? "MÁXIMA RESISTENCIA" : "PROTECCIÓN 9H"}
                        </span>
                        <span className="text-[8px] font-medium text-slate-400 uppercase">Tecnología Japonesa</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#0D51A1]">
                      <Info className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase">Instalación Incluida</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 py-2">
          {micasApi.map((_, i) => (
            <button
              key={i}
              onClick={() => centerCard(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeIdx === i ? "w-6 bg-[#6b21a8]" : "w-1.5 bg-slate-300"}`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}