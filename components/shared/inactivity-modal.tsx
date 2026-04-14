"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAtom } from "jotai";
import { inactivityModalAtom } from "@/lib/ui-atoms";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "lucide-react"; // Añadí el icono por si lo quieres

export function InactivityModal() {
  const [modal, setModal] = useAtom(inactivityModalAtom);
  const [mounted, setMounted] = useState(false);

  // Evitar errores de hidratación en Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {modal.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }} // Tiempo ideal para ocultar el reset de fondo
          style={{ zIndex: 99999 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-[40px] p-10 w-full max-w-sm text-center shadow-2xl border border-slate-100"
          >
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Timer className="w-10 h-10 text-purple-600 animate-pulse" />
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic leading-none">
              ¿Sigues ahí?
            </h2>
            
            <p className="text-slate-500 font-medium mb-8 leading-tight">
              El kiosko se reiniciará en <br />
              <span className="text-purple-600 font-bold text-2xl tracking-tight">
                {modal.countdown} segundos
              </span>
            </p>

            <button
              onClick={() => setModal({ isOpen: false, countdown: 10 })}
              className="w-full bg-[#71E5FF] text-[#012B5D] h-20 rounded-3xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl uppercase italic tracking-tight"
            >
             
              ¡SÍ, CONTINUAR!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}