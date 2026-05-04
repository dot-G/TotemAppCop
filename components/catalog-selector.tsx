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
import { activeImageTabAtom, CameraCutoutStyle } from "@/lib/store";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// Tipos y Helpers
import { CatalogOffering } from "@/services/image-service2";
import { getImageUrl } from "@/lib/image-directus";
import {
  PhoneCaseEditor,
  EditorTransform,
} from "./image-selector/phone-case-editor2";

import { TermsPopup } from "./image-selector/terms-popup"; // Ajusta la ruta según donde lo guardaste

// Estado inicial para resetear transformaciones
const DEFAULT_TRANSFORM: EditorTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};

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

interface ImageSelectorProps {
  initialCatalog?: CatalogOffering[];
}

export default function ImageSelector({ initialCatalog = [] }: ImageSelectorProps) {
  const { selection, updateSelection, isHydrated } = useApp();
  const [activeTab, setActiveTab] = useAtom(activeImageTabAtom);

  const [flowView, setFlowView] = useState<"idle" | "gallery">("idle");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const offerings = initialCatalog;
  
  const [selectedBrand, setSelectedBrand] = useState<CatalogOffering | null>(null);
  const [editorTarget, setEditorTarget] = useState<{
    url: string;
    type: "brand" | "custom";
    tag?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Al lado de tus otros estados
const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTabChange = (tabId: "brand" | "custom") => {
    setActiveTab(tabId);
    updateSelection({ imageSourceType: tabId });
  };

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
    colourId: string,
    cameraStyle: CameraCutoutStyle
  ) => {
    const colorData = selection.availableColors.find((c) => c.caseId === caseId);

    const newBrandPrice = editorTarget?.type === "brand" 
      ? (parseFloat(selectedBrand?.price || "0")) 
      : 0;

    const currentTotalUv = selection.config?.prices?.uv || 0;
    const oldBrandPrice = selection.imageBrandPrice || 0;
    const baseUvWithoutLicense = currentTotalUv - oldBrandPrice;
    const finalUvPrice = baseUvWithoutLicense + newBrandPrice;

    const baseUpdates = {
      caseId: caseId,
      caseColor: colorData?.name || selection.caseColor,
      colourHex: newColorHex,
      colourId: colorData ? colourId : selection.colourId,
      imageSourceType: editorTarget?.type,
      imageBrandPrice: newBrandPrice, 
      config: {
        ...selection.config,
        prices: {
          ...selection.config?.prices,
          uv: finalUvPrice,
        },
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
        brandCameraStyle: cameraStyle,
      });
    } else {
      updateSelection({
        ...baseUpdates,
        imageCustomUrl: editorTarget?.url || selection.imageCustomUrl,
        capturedCustomPreview: capturedImage,
        customTransform: transform,
        customCameraStyle: cameraStyle,
      });
    }

    setIsEditorOpen(false);
    setFlowView("idle");
  };

  const renderPreviewState = (type: "brand" | "custom") => {
    const isBrand = type === "brand";
    const title = isBrand ? selection.selectedBrandTag : "Imagen Personal";
    const previewToDisplay = isBrand
      ? selection.capturedBrandPreview
      : selection.capturedCustomPreview;
    
    const sourceUrl = isBrand
      ? selection.catalog_image
        ? getImageUrl(selection.catalog_image)
        : null
      : selection.imageCustomUrl;

    return (
      <div className="p-3">
        <div className="flex items-start gap-6">
          <div className="p-4 w-1/2 flex justify-center items-center overflow-hidden rounded-xl">
            {previewToDisplay ? (
              <img
                src={previewToDisplay}
                alt="Case Preview"
                className="w-full h-auto object-contain rounded-lg shadow-sm"
                onClick={() => {
                  if (sourceUrl) {
                    setEditorTarget({ url: sourceUrl, type });
                    setIsEditorOpen(true);
                  }
                }}
              />
            ) : (
              <div className="aspect-[3/4] flex items-center justify-center w-full">
                <Loader2 className="animate-spin text-slate-300" />
              </div>
            )}
          </div>

          <div className="w-1/2 flex flex-col justify-center gap-3">
            <div className="mt-8 mb-1 text-left">
              <p className="text-[20px] leading-[1.1em] font-semibold text-black">
                {title}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-xl gap-2 border-slate-100 bg-slate-50 text-[13px] font-semibold px-2"
                onClick={() => {
                  if (sourceUrl) {
                    setEditorTarget({ url: sourceUrl, type });
                    setIsEditorOpen(true);
                  }
                }}
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Button>

              <Button
                variant="outline"
                className="h-11 rounded-xl gap-2 border-slate-100 bg-slate-50 text-[13px] font-semibold text-red-500 px-2"
                onClick={() => {
                  const currentUv = selection.config?.prices?.uv || 0;
                  const currentLicense = selection.imageBrandPrice || 0;

                  if (isBrand) {
                    updateSelection({
                      catalog_image: null,
                      capturedBrandPreview: null,
                      brandTransform: DEFAULT_TRANSFORM, // Reseteo de transformación
                      acceptedTerms: false,
                      imageBrandPrice: 0,
                      config: {
                        ...selection.config,
                        prices: { ...selection.config?.prices, uv: currentUv - currentLicense }
                      }
                    });
                  } else {
                    updateSelection({
                      imageCustomUrl: null,
                      capturedCustomPreview: null,
                      customTransform: DEFAULT_TRANSFORM, // Reseteo de transformación
                    });
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Borrar
              </Button>
            </div>

           {isBrand && (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-1 flex gap-3 items-start py-2 select-none"
  >
    {/* Contenedor del Checkbox con área de clic optimizada */}
    <div 
      onClick={() => updateSelection({ acceptedTerms: !selection.acceptedTerms })}
      className="group flex cursor-pointer items-start pt-0.5"
    >
      <div className={`
        shrink-0 w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all duration-200
        ${selection.acceptedTerms 
          ? "bg-[#722296] border-[#722296] shadow-[0_0_8px_rgba(114,34,150,0.4)]" 
          : "bg-white border-[#722296] group-hover:border-[#722296]/50 shadow-[0_0_8px_rgba(114,34,150,0.4)]"
        }
      `}>
        {selection.acceptedTerms && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
          </motion.div>
        )}
      </div>
    </div>

    {/* Texto con stopPropagation en el link para evitar conflictos de clic */}
    <p className="text-[14px] leading-tight text-slate-500 font-normal">
      Acepto los{" "}<br/>
      <span 
        onClick={(e) => {
          e.stopPropagation(); // IMPORTANTE: evita que el check cambie al tocar el link
          setIsTermsOpen(true);
        }} 
        className="font-semibold text-[#722296] cursor-pointer hover:underline decoration-1 underline-offset-2 transition-all"
      >
        Términos de Licencia
      </span>
    </p>
  </motion.div>
)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b flex z-10">
        {[
          { id: "brand", label: "Licencias" },
          { id: "custom", label: "Personal" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id as any)}
            className={`flex-1 py-2 text-[14px] font-semibold relative transition-colors ${
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

      <div className="flex-1 bg-white overflow-y-hidden no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="w-full"
          >
            {activeTab === "brand" ? (
              <div key="brand-content">
                {selection.catalog_image ? renderPreviewState("brand") : (
                  <div className="grid gap-3 p-6">
                    {offerings.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => { setSelectedBrand(brand); setFlowView("gallery"); }}
                        className="w-full bg-white p-5 rounded-[14px] flex justify-between items-center border border-slate-50 shadow-sm active:scale-[0.98]"
                      >
                        <div className="relative h-4 w-24">
                          <Image src={getImageUrl(brand.icon || "")} alt={brand.name} fill className="object-contain" unoptimized />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold uppercase text-slate-600">+ {brand.price}</span>
                          <ChevronIcon size={18} className="text-slate-300" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div key="custom-content">
                {selection.imageCustomUrl ? renderPreviewState("custom") : (
                  <div className="flex flex-col gap-6 p-6">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video rounded-[14px] bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400"
                    >
                      <ImageIcon size={32} />
                      <span className="text-[14px] font-semibold">Subir Foto o Imagen</span>
                    </button>
                    <input
                      type="file" ref={fileInputRef} className="hidden" accept="image/*"
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
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Renderizado del Popup de Términos */}
      <TermsPopup 
        isOpen={isTermsOpen} 
        onOpenChange={setIsTermsOpen} 
      />

{mounted && createPortal(
  <>
    {/* 1. GALERÍA (Slide-in suave con Tailwind) */}
    <div 
      className={`fixed inset-0 z-[100] bg-white flex flex-col transition-transform duration-300 ease-in-out ${
        flowView === "gallery" ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="px-3 py-2 border-b flex items-center gap-4">
        <button onClick={() => setFlowView("idle")} className="p-2">
          <ArrowLeft />
        </button>
        <h3 className="text-[16px] font-semibold flex-1 text-center pr-12 text-slate-900">
          {selectedBrand?.name}
        </h3>
      </div>
      <div className="flex-col p-4 grid grid-cols-3 gap-3">
        {currentGalleryImages.map((img: any) => (
          <button
            key={img.id}
            onClick={() => {
              setEditorTarget({ url: img.url, type: "brand", tag: selectedBrand?.name });
              setIsEditorOpen(true);
            }}
            className="aspect-[3/4] relative rounded-xl overflow-hidden shadow-sm bg-slate-50"
          >
            <Image src={`${img.url}?width=200`} alt="option" fill className="object-cover" unoptimized />
          </button>
        ))}
      </div>
    </div>

    {/* 2. EDITOR CON PROTECCIÓN DE TRANSFORMACIONES CRUZADAS */}
    <div 
      className={`fixed inset-0 z-[150] bg-white transition-transform duration-300 ease-in-out ${
        isEditorOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {isEditorOpen && editorTarget && (
        <PhoneCaseEditor
          // La key fuerza a React a destruir y crear el editor al cambiar de imagen o tipo
          key={`${editorTarget.type}-${editorTarget.url}`} 
          image={editorTarget.url}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onAccept={handleEditorAccept}
          availableColors={selection.availableColors}
          initialCaseId={selection.caseId}
          /* 
             SOLUCIÓN: Solo cargamos la transformación guardada si existe una preview ya capturada.
             Si no hay preview (es selección nueva), forzamos DEFAULT_TRANSFORM para no heredar basura.
          */
          initialTransform={
            editorTarget.type === "brand" 
              ? (selection.capturedBrandPreview ? selection.brandTransform : DEFAULT_TRANSFORM) 
              : (selection.capturedCustomPreview ? selection.customTransform : DEFAULT_TRANSFORM)
          }
          camera={
            editorTarget.type === "brand" 
              ? (selection.brandCameraStyle || "normal") 
              : (selection.customCameraStyle || "normal")
          }
          allowClose={true}
        />
      )}
    </div>
  </>,
  document.body
)}
    </div>
  );
}