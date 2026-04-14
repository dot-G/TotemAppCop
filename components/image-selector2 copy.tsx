"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight as ChevronIcon,
  ImagePlus as ImageIcon,
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { activeImageTabAtom } from "@/lib/store";
import Image from "next/image";
import { Button } from "@/components/ui/button";

import { useCatalogOfferings } from "@/hooks/use-images";
import { getImageUrl } from "@/lib/image-directus";
import {
  PhoneCaseEditor,
  EditorTransform,
} from "./image-selector/phone-case-editor";
import { SmartphoneCasePreview } from "@/components/image-selector/smartphone-case-preview";

const resizeTo600 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function ImageSelector() {
  const { selection, updateSelection, isHydrated } = useApp();
  const [activeTab, setActiveTab] = useAtom(activeImageTabAtom);

  const [flowView, setFlowView] = useState<"idle" | "gallery">("idle");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { data: offerings = [], isLoading } = useCatalogOfferings();
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [editorTarget, setEditorTarget] = useState<{
    url: string;
    type: "brand" | "custom";
    tag?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * SINCRONIZACIÓN DE PRECIOS AL CAMBIAR DE TAB
   * Esto asegura que si el usuario tiene una licencia seleccionada pero se pasa
   * a "Personal", el total refleje el precio sin licencia, y viceversa.
   */
  useEffect(() => {
    if (activeTab !== selection.imageSourceType) {
      const currentUv = selection.config?.prices?.uv || 0;
      const licensePrice = selection.imageBrandPrice || 0;
      
      const baseUv = selection.imageSourceType === "brand" 
        ? currentUv - licensePrice 
        : currentUv;

      const finalUv = activeTab === "brand" ? baseUv + licensePrice : baseUv;

      updateSelection({ 
        imageSourceType: activeTab as "brand" | "custom",
        config: {
          ...selection.config,
          prices: { ...selection.config?.prices, uv: finalUv }
        }
      });
    }
  }, [activeTab, selection.imageSourceType, selection.imageBrandPrice, updateSelection]);

  const currentGalleryImages = useMemo(() => {
    if (!selectedBrand) return [];
    return (
      selectedBrand.images?.map((img: any) => ({
        id: img.id.toString(),
        url: getImageUrl(img.directus_files_id.id || img.directus_files_id),
      })) || []
    );
  }, [selectedBrand]);

  const handleEditorAccept = (
    capturedImage: string,
    newColorHex: string,
    transform: EditorTransform,
    caseId: string,
    colourId: string
  ) => {
    const colorData = selection.availableColors.find((c) => c.caseId === caseId);
    const newBrandPrice = editorTarget?.type === "brand" 
      ? (parseFloat(selectedBrand?.price) || 0) 
      : 0;

    const currentTotalUv = selection.config?.prices?.uv || 0;
    const oldBrandPrice = selection.imageBrandPrice || 0;
    
    const baseUvWithoutLicense = selection.imageSourceType === "brand" 
      ? currentTotalUv - oldBrandPrice 
      : currentTotalUv;
    
    const finalUvPrice = baseUvWithoutLicense + newBrandPrice;

    const baseUpdates = {
      caseId: caseId,
      caseColor: colorData?.name || selection.caseColor,
      colourHex: newColorHex,
      colourId: colorData ? colourId : selection.colourId,
      imageSourceType: editorTarget?.type,
      imageBrandPrice: editorTarget?.type === "brand" ? newBrandPrice : selection.imageBrandPrice, 
      config: {
        ...selection.config,
        prices: { ...selection.config?.prices, uv: finalUvPrice },
      },
    };

    if (editorTarget?.type === "brand") {
      updateSelection({
        ...baseUpdates,
        catalogId: selectedBrand?.id ? String(selectedBrand.id) : null,
        catalog_image: editorTarget.url.split("/assets/")[1],
        selectedBrandTag: editorTarget.tag || selection.selectedBrandTag,
        capturedBrandPreview: capturedImage,
        brandTransform: transform,
      });
    } else {
      updateSelection({
        ...baseUpdates,
        imageCustomUrl: editorTarget?.url || selection.imageCustomUrl,
        capturedCustomPreview: capturedImage,
        customTransform: transform,
      });
    }

    setIsEditorOpen(false);
    setFlowView("idle");
  };

  if (!isHydrated || !mounted) return null;

  const renderPreviewState = (type: "brand" | "custom") => {
    const isBrand = type === "brand";
    const title = isBrand ? selection.selectedBrandTag : "Imagen Personal";
    const transform = isBrand ? selection.brandTransform : selection.customTransform;
    const sourceUrl = isBrand
      ? selection.catalog_image ? getImageUrl(selection.catalog_image) : null
      : selection.imageCustomUrl;

    return (
      <div className="bg-white p-4">
        <div className="flex items-center gap-6">
          {/* EL COMPONENTE LOCO: SmartphoneCasePreview dinámico */}
          <div className="w-1/2 flex justify-center items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
            {sourceUrl && transform ? (
              <SmartphoneCasePreview
              frameColor={selection.colourHex || "#000000"}
              caseImage={sourceUrl}
              cameraStyle={(selection.model?.toLowerCase().includes("iphone") ? "apple" : "samsung") as any}
              width={160}
              // Mapeamos x e y al objeto offset que pide el componente
              imageOffset={{ 
                x: transform?.x || 0, 
                y: transform?.y || 0 
              }}
              imageScale={transform?.scale || 1}
              imageRotation={transform?.rotation || 0}
            />
            ) : (
              <div className="aspect-[3/4] flex items-center justify-center w-full">
                <Loader2 className="animate-spin text-slate-300" />
              </div>
            )}
          </div>

          <div className="w-1/2 flex flex-col justify-center gap-3">
            <div className="mb-2 text-left">
              <p className="text-[22px] font-bold leading-tight text-black">
                {title}
              </p>
              <p className="text-[12px] text-slate-400 uppercase tracking-widest font-bold mt-1">Tu diseño</p>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 rounded-xl gap-2 border-slate-100 bg-slate-50 text-[14px] font-bold"
              onClick={() => {
                if (sourceUrl) {
                  setEditorTarget({ url: sourceUrl, type });
                  setIsEditorOpen(true);
                }
              }}
            >
              <Pencil className="w-4 h-4" /> Editar diseño
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 rounded-xl gap-2 border-slate-100 bg-slate-50 text-[14px] font-bold text-red-500"
              onClick={() => {
                const currentUv = selection.config?.prices?.uv || 0;
                const currentLicense = selection.imageBrandPrice || 0;
                if (isBrand) {
                  updateSelection({
                    catalog_image: null,
                    capturedBrandPreview: null,
                    brandTransform: null,
                    acceptedTerms: false,
                    imageBrandPrice: 0,
                    config: { ...selection.config, prices: { ...selection.config?.prices, uv: currentUv - currentLicense } }
                  });
                } else {
                  updateSelection({
                    imageCustomUrl: null,
                    capturedCustomPreview: null,
                    customTransform: null,
                  });
                }
              }}
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </Button>

            {isBrand && (
              <div
                onClick={() => updateSelection({ acceptedTerms: !selection.acceptedTerms })}
                className={`mt-2 p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-center ${
                  selection.acceptedTerms ? "bg-[#722296]/5 border-[#722296]/20" : "bg-white border-slate-100"
                }`}
              >
                <div className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  selection.acceptedTerms ? "bg-[#722296] border-[#722296]" : "bg-white border-slate-300"
                }`}>
                  {selection.acceptedTerms && <Check className="w-3.5 text-white" />}
                </div>
                <p className="text-[13px] leading-tight text-slate-500 font-medium">Acepto términos de licencia.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex pt-2 flex-col h-full overflow-hidden bg-[#fbfcfd]">
      <div className="shrink-0 border-b flex z-10 bg-white">
        {[{ id: "brand", label: "Licencias" }, { id: "custom", label: "Personal" }].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-4 text-[16px] font-bold relative transition-colors ${
              activeTab === t.id ? "text-[#722296]" : "text-slate-400"
            }`}
          >
            {t.label}
            {activeTab === t.id && (
              <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#722296] mx-8" />
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === "brand" ? (
            <motion.div key="brand" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {selection.catalog_image ? renderPreviewState("brand") : (
                <div className="grid gap-3 p-6">
                  {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#722296]" /></div>
                  ) : (
                    offerings.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => { setSelectedBrand(brand); setFlowView("gallery"); }}
                        className="w-full bg-white p-6 rounded-2xl flex justify-between items-center border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
                      >
                        <div className="relative h-8 w-24">
                          <Image src={getImageUrl(brand.icon || "")} alt={brand.name} fill className="object-contain grayscale opacity-50" unoptimized />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-bold text-slate-600">+ ${brand.price}</span>
                          <ChevronIcon size={18} className="text-slate-300" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {selection.imageCustomUrl ? renderPreviewState("custom") : (
                <div className="flex flex-col gap-6 p-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-2xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-[#722296]/30 transition-all shadow-sm"
                  >
                    <ImageIcon size={32} />
                    <span className="text-[15px] font-bold">Subir Foto o Imagen</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const optimizedBase64 = await resizeTo600(file);
                        setEditorTarget({ url: optimizedBase64, type: "custom" });
                        setIsEditorOpen(true);
                        e.target.value = "";
                      }
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {mounted && createPortal(
        <>
          <AnimatePresence>
            {flowView === "gallery" && (
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 bg-white z-[100] flex flex-col">
                <div className="p-6 border-b flex items-center gap-4">
                  <button onClick={() => setFlowView("idle")} className="p-2"><ArrowLeft /></button>
                  <h2 className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Colección {selectedBrand?.name}</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3">
                  {currentGalleryImages.map((img: any) => (
                    <button
                      key={img.id}
                      onClick={() => { setEditorTarget({ url: img.url, type: "brand", tag: selectedBrand.name }); setIsEditorOpen(true); }}
                      className="aspect-[2/3] relative rounded-xl overflow-hidden shadow-sm active:scale-95 transition-all bg-slate-50 border border-slate-100"
                    >
                      <Image src={img.url} alt="option" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <PhoneCaseEditor
            image={editorTarget?.url || ""}
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            onAccept={handleEditorAccept}
            availableColors={selection.availableColors}
            initialCaseId={selection.caseId}
            initialTransform={editorTarget?.type === "brand" ? selection.brandTransform : selection.customTransform}
            camera={(selection.model?.toLowerCase().includes("iphone") ? "apple" : "samsung") as any}
            allowClose={true}
          />
        </>,
        document.body
      )}
    </div>
  );
}