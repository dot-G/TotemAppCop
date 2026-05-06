"use client";

import React, { useRef, useState, useEffect } from "react";
import { AlertTriangle, Info, CheckCircle2, Loader2, FileDown, Share2, Smartphone, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { toJpeg } from "html-to-image";
import { useApp } from "@/hooks/use-app";
import Barcode from "react-barcode";
import QRCode from "react-qr-code";
import Cookies from "js-cookie";

export default function Payment() {
  const { selection } = useApp();
  const captureContainerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionType, setActionType] = useState<"download" | "share" | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const type = Cookies.get("type_user");
    setUserType(type || "store");
  }, []);

  const reference = selection.orderNumber || "A3B5C7D9";
  const sku = selection.orderSku || "IPHONE-17P001";
  const barcodeValue = selection.orderSku || "IPHONE-17P001";
  const qrUrl = `${window.location.origin}/qr/${reference}`;

  const isOperator = userType === "operator";
  const isTotem = userType === "totem";
  const showQR = isOperator || isTotem;

  const handleAction = async (type: "download" | "share") => {
    setIsGenerating(true);
    setActionType(type);
    try {
      if (isOperator && type === "share") {
        if (navigator.share) {
          await navigator.share({ url: qrUrl });
        } else {
          await navigator.clipboard.writeText(qrUrl);
          alert("Enlace copiado");
        }
        return;
      }

      if (captureContainerRef.current === null) return;
      const dataUrl = await toJpeg(captureContainerRef.current, {
        quality: 0.95,
        backgroundColor: "#f4f7f9",
        cacheBust: true,
      });

      if (type === "share" && navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `cupon-${reference}.jpg`, { type: "image/jpeg" });
        await navigator.share({ files: [file], title: "Cupón de Pago" });
      } else {
        const link = document.createElement("a");
        link.download = `cupon-${reference}.jpg`;
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

  // --- BLOQUE 1: VISTA DE OPERADOR / TÓTEM (QR) ---
  const QRView = () => (
    <div className="bg-white rounded-[14px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
      <div className="pt-4 pb-4 text-center border-b border-slate-100">
        <h2 className="text-[16px] font-semibold text-slate-900">
          Referencia: <span className="text-slate-600 uppercase">{reference}</span>
        </h2>
      </div>
      <div className="flex flex-col items-center py-10 bg-white">
        <div className="p-4 bg-white border-2 border-slate-50 rounded-2xl shadow-sm">
          <QRCode value={qrUrl} size={200} viewBox={`0 0 256 256`} />
        </div>
        <a href={qrUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[13px] text-blue-600 font-semibold mt-6 hover:underline">
          <ExternalLink className="w-4 h-4" />
          Ver Ticket
        </a>
      </div>
      <div className="hidden p-5 bg-blue-50/50 border-t border-dashed border-blue-100">
        <div className="flex gap-4 items-start">
          <Smartphone className="text-blue-500 w-6 h-6 shrink-0 stroke-[2.5]" />
          <p className="text-slate-700 text-[13px] leading-snug">
            Utilice este código para escanear y procesar el pedido desde la terminal de producción.
          </p>
        </div>
      </div>
    </div>
  );

  // --- BLOQUE 2: VISTA DE CLIENTE (TICKET/BARCODE) ---
  const TicketView = () => (
   <div className="bg-[#f4f7f9] p-4">
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
                <p className="text-xl uppercase font-semibold tracking-tight leading-none">
                  {reference}
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
                  <p className="font-semibold text-lg">{sku}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monto Total</span>
                  <p className="text-[#1e62c1] font-semibold text-3xl">
                    ${selection.orderPrice}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-xl px-6 flex flex-col items-center justify-center border border-slate-50">
                <Barcode
                  value={sku}
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
  );

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9] items-center p-0 overflow-y-auto no-scrollbar">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-4 min-[960px]:mt-8">
        
        {/* ÁREA DE CAPTURA INDEPENDIENTE */}
        <div ref={captureContainerRef} className="p-3 bg-[#f4f7f9]">
          {showQR ? <QRView /> : <TicketView />}
        </div>

        {/* BOTONES DE ACCIÓN */}
        {!isTotem && (
          <div className="px-3 pt-2 pb-8 flex gap-3">
            {!isOperator && (
              <button onClick={() => handleAction("download")} disabled={isGenerating} className="flex-1 h-[60px] border-2 border-slate-900 rounded-[14px] flex items-center justify-center gap-2 bg-white active:scale-95 transition-all">
                {isGenerating && actionType === "download" ? <Loader2 className="animate-spin w-5 h-5" /> : <><span className="font-bold">Descargar</span><FileDown className="w-5 h-5" /></>}
              </button>
            )}
            <button onClick={() => handleAction("share")} disabled={isGenerating} className="flex-1 h-[60px] bg-blue-600 rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-all">
              {isGenerating && actionType === "share" ? <Loader2 className="animate-spin w-5 h-5 text-white" /> : <><span className="font-bold text-white">Compartir</span><Share2 className="w-5 h-5 text-white" /></>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}