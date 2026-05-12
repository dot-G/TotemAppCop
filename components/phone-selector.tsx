"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  ChevronRight,
  Smartphone,
  Trash2,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import Image from "next/image";
import {
  selectionAtom,
  missingBrandsAtom,
  missingModelsAtom,
} from "@/lib/store";
import { getImageUrl } from "@/lib/image-directus";

// --- Servicios ---
import { trackMissingBrand, trackMissingModel } from "@/services/track-service";
import { Brand } from "@/services/phone-service";

// --- Algoritmo de Búsqueda ---
const SMART_ALIASES: Record<string, string> = {
  ifon: "Apple", ifone: "Apple", aifon: "Apple", iphon: "Apple", apple: "Apple",
  saam: "Samsung", samsun: "Samsung", sansun: "Samsung", sam: "Samsung",
  yomi: "Xiaomi", shaomi: "Xiaomi", ziomi: "Xiaomi", redmi: "Xiaomi", poko: "Xiaomi",
  moto: "Motorola", motrola: "Motorola",
};

const normalize = (str: string) => {
  if (!str) return "";
  let n = str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return n.replace(/(.)\1+/g, "$1");
};

function humanSearch<T extends { name: string }>(searchTerm: string, items: T[]) {
  const s = normalize(searchTerm);
  if (!s) return items.map((i) => ({ item: i, layer: null }));
  const aliasTarget = SMART_ALIASES[s] || SMART_ALIASES[searchTerm.toLowerCase().trim()];

  const filtered = items.filter((obj) => {
    const t = normalize(obj.name);
    if (aliasTarget && t.includes(normalize(aliasTarget))) return true;
    if (t.includes(s)) return true;
    if (s.length >= 2 && t.startsWith(s)) return true;
    return false;
  });

  const layerOf = (name: string) => {
    const t = normalize(name);
    if (aliasTarget && t.includes(normalize(aliasTarget))) return 0;
    if (t.startsWith(s)) return 1;
    return 2;
  };

  return filtered
    .sort((a, b) => layerOf(a.name) - layerOf(b.name))
    .map((item) => ({ item, layer: layerOf(item.name) }));
}

interface PhoneSelectorPageProps {
  initialBrands?: Brand[];
  token?: string;
}

