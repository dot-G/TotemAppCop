"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight as ChevronIcon,
  ImagePlus as ImageIcon,
  Loader2,
} from "lucide-react";
import { ColorSelector, COLORS } from "@/components/shared/color-selector";
import { useApp } from "@/hooks/use-app";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { activeImageTabAtom } from "@/lib/store";
import Image from "next/image";

import { useCatalogOfferings } from "@/hooks/use-images";
import { SummaryCard } from "./image-selector/summary-card";
import { ImageEditorPortal } from "./image-selector/image-editor-portal";
import { getImageUrl } from '@/lib/image-directus';

export default function ImageSelector() {
  const { selection, updateSelection, isHydrated } = useApp();
  const [activeTab, setActiveTab] = useAtom(activeImageTabAtom);
  const [flowView, setFlowView] = useState<"idle" | "gallery" | "editor">(
    "idle"
  );
  const [mounted, setMounted] = useState(false);

  // --- Lógica de API para Licencias ---
  const { data: offerings = [], isLoading } = useCatalogOfferings();
  const [loadingIcons, setLoadingIcons] = useState<Record<string, boolean>>({});

  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [tempImg, setTempImg] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<any>(null);

  const [config, setConfig] = useState(
    activeTab === "brand"
      ? selection.imageBrandConfig
      : selection.imageCustomConfig
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (flowView === "editor") {
      const currentConfig =
        activeTab === "brand"
          ? selection.imageBrandConfig
          : selection.imageCustomConfig;
      setConfig(currentConfig);
    }
  }, [
    flowView,
    activeTab,
    selection.imageBrandConfig,
    selection.imageCustomConfig,
  ]);

  const currentGalleryImages = useMemo(() => {
    if (!selectedBrand || !offerings) return [];
    const catalog = offerings.find((o) => o.id === selectedBrand.id);
    if (!catalog) return [];
    return catalog.images.map((img) => ({
      id: img.id.toString(),
      url: getImageUrl(img.directus_files_id.id),
    }));
  }, [selectedBrand, offerings]);

  const currentCaseHex = useMemo(() => {
    const colorMatch = COLORS.find((c) => c.name === selection.caseColor);
    return colorMatch ? colorMatch.hex : COLORS[0].hex;
  }, [selection.caseColor]);

  const handleConfirmDesign = () => {
    if (flowView === "gallery") {
      if (!tempImg) return;
      setEditorTarget({ url: tempImg, type: "brand", tag: selectedBrand.name });
      setFlowView("editor");
      return;
    }

    const isBrand = editorTarget.type === "brand";
    const normalizedRotation = ((config.rotation % 360) + 360) % 360;

    if (isBrand) {
      updateSelection({
        imageSourceType: "brand",
        catalogId: selectedBrand?.id ? String(selectedBrand.id) : null,
        catalog_image: editorTarget.url.replace("https://pxp.srv01.elcanoso.xyz/assets/", ""),
        catalog_image_combo_content: selectedBrand?.id ? String(selectedBrand.id) : null,
        selectedBrandTag: editorTarget.tag,
        
        // 1. Guardamos la config de imagen
        imageBrandConfig: { ...config, rotation: normalizedRotation },
        
        // 2. IMPORTANTE: Meter el precio en la estructura que el hook espera
        config: {
          ...selection.config,
          prices: {
            ...selection.config?.prices,
            // Aquí es donde el hook useApp hace el merge manual
            uv: parseFloat(selectedBrand.price) || 0 
          }
        }
      });
    } else {
      updateSelection({
        imageSourceType: "custom",
        catalogId: null, // Las personalizadas no tienen catálogo
        imageCustomUrl: editorTarget.url,
        imageCustomConfig: { ...config, rotation: normalizedRotation },
      });
    }

    setFlowView("idle");
    setEditorTarget(null);
    setTempImg(null);
  };

  const handleClearCurrentSelection = () => {
    const defaultConfig = { rotation: 0, scale: 1, size: "Grande" as const };
    if (activeTab === "brand") {
      updateSelection({
        catalog_image: null,
        catalogId: null,
        selectedBrandTag: null,
        acceptedTerms: false,
        imageSourceType: selection.imageCustomUrl ? "custom" : null,
        imageBrandConfig: defaultConfig,
      });
    } else {
      updateSelection({
        imageCustomUrl: null,
        imageSourceType: selection.catalog_image ? "brand" : null,
        imageCustomConfig: defaultConfig,
      });
    }
  };

  if (!isHydrated || !mounted) return null;

  return (
    <div className="flex pt-2 flex-col h-full bg-[#f8fafc] font-sans overflow-hidden">
      <div className="shrink-0 border-b flex z-10">
        {[
          { id: "brand", label: "Licencias" },
          { id: "custom", label: "Imagen personal" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-3 text-[14px] font-semibold relative transition-colors ${
              activeTab === t.id ? "text-[#722296]" : "text-slate-400"
            }`}
          >
            {t.label}
            {activeTab === t.id && (
              <motion.div
                layoutId="tabLine"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#722296] rounded-t-full mx-10"
              />
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-32 no-scrollbar p-6">
        <AnimatePresence mode="wait">
          {activeTab === "brand" ? (
            <motion.div
              key="brand-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              {selection.catalog_image ? (
                <SummaryCard
                  url={getImageUrl(selection.catalog_image || "")}
                  
                  type="brand"
                  title={selection.selectedBrandTag || "Licencia"}
                  caseHex={currentCaseHex}
                  config={selection.imageBrandConfig}
                  onEdit={() => {
                    setEditorTarget({
                      url: getImageUrl(selection.catalog_image || ""),
                      type: "brand",
                      tag: selection.selectedBrandTag,
                    });
                    setFlowView("editor");
                  }}
                  onClear={handleClearCurrentSelection}
                  acceptedTerms={selection.acceptedTerms}
                  onAccept={(v) => updateSelection({ acceptedTerms: v })}
                />
              ) : (
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
                      <Loader2 className="animate-spin" />
                      <span className="text-[10px] uppercase font-bold">
                        Cargando licencias...
                      </span>
                    </div>
                  ) : (
                    offerings.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => {
                          setSelectedBrand(brand);
                          setFlowView("gallery");
                        }}
                        className="w-full bg-white p-7 rounded-[14px] flex justify-between items-center border border-slate-100 shadow-sm active:scale-95 transition-transform"
                      >
                        <div className="relative h-8 w-24 flex items-center justify-center">
                          {brand.icon && (
                            <>
                              {loadingIcons[brand.id] !== false && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                  <Loader2 className="w-4 h-4 text-slate-200 animate-spin" />
                                </div>
                              )}
                              <Image
                                src={getImageUrl(brand.icon)}
                                alt={brand.name}
                                fill
                                className={`object-contain grayscale opacity-60 transition-opacity duration-500 ${
                                  loadingIcons[brand.id] === false
                                    ? "opacity-60"
                                    : "opacity-0"
                                }`}
                                onLoadingComplete={() =>
                                  setLoadingIcons((prev) => ({
                                    ...prev,
                                    [brand.id]: false,
                                  }))
                                }
                                unoptimized
                              />
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400">
                            +${Math.round(parseFloat(brand.price))}
                          </span>
                          <ChevronIcon size={16} className="text-slate-300" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="custom-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {selection.imageCustomUrl ? (
                <SummaryCard
                  url={selection.imageCustomUrl}
                  type="custom"
                  title="Tu Imagen"
                  caseHex={currentCaseHex}
                  config={selection.imageCustomConfig}
                  onEdit={() => {
                    setEditorTarget({
                      url: selection.imageCustomUrl,
                      type: "custom",
                    });
                    setFlowView("editor");
                  }}
                  onClear={handleClearCurrentSelection}
                />
              ) : (
                <div className="flex flex-col gap-6 items-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[16/9] rounded-[14px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 active:bg-slate-100 transition-colors"
                  >
                    <ImageIcon size={40} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Subir Foto Personal
                    </span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // 1. Liberar memoria si ya había un blob anterior para no saturar la RAM del TV
                        if (selection.imageCustomUrl?.startsWith("blob:")) {
                          URL.revokeObjectURL(selection.imageCustomUrl);
                        }

                        // 2. Crear una URL de memoria (Blob), no un Base64 gigante
                        const blobUrl = URL.createObjectURL(file);

                        // 3. Pasamos el blobUrl al editor directamente
                        setEditorTarget({ url: blobUrl, type: "custom" });
                        setFlowView("editor");
                      }
                    }}
                  />
                  <div className="w-full pt-4 border-t border-slate-100">
                    <ColorSelector layout="flex" />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {flowView !== "idle" && (
              <ImageEditorPortal
                view={flowView}
                title={
                  flowView === "gallery"
                    ? `Colección ${selectedBrand?.name}`
                    : "Ajustar Diseño"
                }
                editorTarget={editorTarget}
                config={config}
                caseHex={currentCaseHex}
                tempImg={tempImg}
                galleryImages={currentGalleryImages}
                onBack={() => {
                  if (flowView === "editor" && editorTarget?.type === "brand")
                    setFlowView("gallery");
                  else {
                    setFlowView("idle");
                    setEditorTarget(null);
                    setTempImg(null);
                  }
                }}
                onRotate={() =>
                  setConfig({ ...config, rotation: config.rotation + 90 })
                }
                onSize={(s: any) => setConfig({ ...config, size: s })}
                onConfirm={handleConfirmDesign}
                onSelectImg={setTempImg}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
