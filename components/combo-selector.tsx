"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Check,
  ShieldCheck,
  Smartphone,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { getImageUrl } from "@/lib/image-directus";
import { Combo } from "@/services/combo-service";
import Image from "next/image";

interface ComboSelectorProps {
  initialCombos?: Combo[];
}

export default function ComboSelector({ initialCombos = [] }: ComboSelectorProps) {
  const { selection, updateSelection, isHydrated } = useApp();

  // 1. Filtramos los combos primero para que toda la lógica se base en lo que es visible
  const filteredCombos = useMemo(() => {
    return initialCombos.filter((combo) => {
      const caseCompatible = !combo.includes_case || selection.model.has_case;
      const micaCompatible = !combo.includes_mica || selection.model.has_mica;
      return caseCompatible && micaCompatible;
    });
  }, [initialCombos, selection.model.has_case, selection.model.has_mica]);

  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isInitialMounted = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 2. Usamos filteredCombos en la lógica de cambio
  const handleComboChange = useCallback(
    (index: number) => {
      const combo = filteredCombos[index]; // <--- IMPORTANTE: Usar la lista filtrada
      if (!combo) return;

      const pMica = parseFloat(String(combo.mica_combo_content?.price || 0));
      const pCase = parseFloat(String(combo.case_combo_content?.price || 0));
      const pUv = parseFloat(String(combo.uv_print_combo_content?.price || 0));

      updateSelection({
        case_combo_content: combo.case_combo_content?.id,
        mica_combo_content: combo.mica_combo_content?.id,
        uv_print_combo_content: combo.uv_print_combo_content?.id,
        comboId: String(combo.id),
        config: {
          ...selection.config,
          includes_mica: !!combo.includes_mica,
          includes_case: !!combo.includes_case,
          includes_uv_print: !!combo.includes_uv_print,
          prices: {
            ...selection.config?.prices,
            micaDefault: pMica,
            mica: pMica,
            case: pCase,
            uv: pUv,
          },
        },
      });
    },
    [filteredCombos, selection.config, updateSelection]
  );

  const centerCard = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = scrollRef.current;
      const card = cardsRef.current[index];
      if (container && card) {
        const targetScroll = card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2;
        container.scrollTo({ left: targetScroll, behavior });
      }
    },
    []
  );

  // 3. Selección inicial basada puramente en los filtrados
  useEffect(() => {
    if (isHydrated && filteredCombos.length > 0 && !isInitialMounted.current) {
      const savedIdx = filteredCombos.findIndex(
        (c) => String(c.id) === String(selection.comboId)
      );
      
      // Si el combo guardado no está en la lista filtrada, empezamos por el 0 (el primero válido)
      const targetIdx = savedIdx === -1 ? 0 : savedIdx;

      setActiveIdx(targetIdx);

      // Si no hay un combo seleccionado o el que había no es compatible (savedIdx === -1)
      if (!selection.comboId || savedIdx === -1) {
        handleComboChange(targetIdx);
      }

      const timer = setTimeout(() => centerCard(targetIdx, "instant"), 50);
      isInitialMounted.current = true;
      return () => clearTimeout(timer);
    }
  }, [isHydrated, filteredCombos, selection.comboId, centerCard, handleComboChange]);

  const handleScroll = () => {
    if (!scrollRef.current || filteredCombos.length === 0) return;
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

  if (!isHydrated)
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-[#6b21a8]" />
      </div>
    );

  if (filteredCombos.length === 0) return null;

  return (
    <div className="flex flex-col overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; }` }} />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden pt-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar items-stretch px-[12%] py-6 scroll-smooth"
        >
          {filteredCombos.map((combo, idx) => {
            const totalPrice = (
              parseFloat(String(combo.mica_combo_content?.price || 0)) +
              parseFloat(String(combo.case_combo_content?.price || 0)) +
              parseFloat(String(combo.uv_print_combo_content?.price || 0))
            ).toFixed(0);

            const isActive = activeIdx === idx;

            return (
              <div
                key={combo.id}
                ref={(el) => { cardsRef.current[idx] = el; }}
                className="min-w-[95%] flex flex-col px-2 min-[960px]:pt-8 snap-center cursor-pointer"
                onClick={() => centerCard(idx)}
              >
                <div className={`relative w-full flex-1 bg-white rounded-[8px] p-2 min-[960px]:p-8 transition-all duration-500 flex flex-col shadow-purple-500 ${isActive ? "border-[#6b21a8] scale-105 z-10 shadow-purple-200" : "border-transparent scale-90 opacity-40 grayscale"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-5 right-5 min-[960px]:top-16 min-[960px]:right-16 min-[960px]:scale-[2] bg-[#1C42E8] text-white rounded-full p-2 shadow-xl animate-in zoom-in duration-300 z-20">
                      <Check className="w-5 h-5" strokeWidth={2} />
                    </div>
                  )}

                  <div className="relative aspect-[16/10] w-full bg-slate-100 rounded-[8px] mb-3 overflow-hidden shrink-0 border border-slate-100">
                    {combo.featured_image ? (
                      <Image
                        src={`${getImageUrl(combo.featured_image)}?width=400`}
                        alt={combo.name}
                        fill
                        className="object-cover"
                        unoptimized
                        priority={idx === 0}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="text-slate-300 w-12 h-12" />
                      </div>
                    )}
                  </div>

                  <div className="px-2 pb-2 flex-1 flex flex-col">
                    <div className="flex justify-between items-baseline mb-0">
                      <h3 className="text-[17px] min-[960px]:text-[42px] font-semibold leading-[1.1em] mb-2 text-[#1d1d1f] tracking-tight">
                        {combo.name}
                      </h3>
                      <span className="text-[22px] min-[960px]:text-[50px] font-semibold text-[#1d1d1f]">
                        ${totalPrice}
                      </span>
                    </div>
                    <p className="text-[13px] min-[960px]:text-[28px] text-slate-500 leading-[1.1em] mb-2 font-normal">
                      {combo.description || "Selección premium diseñada para la máxima protección."}
                    </p>
                    <div className="space-y-0">
                      {combo.includes_mica && <BenefitItem icon={<ShieldCheck className="w-4 h-4 min-[960px]:w-8 min-[960px]:h-8" />} label="Mica de Protección" />}
                      {combo.includes_case && <BenefitItem icon={<Smartphone className="w-4 h-4 min-[960px]:w-8 min-[960px]:h-8" />} label="Case a Medida" />}
                      {combo.includes_uv_print && <BenefitItem icon={<ImageIcon className="w-4 h-4 min-[960px]:w-8 min-[960px]:h-8" />} label="Personalización UV" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredCombos.length > 1 && (
          <div className="flex justify-center gap-3 py-2 min-[960px]:pt-8">
            {filteredCombos.map((_, i) => (
              <button
                key={i}
                onClick={() => centerCard(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${activeIdx === i ? "w-10 bg-[#1C42E8]" : "w-2.5 bg-slate-300"
                  }`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BenefitItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center transition-all group hover:bg-white">
      <div className="w-6 h-6 min-[960px]:w-10 min-[960px]:h-10 text-[#1C42E8] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-[13px] min-[960px]:text-[28px] font-semibold text-slate-800 px-1">{label}</span>
    </div>
  );
}