export default function PhoneSelectorPage({ initialBrands = [], token }: PhoneSelectorPageProps) {

  const [selection, setSelection] = useAtom(selectionAtom);
  const [, setMissingBrands] = useAtom(missingBrandsAtom);
  const [, setMissingModels] = useAtom(missingModelsAtom);

  const [activePanel, setActivePanel] = useState<"none" | "brand" | "model">("none");
  const [search, setSearch] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState(1);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Acceso simplificado a los datos del store refactorizado
  const brandSelected = selection.brand;
  const modelSelected = selection.model.name;


  // --- 1. Filtrado de Resultados ---
  const filteredResults = useMemo(() => {
    // Definimos una interfaz local para el tipado del buscador
    type SearchItem = { id: string; name: string; logo: string | null; has_case?: boolean; has_mica?: boolean };

    let source: SearchItem[] = [];

    if (activePanel === "brand") {
      source = initialBrands.map((b) => ({ id: b.id, name: b.name, logo: b.logo || null }));
    } else if (activePanel === "model" && brandSelected) {
      const targetBrand = initialBrands.find((b) => b.name === brandSelected);
      source = targetBrand ? targetBrand.models
        .filter((m) => m.has_mica || m.has_case)
        .map((m) => ({
          id: m.id,
          name: m.name,
          logo: null,
          has_case: m.has_case,
          has_mica: m.has_mica,
          camera_layout: m.camera_layout,
        })) : [];
    }
    return humanSearch(search, source);
  }, [activePanel, search, brandSelected, initialBrands]);

  // --- 2. Tracking de búsquedas fallidas ---
  useEffect(() => {
    if (!search || search.length < 3 || activePanel === "none") return;
    if (filteredResults.length > 0) return;

    const handler = setTimeout(async () => {
      try {
        if (activePanel === "brand") {
          setMissingBrands((prev) => {
            if (prev.includes(search)) return prev;
            trackMissingBrand(search, token);
            return [...prev, search];
          });
        }
        else if (activePanel === "model" && brandSelected) {
          setMissingModels((prev) => {
            const exists = prev.some(m => m.brand === brandSelected && m.model === search);
            if (exists) return prev;
            trackMissingModel(brandSelected, search, token);
            return [...prev, { brand: brandSelected, model: search, timestamp: new Date().toISOString() }];
          });
        }
      } catch (error) { console.error("❌ Error en tracking:", error); }
    }, 1500);
    return () => clearTimeout(handler);
  }, [search, filteredResults.length, activePanel, brandSelected, token, setMissingBrands, setMissingModels]);

  // --- 3. Manejo de Selección (Refactorizado para objeto model) ---
  const handleSelect = (item: any) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    if (activePanel === "brand") {
      setSelection({
        ...selection,
        brand: item.name,
        brandId: item.id,
        model: { id: null, name: null, has_case: false, has_mica: false, camera_layout: null } // Reset model
      });
      setTimeout(() => {
        setSearch("");
        setDirection(1);
        setActivePanel("model");
        setIsTransitioning(false);
      }, 400);
    } else {
      // Seteo del nuevo objeto model con sus flags
      setSelection({
        ...selection,
        model: {
          id: item.id,
          name: item.name,
          has_case: !!item.has_case,
          has_mica: !!item.has_mica,
          camera_layout: item.camera_layout
        }
      });
      setTimeout(() => {
        setActivePanel("none");
        setSearch("");
        setIsTransitioning(false);
      }, 400);
    }
  };

  const selectedBrandLogo = useMemo(() => {
    return initialBrands.find((b) => b.name === brandSelected)?.logo;
  }, [initialBrands, brandSelected]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%" }),
    center: { x: 0 },
    exit: (dir: number) => ({ x: dir < 0 ? "100%" : "-100%" })
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden font-sans">
      <main className="flex-1 p-5 space-y-4 overflow-y-auto no-scrollbar">
        {/* CARD MARCA */}
        <div
          onClick={() => { setDirection(1); setActivePanel("brand"); }}
          className={`bg-[#F6F7F9] p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col gap-3 
          ${brandSelected ? "border-[#0B4488] ring-1 ring-[#0B4488]" : "border-transparent shadow-sm"}`}
        >
          <div className="flex items-center gap-4">
            <Smartphone className="w-5 h-5 text-black min-[960px]:w-10 min-[960px]:h-10" />
            <span className="font-semibold text-black flex-1 text-[16px] min-[960px]:text-[35px]">
              Selecciona la marca
            </span>            <ChevronRight className={brandSelected ? "text-[#0B4488]" : "text-slate-300"} />
          </div>
          {brandSelected && (
            <div className="bg-white text-[#0B4488] px-4 py-2 rounded-3xl text-[13px] font-bold w-fit border border-blue-100 flex items-center gap-3">
              {selectedBrandLogo &&
                <Image
                  src={getImageUrl(selectedBrandLogo)}
                  alt={brandSelected}
                  // Definimos el tamaño máximo para evitar que Next.js asigne un espacio pequeño
                  width={40}
                  height={40}
                  // Usamos clases de Tailwind para controlar el tamaño real en el DOM
                  className="object-contain w-[20px] h-[20px] min-[960px]:w-[50px] min-[960px]:h-[50px]"
                  unoptimized
                />}
              <span className="font-normal text-[14px] min-[960px]:text-[28px]">{brandSelected}</span>
              <button onClick={(e) => {
                e.stopPropagation();
                setSelection({
                  ...selection,
                  brand: null,
                  brandId: "",
                  model: { id: null, name: null, has_case: false, has_mica: false, camera_layout: null }
                });
              }} className="p-1"><Trash2 className="w-4 h-4 text-[#0B4488] min-[960px]:w-8 min-[960px]:h-8" /></button>
            </div>
          )}
        </div>

        {/* CARD MODELO */}
        <div
          onClick={() => { if (brandSelected) { setDirection(1); setActivePanel("model"); } }}
          className={`bg-[#F6F7F9] p-4 rounded-[14px] border transition-all flex flex-col gap-3 
          ${modelSelected ? "border-[#0B4488] ring-1 ring-[#0B4488]" : "border-transparent shadow-sm"} 
          ${!brandSelected && "opacity-40 grayscale pointer-events-none"}`}
        >
          <div className="flex items-center gap-4">
            <Smartphone className="w-5 h-5 text-black min-[960px]:w-10 min-[960px]:h-10" />
            <span className="font-semibold text-black flex-1 text-[16px] min-[960px]:text-[35px]">
              Selecciona el modelo</span>
            <ChevronRight className={ modelSelected ? "text-[#0B4488]" : "text-slate-300"}  />
          </div>
          {modelSelected && (
            <div className="bg-white text-[#0B4488] px-4 py-2 rounded-3xl text-[14px] font-normal w-fit border border-blue-100 flex items-center gap-3">
              <span className="font-normal text-[14px] min-[960px]:text-[28px]">{modelSelected}</span>
              <button onClick={(e) => {
                e.stopPropagation();
                setSelection({ ...selection, model: { id: null, name: null, has_case: false, has_mica: false, camera_layout: null } });
              }} className="p-1"><Trash2 className="w-4 h-4 text-[#0B4488] min-[960px]:w-8 min-[960px]:h-8" /></button>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence initial={false} custom={direction}>
        {activePanel !== "none" && (
          <motion.div
            key={activePanel}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "tween", duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
            className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-4 flex items-center gap-4 border-b pt-12 shrink-0 bg-white">
              <button
                onClick={() => { setDirection(-1); setActivePanel("none"); setSearch(""); }}
                className="p-3 bg-slate-100 rounded-full active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <h3 className="text-xl font-semibold flex-1 text-center pr-12 text-slate-900 min-[960px]:text-[35px]">
                {activePanel === "brand" ? "Selecciona la Marca" : `Modelos de ${brandSelected}`}
              </h3>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 no-scrollbar">
              <div className="relative mb-6">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#B7B7B7] w-5 h-5" />
                <input
  placeholder="Busca..."
  className="w-full bg-white rounded-[14px] py-5 pl-16 pr-14 font-semibold text-slate-800 outline-none border border-[#B7B7B7] focus:ring-1 focus:ring-[#0B4488] min-[960px]:text-[35px] min-[960px]:placeholder:text-[35px]"
  value={search} 
  onChange={(e) => setSearch(e.target.value)}
/>
                {search && <button onClick={() => setSearch("")} className="absolute right-5 top-1/2 -translate-y-1/2 p-2"><X className="w-4 h-4 text-slate-400" /></button>}
              </div>

              <div className="grid gap-3 pb-24">
                {filteredResults.length === 0 && search.length >= 3 && (
                  <div className="text-center py-10"><p className="text-slate-400 text-sm">No hay resultados para <span className="font-bold text-slate-600">"{search}"</span></p></div>
                )}

                {filteredResults.map(({ item, layer }) => {
                  const isSelected = activePanel === "brand" ? selection.brand === item.name : selection.model.id === item.id;
                  return (
                    <button
                      key={item.id}
                      disabled={isTransitioning}
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left p-4 rounded-[14px] border flex justify-between items-center transition-all ${isSelected ? "bg-blue-50/50 border-[#0B4488]" : "bg-white border-slate-100 shadow-sm"}`}
                    >
                      <div className="flex items-center gap-4">
                        {item.logo && (
                          <div className="w-12 h-12 min-[960px]:w-16 min-[960px]:h-16 bg-white rounded-sm p-2 flex items-center justify-center border border-slate-50 overflow-hidden">
  <Image 
    src={getImageUrl(item.logo)} 
    alt={item.name} 
    width={32} // Este es el tamaño base de renderizado
    height={32} 
    className="object-contain w-8 h-8 min-[960px]:w-32 min-[960px]:h-32" 
    unoptimized 
  />
</div>
                        )}
                        <div className="flex flex-col">
                          <span className={`font-semibold text-[16px] min-[960px]:text-[32px] ${isSelected ? "text-[#0B4488]" : "text-slate-800"}`}>{item.name}</span>
                          {layer === 0 && <span className="text-[8px] text-purple-600 font-black tracking-[0.2em] uppercase">Sugerencia</span>}
                        </div>
                      </div>
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-[#0B4488] bg-[#0B4488]" : "border-slate-200"}`}>
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[4]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}