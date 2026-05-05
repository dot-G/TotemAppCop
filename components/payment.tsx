"use client";

import React, { useRef, useState } from "react";
import { AlertTriangle, Loader2, FileDown, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { toJpeg } from "html-to-image";
import { useApp } from "@/hooks/use-app";
import Barcode from "react-barcode";

export default function Payment() {
  const { selection } = useApp();
  const captureContainerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionType, setActionType] = useState<"download" | "share" | null>(null);

  const reference = selection.orderNumber || "A3B5C7D9";
  const sku = selection.orderSku || "IPHONE-17P001";
  const barcodeValue = selection.orderSku || "IPHONE-17P001";

  const handleAction = async (type: "download" | "share") => {
    if (captureContainerRef.current === null) return;
    setIsGenerating(true);
    setActionType(type);

    try {
      const dataUrl = await toJpeg(captureContainerRef.current, {
        quality: 0.95,
        backgroundColor: "#f4f7f9",
        cacheBust: true,
      });

      if (type === "share" && navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `cupon-${reference}.jpg`, { type: "image/jpeg" });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Cupón de Pago",
            text: `Referencia: ${reference}`,
          });
        }
      } else {
        // Download (or fallback for share)
        const link = document.createElement("a");
        link.download = `cupon-${reference}.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsGenerating(false);
      setActionType(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9] font-sans items-center justify-start p-0 overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-2"
      >
        {/* --- ÁREA DE CAPTURA --- */}
        <div ref={captureContainerRef} className="p-3 bg-[#f4f7f9] min-[960px]:mt-8">
          <div className="bg-white rounded-[14px] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col border border-slate-100">
            <div className="pt-3 pb-3 text-center">
              <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">
                Referencia: <span className="text-[#757575] uppercase">{reference}</span>
              </h2>
            </div>

            <div className="h-px bg-slate-100 mx-0" />

            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100">
              <span className="text-[#757575] font-normal text-lg">SKU</span>
              <span className="text-black font-semibold text-lg">{sku}</span>
            </div>

            <div className="flex flex-col items-center px-0 py-8 bg-white">
              <div className="mb-2 px-2 w-full flex justify-center">
                 <Barcode value={barcodeValue} width={1.8} height={50} fontSize={14} background="transparent" margin={0} displayValue={true} />
              </div>
              <span className="text-[12px] text-slate-400 font-medium mt-2">Código de validación</span>
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-dashed border-slate-200">
              <div className="flex gap-4 items-start">
                <AlertTriangle className="text-emerald-500 w-6 h-6 shrink-0 mt-0.5 stroke-[2.5]" />
                <p className="text-black text-[13px] leading-tight font-normal">
                  Acérquese a la caja de pago más cercana con el cupón para iniciar el proceso de producción.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTONES DE ACCIÓN --- */}
        <div className="px-3 pt-4 pb-6 flex gap-3">
          {/* Botón Descargar (Izquierda) */}
          <button
            onClick={() => handleAction("download")}
            disabled={isGenerating}
            className="flex-1 h-[60px] border-2 border-black rounded-[14px] flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-all hover:bg-slate-50 disabled:opacity-50 shadow-sm"
          >
            {isGenerating && actionType === "download" ? (
              <Loader2 className="animate-spin w-5 h-5 text-slate-900" />
            ) : (
              <>
                <span className="text-[16px] font-bold text-slate-900">Descargar</span>
                <FileDown className="w-5 h-5 text-slate-900" />
              </>
            )}
          </button>

          {/* Botón Enviar (Derecha) */}
          <button
            onClick={() => handleAction("share")}
            disabled={isGenerating}
            className="flex-1 h-[60px] bg-[#1e62c1] rounded-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-slate-900 disabled:opacity-50 shadow-sm"
          >
            {isGenerating && actionType === "share" ? (
              <Loader2 className="animate-spin w-5 h-5 text-white" />
            ) : (
              <>
                <span className="text-[16px] font-bold text-white">Enviar</span>
                <Share2 className="w-5 h-5 text-white" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}