"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/hooks/use-app"; 
import { useAtom } from "jotai";
import { inactivityModalAtom } from "@/lib/ui-atoms"; 

export function useInactivityTimer(timeoutMs: number = 120000) {
  const { currentStep, resetApp } = useApp();
  const [modal, setModal] = useAtom(inactivityModalAtom);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // <-- Usaremos este nombre siempre

  const clearAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleTimeoutAction = () => {
    // 1. Limpiar todo
    clearAll();
    
    // 2. RESETEAR LA APP (Ocurre "atrás" del modal)
    resetApp(); 

    // 3. ESPERAR Y LUEGO CERRAR EL MODAL
    // Esto da tiempo a que el Onboarding cargue mientras el modal sigue encima
    setTimeout(() => {
      setModal({ isOpen: false, countdown: 20 });
    }, 600); 
  };

  const startCountdown = () => {
    if (modal.isOpen) return;
    
    setModal({ isOpen: true, countdown: 20 });
    
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setModal((prev) => {
        if (prev.countdown <= 1) {
          handleTimeoutAction();
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  useEffect(() => {
    if (currentStep === 'onboarding') {
      // Si el modal NO está abierto, limpiamos todo.
      // Si ESTÁ abierto, dejamos que termine su animación de cierre
      if (!modal.isOpen) {
        clearAll();
      }
      return;
    }

    const resetInactivityTimer = () => {
      if (modal.isOpen) return; 

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        startCountdown();
      }, timeoutMs);
    };

    const events = ["mousedown", "touchstart", "keypress"];
    const handler = () => resetInactivityTimer();

    events.forEach((e) => document.addEventListener(e, handler));
    resetInactivityTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => document.removeEventListener(e, handler));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, modal.isOpen, timeoutMs]);

  return { handleTimeoutAction };
}