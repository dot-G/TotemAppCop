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
import { getImageUrl } from "@/lib/image-directus";
import { Mica } from "@/services/mica-service2";
import Image from "next/image";

interface MicaSelectorProps {
  initialMicas: Mica[]; // Obligatorio ahora que viene del padre
}

export default function MicaSelector({ initialMicas = [] }: MicaSelectorProps) {
  const { selection, updateSelection, isHydrated } = useApp();
  
  // Usamos directamente las props enviadas desde el AppShell2
  const micas = initialMicas;

  const [activeIdx, setActiveIdx] = useState(0);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInternalScrolling = useRef(false);

  const micaDefault = selection.config?.prices?.micaDefault || 0;

  /**
   * Actualiza el estado global (Zustand) con la mica seleccionada
   */
  const handleMicaChange = useCallback(
    (index: number, forceUpdate = false) => {
      const mica = micas[index];
      if (!mica || !selection.config) return;

      const currentMicaPrice = parseFloat(mica.price) || 0;
      const storeMicaPrice = selection.config.prices?.mica;

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
    [micas, updateSelection, selection.config, selection.micaId]
  );

  /**
   * Centra visualmente la tarjeta en el scroll horizontal
   */
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

        setTimeout(() => { isInternalScrolling.current = false; }, 500);
      }
    },
    [handleMicaChange]
  );

  // Efecto inicial: Posiciona el scroll en la mica ya seleccionada o la primera
  useEffect(() => {
    if (isHydrated && micas.length > 0) {
      const savedIdx = micas.findIndex((m) => String(m.id) === String(selection.micaId));
      const targetIdx = savedIdx === -1 ? 0 : savedIdx;
      
      setActiveIdx(targetIdx);
      handleMicaChange(targetIdx, true); 
      
      const timer = setTimeout(() => {
        centerCard(targetIdx, "instant");
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, micas.length]); // Solo depende de la hidratación y los datos iniciales

  const handleScroll = () => {
    if (!scrollRef.current || micas.length === 0 || isInternalScrolling.current) return;

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
      setActiveIdx(closestIdx);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        handleMicaChange(closestIdx);
      }, 150); 
    }
  };

  if (!isHydrated || micas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0D51A1]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; }` }} />

      <main className="flex-1 flex flex-col justify-center min-[960px]:justify-start min-[960px]:mt-8 min-h-0 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-none flex overflow-x-auto snap-x snap-mandatory hide-scrollbar items-center px-[12%] py-8 scroll-smooth"
        >
          {micas.map((mica, idx) => {
            const isActive = activeIdx === idx;
            const priceVal = parseFloat(mica.price) || 0;
            const priceDifference = priceVal - micaDefault;
            const priceLabel = priceDifference <= 0 ? "" : `+$${Math.round(priceDifference)}`;
            const isPrivacy = mica.name.toLowerCase().includes("privacy") || mica.code?.includes("PRIVA");
            const isPremium = mica.name.toLowerCase().includes("premium") || mica.code?.includes("PREMI");

            return (
              <div
                key={mica.id}
                ref={(el) => { cardsRef.current[idx] = el; }}
                className="min-w-[92%] mt-4 flex flex-col px-0 snap-center cursor-pointer"
                onClick={() => centerCard(idx)}
              >
                <div className={`relative w-full bg-white rounded-[14px] transition-all duration-500 ease-in-out transform-gpu flex flex-col
                  ${isActive ? "border-[#6b21a8] scale-105 z-10 shadow-lg" : "border-transparent scale-90 opacity-60 grayscale"}`}>
                  
                  {isActive && (
                    <div className="absolute top-4 right-8 min-[960px]:top-12 min-[960px]:right-12 min-[960px]:scale-[2.8] bg-[#6b21a8] text-white rounded-full p-1.5 shadow-xl z-50 animate-in zoom-in duration-300">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </div>
                  )}

                  <div className="relative aspect-[16/9] w-full bg-slate-100 rounded-[8px] mb-2 overflow-hidden flex items-center justify-center">
                    {(mica.featured_image || mica.icon) ? (
                      <Image
                        src={getImageUrl(mica.featured_image || mica.icon || "")}
                        alt={mica.name}
                        fill
                        className={`object-cover transition-opacity duration-500 ${loadingImages[mica.id] === false ? "opacity-100" : "opacity-0"}`}
                        onLoadingComplete={() => setLoadingImages(prev => ({ ...prev, [mica.id]: false }))}
                        unoptimized
                      />
                    ) : (
                      <ShieldCheck className="text-slate-200 w-16 h-16 stroke-[1]" />
                    )}
                  </div>

                  <div className="p-4 min-[960px]:p-8 flex flex-col">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-[18px] min-[960px]:text-[42px] font-semibold text-[#1d1d1f] truncate mr-2">{mica.name}</h3>
                      <span className="text-[22px] min-[960px]:text-[50px] font-semibold text-[#1d1d1f]">{priceLabel}</span>
                    </div>
                    
                    <p className="text-[12px] min-[960px]:text-[28px] text-slate-500 mb-3 leading-tight">
                      {isPrivacy ? "Protección lateral a 30°." : "Cristal templado de máxima transparencia."}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-[#0D51A1]">
                        {isPrivacy ? <EyeOff className="w-4 h-4 min-[960px]:w-10 min-[960px]:h-10" /> : isPremium ? <Zap className="w-4 h-4 min-[960px]:w-10 min-[960px]:h-10" /> : <Shield className="w-4 h-4 min-[960px]:w-10 min-[960px]:h-10" />}
                      </div>
                      <div className="flex flex-col leading-none">
                        <span className="text-[10px] min-[960px]:text-[22px] font-black text-slate-800 uppercase tracking-tight">
                          {isPrivacy ? "FILTRO ANTIESPÍA" : isPremium ? "MÁXIMA RESISTENCIA" : "PROTECCIÓN 9H"}
                        </span>
                        <span className="text-[8px] min-[960px]:text-[18px] font-medium text-slate-400 uppercase">Tecnología Japonesa</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#0D51A1]">
                      <Info className="w-4 h-4 min-[960px]:w-10 min-[960px]:h-10" />
                      <span className="text-[9px] min-[960px]:text-[22px] font-black uppercase">Instalación Incluida</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

       

          <div className="flex justify-center gap-3 py-2 min-[960px]:pt-8">
            {micas.map((_, i) => (
              <button
                key={i}
                onClick={() => centerCard(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${activeIdx === i ? "w-10 bg-[#6b21a8]" : "w-2.5 bg-slate-300"
                  }`}
              />
            ))}
          </div>
        
      </main>
    </div>
  );
}