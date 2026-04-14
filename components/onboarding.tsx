"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding"; // Importamos el hook
import { getAssetUrl } from "@/lib/directus";
import { getImageUrl } from '@/lib/image-directus';
import { Loader2 } from "lucide-react";

// Eliminamos el array slides estático que estaba aquí arriba

const CARD_W = 240;
const CARD_GAP = 16;
const STEP = CARD_W + CARD_GAP;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function ringDist(a: number, b: number, m: number) {
  const d = mod(a - b, m);
  return d > m / 2 ? d - m : d;
}

export function Onboarding() {
  const { setStep, isHydrated } = useApp();

  // 1. Consumimos los datos de Directus
  const { data: slides = [], isLoading, isError } = useOnboarding();
  const COUNT = slides.length;

  const [virtualIndex, setVirtualIndex] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [animating, setAnimating] = useState(false);

  const pointerOrigin = useRef(0);
  const velocityRef = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const hasMoved = useRef(false);

  // El realIndex ahora depende del tamaño dinámico del array de la API
  const realIndex = COUNT > 0 ? mod(virtualIndex, COUNT) : 0;

  const moveBySteps = useCallback((steps: number) => {
    if (steps === 0) return;
    setAnimating(true);
    setVirtualIndex((prev) => prev + steps);
    setTimeout(() => setAnimating(false), 450);
  }, []);

  const goToSlide = (targetReal: number) => {
    const diff = ringDist(targetReal, realIndex, COUNT);
    moveBySteps(diff);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (animating || COUNT === 0) return;
    setIsDragging(true);
    setDragDelta(0);
    hasMoved.current = false;
    pointerOrigin.current = e.clientX;
    lastX.current = e.clientX;
    lastTime.current = Date.now();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - pointerOrigin.current;
    if (Math.abs(dx) > 5) {
      hasMoved.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    setDragDelta(-dx);
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) velocityRef.current = (e.clientX - lastX.current) / dt;
    lastX.current = e.clientX;
    lastTime.current = now;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!hasMoved.current) {
      setDragDelta(0);
      return;
    }
    const rawSteps = dragDelta / STEP;
    const velocityBias = clamp(-velocityRef.current * 0.4, -0.5, 0.5);
    const snapped = Math.round(rawSteps + velocityBias);
    setDragDelta(0);
    moveBySteps(snapped);
  };

  const handleStart = () => {
    setStep("phone-selector");
  };

  // Estado de Carga / Hidratación
  if (!isHydrated || isLoading) {
    return (
      <div className="h-screen bg-[#4a1a8a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#71E5FF]" />
      </div>
    );
  }

  // Si hay error o no hay slides
  if (isError || slides.length === 0) {
    return (
      <div className="h-screen bg-[#4a1a8a] flex items-center justify-center p-6 text-center text-white">
        <p>
          No pudimos cargar la configuración del Kiosko. Por favor contacta a
          soporte.
        </p>
      </div>
    );
  }

  const currentSlide = slides[realIndex];

  return (
    <div
      className="relative flex flex-col h-screen max-h-screen bg-[#4a1a8a] overflow-hidden select-none"
      style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: "cover",
      }}
    >
      <header className="relative z-10 flex justify-center pt-10 pb-4 shrink-0">
        <img
          src="/logo-telcel.svg"
          alt="Telcel Logo"
          width={100} // Ajustado a un tamaño real
          height={40}
          className="h-auto w-auto"
        />
      </header>

      {/* Contenedor del Carrusel */}
      <div
        className="relative z-10 shrink-0 touch-none overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height: 380 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[-2, -1, 0, 1, 2].map((offset) => {
            const slideIdx = mod(virtualIndex + offset, COUNT);
            const slide = slides[slideIdx];
            const pos = offset - dragDelta / STEP;
            const dist = Math.abs(pos);

            const opacity = dist < 0.1 ? 1 : clamp(1 - dist * 0.5, 0.3, 0.7);
            const translateX = pos * STEP;
            const zIndex = 10 - Math.round(dist);

            const safeImageUrl = getImageUrl(slide.image.id);
            //const safeImageUrl = getAssetUrl(slide.image.id, { width: 600, quality: 75 });


            return (
              <div
                key={`slide-${virtualIndex + offset}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasMoved.current) moveBySteps(offset);
                }}
                className="absolute rounded-3xl overflow-hidden cursor-pointer pointer-events-auto"
                style={{
                  width: CARD_W,
                  height: 360,
                  transform: `translateX(${translateX}px) scale(${
                    1 - dist * 0.05
                  })`,
                  opacity,
                  zIndex,
                  transition: !isDragging
                    ? "transform 0.45s cubic-bezier(.25,.85,.35,1), opacity 0.45s ease"
                    : "none",
                }}
              >
                {/* Cargamos imagen desde Directus */}
                {safeImageUrl ? (
                 
                    <Image
                      src={`${safeImageUrl}?width=400`}
                     
                      alt={slide.image_caption || "Slide image"}
                      fill
                      sizes={`${CARD_W}px`}
                      priority={offset === 0}
                      className="object-cover pointer-events-none"
                      draggable={false}
                    />
                 
                ) : (
                  <div className="w-full h-full bg-slate-200 animate-pulse flex items-center justify-center">
                    {/* Placeholder mientras carga o si no hay imagen */}
                    <span className="text-slate-400">No image available</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <span className="absolute bottom-6 left-0 right-0 text-white text-center font-semibold pointer-events-none text-[28px] tracking-[-1px] leading-[1em] px-4">
                  {slide.image_caption}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicadores Dinámicos */}
      <div className="flex justify-center gap-2 py-2 shrink-0">
        {slides.map((_, index) => (
          <button
            key={`dot-${index}`}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === realIndex ? "w-8 bg-[#71E5FF]" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Textos Informativos Dinámicos */}
      <div
        key={`content-${realIndex}`}
        className="relative z-10 flex-1 flex flex-col items-center text-center min-h-0 mt-4 px-6"
        style={{ animation: "fadeInUp 0.5s ease-out forwards" }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `,
          }}
        />

        <h1 className="text-white font-semibold text-[36px] leading-[1.1em] text-balance">
          {currentSlide.title}
        </h1>
        <p className="text-white/70 text-[15px] leading-[1.4em] max-w-xs mt-4">
          {currentSlide.description}
        </p>
      </div>

      <div className="relative z-10 flex gap-4 px-6 pb-[30px] pt-4 shrink-0">
        <Button
          onClick={handleStart}
          className="flex-1 h-16 rounded-[18px] bg-[#71E5FF] text-[#012B5D] text-[20px] font-semibold hover:bg-white transition-colors border-none shadow-xl active:scale-95"
        >
          Empezar
        </Button>
      </div>
    </div>
  );
}
