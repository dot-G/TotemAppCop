"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Smartphone, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/hooks/use-app";
import { uploadImageToDirectus } from "@/services/upload2";
import { createOrder } from "@/services/order";
import { createOrderImage } from "@/services/order-image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContactFormProps {
  token: string | null;
}

// Configuración de países
const COUNTRIES = [
  { code: "MX", prefix: "+52", flag: "🇲🇽" }, // México primero para el default
  { code: "AR", prefix: "+54", flag: "🇦🇷" },
  { code: "CO", prefix: "+57", flag: "🇨🇴" },
];

export default function ContactForm({ token }: ContactFormProps) {
  const {
    selection,
    isHydrated,
    updateSelection,
    setStep,
    totalSelectionPrice,
    storeCode,
  } = useApp();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // México por defecto
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

  const mapSize = (size: string): "small" | "medium" | "large" => {
    const s = size?.toLowerCase() || "";
    if (s.includes("peque")) return "small";
    if (s.includes("median")) return "medium";
    return "large";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    let finalValue = value;

    if (id === "phone") {
      // Solo números y máximo 12 dígitos
      const numbers = value.replace(/\D/g, "");
      finalValue = numbers.slice(0, 12);
    }

    updateSelection({
      contact: {
        ...selection.contact,
        [id]: finalValue,
      },
    });
  };

  const uploadBase64OrBlob = async (url: string, prefix: string, authToken: string | null) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const extension = blob.type.split("/")[1] || "png";
    const file = new File(
      [blob],
      `${prefix}-${Date.now()}.${extension}`,
      { type: blob.type }
    );

    const uploadedFile = await uploadImageToDirectus(file, authToken);
    if (!uploadedFile?.id) throw new Error("Error al obtener ID de archivo");
    return uploadedFile.id;
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    if (!selection.contact.name || !selection.contact.email || !selection.contact.phone) {
      setError("Por favor, completa todos los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    window.dispatchEvent(new CustomEvent("form-submitting", { detail: true }));

    // Combinamos el prefijo con el número
    const fullPhone = `${selectedCountry.prefix}${selection.contact.phone}`;

    try {
      let finalPersonalImageId = null;
      let finalPreviewImageId = null;

      const previewToUpload = selection.imageSourceType === "brand"
        ? selection.capturedBrandPreview
        : selection.capturedCustomPreview;

      if (previewToUpload) {
        finalPreviewImageId = await uploadBase64OrBlob(previewToUpload, "preview-capture", token);
      }

      if (selection.imageSourceType === "custom" && selection.imageCustomUrl) {
        finalPersonalImageId = await uploadBase64OrBlob(selection.imageCustomUrl, "custom-original", token);
        if (selection.imageCustomUrl.startsWith("blob:")) {
          URL.revokeObjectURL(selection.imageCustomUrl);
        }
      }

      const hasImage = selection.imageSourceType !== null || selection.config?.includes_uv_print;
      let orderResponse;

      if (hasImage) {
        orderResponse = await createOrderImage({
          brand: selection.brandId || "",
          model: selection.model.id || "",
          customer_name: selection.contact.name,
          customer_email: selection.contact.email,
          customer_cell_phone: fullPhone,
          customer_place: "in_store",
          combo: selection.comboId,
          combo_includes_mica: selection.config?.includes_mica || false,
          combo_includes_case: selection.config?.includes_case || false,
          combo_includes_uv_print: selection.config?.includes_uv_print || false,
          combo_includes_catalog_image: selection.imageSourceType === "brand",
          mica_combo_content: selection.mica_combo_content,
          case_combo_content: selection.case_combo_content,
          uv_print_combo_content: selection.uv_print_combo_content,
          case_cut: selection.caseId,
          colour: selection.colourId,
          catalog_image_combo_content: selection.imageSourceType === "brand" ? selection.catalogId : null,
          catalog_image: selection.imageSourceType === "brand" ? selection.catalog_image : null,
          image_source_type: selection.imageSourceType === "brand" ? "catalog" : "personal",
          personal_image: selection.imageSourceType === "custom" ? finalPersonalImageId : null,
          preview_image: finalPreviewImageId,
          image_size: selection.imageSourceType === "brand"
            ? mapSize(selection.imageBrandConfig.size)
            : mapSize(selection.imageCustomConfig.size),
          image_orientation_degrees: selection.imageSourceType === "brand"
            ? selection.imageBrandConfig.rotation
            : selection.imageCustomConfig.rotation,
          final_combo_price: totalSelectionPrice,
          store_code: storeCode,
        }, token);
      } else {
        orderResponse = await createOrder({
          brand: selection.brandId || "",
          model: selection.model.id || "",
          customer_name: selection.contact.name,
          customer_email: selection.contact.email,
          customer_cell_phone: fullPhone,
          customer_place: "in_store",
          combo: selection.comboId,
          combo_includes_mica: selection.config?.includes_mica || false,
          combo_includes_case: selection.config?.includes_case || false,
          combo_includes_uv_print: false,
          combo_includes_catalog_image: false,
          mica_combo_content: selection.mica_combo_content,
          case_combo_content: selection.case_combo_content,
          case_cut: selection.caseId,
          colour: selection.colourId,
          final_combo_price: totalSelectionPrice,
          store_code: storeCode,
        }, token);
      }

      if (orderResponse?.data) {
        const { id, order_number, sku_code, final_combo_price } = orderResponse.data;
        updateSelection({
          orderId: id,
          orderNumber: order_number,
          orderSku: sku_code,
          orderPrice: final_combo_price,
          orderCustomImage: finalPersonalImageId || null,
        });
      }

      setStep("final-summary");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al procesar tu pedido.");
      setIsSubmitting(false);
      window.dispatchEvent(new CustomEvent("form-submitting", { detail: false }));
    }
  }, [selection, totalSelectionPrice, setStep, isSubmitting, updateSelection, token, storeCode, selectedCountry]);

  useEffect(() => {
    const handleTrigger = () => handleSubmit();
    window.addEventListener("trigger-contact-submit", handleTrigger);
    return () => window.removeEventListener("trigger-contact-submit", handleTrigger);
  }, [handleSubmit]);

  if (!isHydrated) return null;

  if (isSubmitting) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-10 bg-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
          <div className="relative mb-8">
            <Loader2 className="w-24 h-24 text-[#6b21a8] animate-spin stroke-[1px]" />
            <Smartphone className="w-10 h-10 text-[#6b21a8] absolute top-7 left-7" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase mb-2 text-center">Enviando Orden</h2>
          <p className="text-[10px] text-slate-400 font-bold tracking-[0.3em] uppercase">No cierres esta ventana</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white h-full font-sans">
      <main className="flex-1 overflow-y-auto px-4 pt-6 no-scrollbar">
        <div className="mb-3">
          <h2 className="text-[22px] font-semibold text-slate-900">Datos de Contacto</h2>
        </div>

        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1">
            <Label className="text-[14px] font-normal text-slate-700 ml-1">Nombre Completo *</Label>
            <Input id="name" placeholder="Nombre y Apellido" value={selection.contact.name} onChange={handleChange} className="h-14 rounded-[14px] border-slate-400 font-semibold text-slate-900 bg-slate-50/50 px-6 focus:ring-2 focus:ring-purple-100 transition-all" />
          </div>

          <div className="space-y-1">
            <Label className="text-[14px] font-normal text-slate-800 ml-1">Email *</Label>
            <Input id="email" type="email" placeholder="ejemplo@correo.com" value={selection.contact.email} onChange={handleChange} className="h-14 rounded-[14px] border-slate-400 font-semibold text-slate-900 bg-slate-50/50 px-6 focus:ring-2 focus:ring-purple-100 transition-all" />
          </div>

          <div className="space-y-1">
            <Label className="text-[14px] font-normal text-slate-700 ml-1">WhatsApp / Celular *</Label>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 h-14 rounded-[14px] border border-slate-400 bg-slate-50/50 hover:bg-slate-100 transition-all outline-none focus:ring-2 focus:ring-purple-100">
                    <span className="text-xl">{selectedCountry.flag}</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedCountry.prefix}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white rounded-xl border-slate-200 shadow-xl z-[150]">
                  {COUNTRIES.map((c) => (
                    <DropdownMenuItem 
                      key={c.code} 
                      className="flex gap-3 px-4 py-1 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setSelectedCountry(c)}
                    >
                      <span className="text-xl">{c.flag}</span>
                      <span className="font-bold text-slate-900">{c.code}</span>
                      <span className="text-slate-400 ml-auto">{c.prefix}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Input 
                id="phone" 
                type="text" 
                placeholder="" 
                value={selection.contact.phone} 
                onChange={handleChange} 
                className="h-14 flex-1 rounded-[14px] border-slate-400 font-semibold text-slate-900 bg-slate-50/50 px-6 focus:ring-2 focus:ring-purple-100 transition-all" 
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 text-[10px] font-black tracking-widest uppercase">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </main>
    </div>
  );
}