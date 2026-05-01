"use client";

import React, { useState, useMemo, useEffect } from "react";
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

// --- 1. ALGORITMO SMART ---
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
  token?: string; // <--- Token recibido desde el servidor
}

export default function PhoneSelectorPage({ initialBrands = [], token }: PhoneSelectorPageProps) {
  const [selection, setSelection] = useAtom(selectionAtom);
  const [, setMissingBrands] = useAtom(missingBrandsAtom);
  const [, setMissingModels] = useAtom(missingModelsAtom);
  
  const [activePanel, setActivePanel] = useState<"none" | "brand" | "model">("none");
  const [search, setSearch] = useState("");

  const brands = initialBrands;
  const brandSelected = selection.brand;
  const modelSelected = selection.model;

  // --- Filtrado de resultados ---
  const filteredResults = useMemo(() => {
    if (!brands || brands.length === 0) return [];
    let source: { id: string; name: string; logo: string | null }[] = [];

    if (activePanel === "brand") {
      source = brands.map((b) => ({ id: b.id, name: b.name, logo: b.logo || null }));
    } else if (activePanel === "model" && brandSelected) {
      const targetBrand = brands.find((b) => b.name === brandSelected);
      source = targetBrand
        ? targetBrand.models
            .filter((m) => m.has_mica === true || m.has_case === true)
            .map((m) => ({ id: m.id, name: m.name, logo: null }))
        : [];
    }
    return humanSearch(search, source);
  }, [activePanel, search, brandSelected, brands]);

  const selectedBrandLogo = useMemo(() => {
    return brands?.find((b) => b.name === brandSelected)?.logo;
  }, [brands, brandSelected]);

  // --- LÓGICA DE TRACKING REFORZADA CON TOKEN ---
  useEffect(() => {
    if (!search || search.length < 3 || activePanel === "none") return;
    if (filteredResults.length > 0) return;

    const handler = setTimeout(async () => {
      try {
        if (activePanel === "brand") {
          setMissingBrands((prev) => {
            if (prev.includes(search)) return prev;
            
            // Inyectamos el token aquí
            trackMissingBrand(search, token).then(success => {
              console.log(`🌎 API Tracking Marca [${search}]:`, success ? "✅ OK" : "❌ FALLÓ");
            });
            
            return [...prev, search];
          });
        } 
        else if (activePanel === "model" && brandSelected) {
          setMissingModels((prev) => {
            const exists = prev.some(m => m.brand === brandSelected && m.model === search);
            if (exists) return prev;
            
            // Inyectamos el token aquí
            trackMissingModel(brandSelected, search, token).then(success => {
              console.log(`🌎 API Tracking Modelo [${search}]:`, success ? "✅ OK" : "❌ FALLÓ");
            });

            return [...prev, { brand: brandSelected, model: search, timestamp: new Date().toISOString() }];
          });
        }
      } catch (error) {
        console.error("❌ Error en el flujo de tracking:", error);
      }
    }, 1500);

    return () => clearTimeout(handler);
    // Agregamos 'token' a las dependencias para que el efecto use el más reciente
  }, [search, filteredResults.length, activePanel, brandSelected, setMissingBrands, setMissingModels, token]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden font-sans">
      <main className="flex-1 p-5 space-y-4 overflow-y-auto no-scrollbar">
        {/* CARD MARCA */}
        <div
          onClick={() => setActivePanel("brand")}
          className={`bg-[#F6F7F9] p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col gap-3 
          ${brandSelected ? "border-[#0B4488] ring-1 ring-[#0B4488]" : "border-transparent shadow-sm"}`}
        >
          <div className="flex items-center gap-4">
            <div className="text-black"><Smartphone className="w-5 h-5" /></div>
            <span className="font-semibold text-black flex-1 text-[16px]">Selecciona la marca</span>
            <ChevronRight className={`transition-transform ${brandSelected ? "text-[#0B4488]" : "text-slate-300"}`} />
          </div>

          {brandSelected && (
            <div className="bg-white text-[#0B4488] px-4 py-2 rounded-3xl text-[13px] font-bold w-fit border border-blue-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              {selectedBrandLogo && (
                <Image src={getImageUrl(selectedBrandLogo)} alt={brandSelected} width={20} height={20} className="object-contain" unoptimized />
              )}
              <span className="font-normal text-[14px]">{brandSelected}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelection({ ...selection, brand: null, brandId: "", model: null, modelId: "" });
                }}
                className="p-1 hover:bg-red-50 rounded-full transition-colors group"
              >
                <Trash2 className="w-4 h-4 text-[#0B4488] group-hover:text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* CARD MODELO */}
        <div
          onClick={() => brandSelected && setActivePanel("model")}
          className={`bg-[#F6F7F9] p-4 rounded-[14px] border transition-all flex flex-col gap-3 
          ${modelSelected ? "border-[#0B4488] ring-1 ring-[#0B4488]" : "border-transparent shadow-sm"} 
          ${!brandSelected && "opacity-40 grayscale pointer-events-none"}`}
        >
          <div className="flex items-center gap-4">
            <div className="text-black"><Smartphone className="w-5 h-5" /></div>
            <span className="font-semibold text-black flex-1 text-[16px]">Selecciona el modelo</span>
            <ChevronRight className={`transition-transform ${modelSelected ? "text-[#0B4488]" : "text-slate-300"}`} />
          </div>

          {modelSelected && (
            <div className="bg-white text-[#0B4488] px-4 py-2 rounded-3xl text-[14px] font-normal w-fit border border-blue-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <span className="tracking-tight">{modelSelected}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelection({ ...selection, model: null, modelId: "" });
                }}
                className="p-1 hover:bg-red-50 rounded-full transition-colors group"
              >
                <Trash2 className="w-4 h-4 text-[#0B4488] group-hover:text-red-500" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* PANEL DE BÚSQUEDA FLOTANTE */}
      <AnimatePresence>
        {activePanel !== "none" && (
          <motion.div
            initial={{ y: "100%", x: "-50%" }}
            animate={{ y: 0, x: "-50%" }}
            exit={{ y: "100%", x: "-50%" }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[100dvh] z-[100] bg-white flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-4 flex items-center gap-4 border-b pt-12 shrink-0">
              <button
                onClick={() => { setActivePanel("none"); setSearch(""); }}
                className="p-3 bg-slate-100 rounded-full active:scale-90 transition-transform"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <h3 className="text-xl font-semibold flex-1 text-center pr-12 text-slate-900">
                {activePanel === "brand" ? "Selecciona la Marca" : `Selecciona el modelo de ${brandSelected}`}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              <div className="relative mb-6">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#B7B7B7] w-5 h-5" />
                <input
                 // autoFocus
                  placeholder={`Busca ${activePanel === "brand" ? "la marca" : "el modelo"}...`}
                  className="w-full bg-white rounded-[14px] py-5 pl-16 pr-14 font-semibold text-slate-800 outline-none border border-[#B7B7B7] focus:ring-1 focus:ring-[#B7B7B7] transition-all placeholder:text-[#B7B7B7]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-full">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              <div className="grid gap-3 pb-24">
                {filteredResults.length === 0 && search.length >= 3 && (
                   <div className="text-center py-10 animate-in fade-in zoom-in duration-300">
                      <p className="text-slate-400 text-sm">No encontramos resultados para <br/> <span className="font-bold text-slate-600">"{search}"</span></p>
                      <p className="text-[10px] text-slate-300 mt-2 uppercase tracking-widest">Lo hemos registrado para agregarlo pronto</p>
                   </div>
                )}
                
                {filteredResults.map(({ item, layer }) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (activePanel === "brand") {
                        setSelection({ ...selection, brand: item.name, brandId: item.id, model: null, modelId: "" });
                        setSearch("");
                        setActivePanel("model");
                      } else {
                        setSelection({ ...selection, model: item.name, modelId: item.id });
                        setActivePanel("none");
                        setSearch("");
                      }
                    }}
                    className={`w-full text-left p-4 rounded-[14px] border transition-all flex justify-between items-center active:scale-95 
                      ${brandSelected === item.name || modelSelected === item.name ? "bg-white border-[#0B4488]" : "bg-white border-slate-100 shadow-sm"}`}
                  >
                    <div className="flex items-center gap-4">
                      {item.logo && (
                        <div className="w-12 h-12 bg-slate-50 rounded-sm p-2 flex items-center justify-center overflow-hidden">
                          <Image src={getImageUrl(item.logo)} alt={item.name} width={32} height={32} className="object-contain" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 text-[16px]">{item.name}</span>
                        {layer === 0 && <span className="text-[8px] text-purple-600 font-black tracking-[0.2em] uppercase">Sugerencia</span>}
                      </div>
                    </div>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all 
                      ${brandSelected === item.name || modelSelected === item.name ? "border-[#0B4488] bg-[#0B4488]" : "border-slate-100"}`}>
                      {(brandSelected === item.name || modelSelected === item.name) && <Check className="w-4 h-4 text-white stroke-[4]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}