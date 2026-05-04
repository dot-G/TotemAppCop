"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Check,
  ShieldCheck,
  Smartphone,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useCombos } from "@/hooks/use-combo";
import { getImageUrl } from "@/lib/image-directus";
import Image from "next/image";

export default function ComboSelector() {
  const { selection, updateSelection, isHydrated } = useApp();
  const { data: combosApi = [], isLoading } = useCombos();

  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isInitialMounted = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleComboChange = useCallback(
    (index: number) => {
      const combo = combosApi[index];
      if (!combo) return;

      const pMica = parseFloat(String(combo.mica_combo_content?.price || 0));
      const pCase = parseFloat(String(combo.case_combo_content?.price || 0));
      const pUv = parseFloat(String(combo.uv_print_combo_content?.price || 0));

      updateSelection({
        ...selection, // Importante: Mantener estado anterior
        case_combo_content: combo.case_combo_content?.id,
        mica_combo_content: combo.mica_combo_content?.id,
        uv_print_combo_content: combo.uv_print_combo_content?.id,
        comboId: String(combo.id),
        config: {
          includes_mica: !!combo.includes_mica,
          includes_case: !!combo.includes_case,
          includes_uv_print: !!combo.includes_uv_print,
          prices: {
            micaDefault: pMica, // Se guarda la primera vez
            mica: pMica, // Es igual al default al inicio
            case: pCase,
            uv: pUv,
          },
        },
        // ... (el resto de tus campos de IDs)
      });
    },
    [combosApi, selection, updateSelection]
  );

  const centerCard = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = scrollRef.current;
      const card = cardsRef.current[index];
      if (container && card) {
        const targetScroll =
          card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2;
        container.scrollTo({ left: targetScroll, behavior });
      }
    },
    []
  );

  useEffect(() => {
    if (
      isHydrated &&
      !isLoading &&
      combosApi.length > 0 &&
      !isInitialMounted.current
    ) {
      const savedIdx = combosApi.findIndex(
        (c) => String(c.id) === String(selection.comboId)
      );
      const targetIdx = savedIdx === -1 ? 0 : savedIdx;

      setActiveIdx(targetIdx);

      // Solo actualizamos si no hay nada guardado para evitar "pisar" cambios del usuario
      if (!selection.comboId) {
        handleComboChange(targetIdx);
      }

      const timer = setTimeout(() => centerCard(targetIdx, "instant"), 50);
      isInitialMounted.current = true;
      return () => clearTimeout(timer);
    }
  }, [
    isHydrated,
    isLoading,
    combosApi,
    selection.comboId,
    centerCard,
    handleComboChange,
  ]);

  const handleScroll = () => {
    if (!scrollRef.current || combosApi.length === 0) return;
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
        handleComboChange(closestIdx);
      }, 150);
    }
  };

  if (!isHydrated || isLoading)
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-[#6b21a8]" />
      </div>
    );

  return (
    <div className="flex flex-col overflow-hidden font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `.hide-scrollbar::-webkit-scrollbar { display: none; }`,
        }}
      />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden pt-4">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar items-stretch px-[12%] py-6 scroll-smooth"
        >

         
          
         {combosApi
  .filter((combo) => {
    // 1. Si el combo ofrece CASE, el modelo debe soportar CASE
    if (combo.includes_case && !selection.model.has_case) return false;

    // 2. Si el combo ofrece MICA, el modelo debe soportar MICA
    if (combo.includes_mica && !selection.model.has_mica) return false;

    return true; // Pasa el filtro
  })
  .map((combo, idx) => {
    // ... tu lógica de cálculo de precio e UI se mantiene igual
    const totalPrice = (
      parseFloat(String(combo.mica_combo_content?.price || 0)) +
      parseFloat(String(combo.case_combo_content?.price || 0)) +
      parseFloat(String(combo.uv_print_combo_content?.price || 0))
    ).toFixed(0);

    const isActive = activeIdx === idx;
    
    return (
      <div key={combo.id} /* ... resto de tus props ... */>
        {/* Tu componente de Card de combo */}
      </div>
    );
})}
        </div>
        <div className="flex justify-center gap-3 py-2">
          {combosApi.map((_, i) => (
            <button
              key={i}
              onClick={() => centerCard(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeIdx === i ? "w-10 bg-[#0D51A1]" : "w-2.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function BenefitItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center transition-all group hover:bg-white hover:border-purple-100">
      <div className="w-6 h-6 text-[#0D51A1] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[14px] font-semibold text-slate-800 tracking-tight leading-none mb-1 px-1">
          {label}
        </span>
      </div>
    </div>
  );
}
