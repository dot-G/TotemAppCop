"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/hooks/use-app";
import { uploadImageToDirectus } from "@/services/upload";
import { createOrder } from "@/services/order";
import { createOrderImage } from "@/services/order-image";

export default function ContactForm() {
  const {
    selection,
    isHydrated,
    updateSelection,
    setStep,
    totalSelectionPrice,
  } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapSize = (size: string): "small" | "medium" | "large" => {
    const s = size?.toLowerCase() || "";
    if (s.includes("peque")) return "small";
    if (s.includes("median")) return "medium";
    return "large";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    updateSelection({
      contact: {
        ...selection.contact,
        [id]: id === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
      },
    });
  };

  // Helper para convertir base64/blob a File y subirlo
  const uploadBase64OrBlob = async (url: string, prefix: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const extension = blob.type.split("/")[1] || "png";
    const file = new File(
      [blob],
      `${prefix}-${Date.now()}.${extension}`,
      { type: blob.type }
    );
    const uploadedFile = await uploadImageToDirectus(file);
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

    try {
      let finalPersonalImageId = null;
      let finalPreviewImageId = null;

      // 1. PROCESAMIENTO DE PREVIEW (Captura del editor)
      // Se sube tanto para Brand como para Custom si existe la captura
      const previewToUpload = selection.imageSourceType === "brand" 
        ? selection.capturedBrandPreview 
        : selection.capturedCustomPreview;

      if (previewToUpload) {
        try {
          finalPreviewImageId = await uploadBase64OrBlob(previewToUpload, "preview-capture");
        } catch (err) {
          console.error("Error subiendo preview:", err);
          throw new Error("Error al procesar la vista previa del diseño.");
        }
      }

      // 2. PROCESAMIENTO DE IMAGEN ORIGINAL (Solo si es Custom)
      if (selection.imageSourceType === "custom" && selection.imageCustomUrl) {
        try {
          finalPersonalImageId = await uploadBase64OrBlob(selection.imageCustomUrl, "custom-original");
          if (selection.imageCustomUrl.startsWith("blob:")) {
            URL.revokeObjectURL(selection.imageCustomUrl);
          }
        } catch (uploadErr) {
          console.error("Error subiendo original:", uploadErr);
          throw new Error("No se pudo procesar la imagen original.");
        }
      }

      // 3. CREACIÓN DE LA ORDEN
      const hasImage = selection.imageSourceType !== null || selection.config?.includes_uv_print;
      let orderResponse;

      if (hasImage) {
        orderResponse = await createOrderImage({
          brand: selection.brandId || "",
          model: selection.modelId || "",
          customer_name: selection.contact.name,
          customer_email: selection.contact.email,
          customer_cell_phone: selection.contact.phone,
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
          preview_image: finalPreviewImageId, // Enviamos el ID de la captura subida
          image_size: selection.imageSourceType === "brand"
              ? mapSize(selection.imageBrandConfig.size)
              : mapSize(selection.imageCustomConfig.size),
          image_orientation_degrees: selection.imageSourceType === "brand"
              ? selection.imageBrandConfig.rotation
              : selection.imageCustomConfig.rotation,
          final_combo_price: totalSelectionPrice,
        });
      } else {
        orderResponse = await createOrder({
          brand: selection.brandId || "",
          model: selection.modelId || "",
          customer_name: selection.contact.name,
          customer_email: selection.contact.email,
          customer_cell_phone: selection.contact.phone,
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
        });
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
  }, [selection, totalSelectionPrice, setStep, isSubmitting, updateSelection]);

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
      <main className="flex-1 overflow-y-auto px-4 pt-10 no-scrollbar">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Datos de Contacto</h2>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label className="text-[14px] font-normal text-slate-700 ml-1">Nombre Completo *</Label>
            <Input id="name" placeholder="Nombre y Apellido" value={selection.contact.name} onChange={handleChange} className="h-16 rounded-2xl border-slate-400 font-semibold text-slate-900 bg-slate-50/50 px-6 focus:ring-2 focus:ring-purple-100 transition-all" />
          </div>

          <div className="space-y-1">
            <Label className="text-[14px] font-normal text-slate-700 ml-1">Email *</Label>
            <Input id="email" type="email" placeholder="ejemplo@correo.com" value={selection.contact.email} onChange={handleChange} className="h-16 rounded-[14px] border-slate-400 font-semibold text-slate-900 bg-slate-50/50 px-6 focus:ring-2 focus:ring-purple-100 transition-all" />
          </div>

          <div className="space-y-1">
            <Label className="text-[14px] font-normal text-slate-700 ml-1">WhatsApp / Celular *</Label>
            <Input id="phone" type="tel" placeholder="Ej: 3764000000" value={selection.contact.phone} onChange={handleChange} className="h-16 rounded-[14px] border-slate-400 font-semibold text-slate-900 bg-slate-50/50 px-6 focus:ring-2 focus:ring-purple-100 transition-all" />
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