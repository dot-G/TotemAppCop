"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  FileDown,
  Share2,
  CheckCircle2,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import Barcode from "react-barcode";
import { toJpeg } from "html-to-image";

// Importamos el nuevo servicio
import { getOrder, OrderData } from "@/services/getOrder"; 

export default function QrOrderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const captureContainerRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionType, setActionType] = useState<"download" | "share" | null>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const data = await getOrder(slug);
        setOrder(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchOrderData();
  }, [slug]);

  const handleAction = async (type: "download" | "share") => {
    if (captureContainerRef.current === null || !order) return;
    setIsGenerating(true);
    setActionType(type);
    try {
      const dataUrl = await toJpeg(captureContainerRef.current, {
        quality: 0.95,
        backgroundColor: "#f4f7f9",
      });
      if (type === "share" && navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `ticket-${order.order_number}.jpg`, { type: "image/jpeg" });
        await navigator.share({ files: [file], title: "Ticket de Pago" });
      } else {
        const link = document.createElement("a");
        link.download = `ticket-${order.order_number}.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) { 
      console.error(err); 
    } finally {
      setIsGenerating(false);
      setActionType(null);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#f4f7f9]">
      <Loader2 className="w-8 h-8 text-[#1e62c1] animate-spin" />
    </div>
  );

  if (!order) return null; // Podrías retornar un estado de error aquí

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7f9] items-center p-4 pt-10 font-sans text-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div ref={captureContainerRef} className="bg-[#f4f7f9] p-4">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 rounded-b-full" />

            {/* Encabezado Compacto */}
            <div className="pt-5 pb-4 px-8 flex items-center gap-4 border-b border-slate-50">
              <div className="flex-shrink-0 p-2 rounded-xl bg-blue-50/50">
                <CheckCircle2 size={22} className="text-[#1e62c1]" />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] leading-none mb-1">
                  Orden Lista
                </h1>
                <p className="text-xl font-semibold tracking-tight leading-none">
                  #{order.order_number}
                </p>
              </div>
            </div>

            <div className="relative flex items-center px-4">
              <div className="absolute left-[-10px] w-5 h-5 bg-[#f4f7f9] rounded-full border-r border-slate-100" />
              <div className="flex-1 border-t-2 border-dashed border-slate-100" />
              <div className="absolute right-[-10px] w-5 h-5 bg-[#f4f7f9] rounded-full border-l border-slate-100" />
            </div>

            <div className="p-8 space-y-2">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SKU</span>
                  <p className="font-semibold text-lg">{order.sku_code}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monto Total</span>
                  <p className="text-[#1e62c1] font-semibold text-3xl">
                    ${order.final_combo_price}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-xl px-6 flex flex-col items-center justify-center border border-slate-50">
                <Barcode
                  value={order.sku_code}
                  width={1.6}
                  height={60}
                  fontSize={12}
                  lineColor="#1e293b"
                  background="transparent"
                />
              </div>
            </div>

            <div className="bg-slate-900 py-3 px-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-white opacity-90" />
                <p className="text-white/80 text-[12px] leading-snug font-medium">
                  Presenta este ticket en caja.
                </p>
              </div>
              <img
                src="/logo-telcel.svg"
                alt="Telcel Logo"
                className="w-14 h-auto brightness-0 invert"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => handleAction("download")}
              disabled={isGenerating}
              className="flex-1 h-14 rounded-xl border-2 border-slate-200 bg-white font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {isGenerating && actionType === "download" ? <Loader2 className="animate-spin" size={20} /> : <FileDown size={20} />}
              Guardar
            </button>
            <button
              onClick={() => handleAction("share")}
              disabled={isGenerating}
              className="flex-1 h-14 rounded-xl bg-[#1e62c1] text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {isGenerating && actionType === "share" ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
              Compartir
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}