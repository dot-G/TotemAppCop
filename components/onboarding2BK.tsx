"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { OnboardSlide } from "@/services/onboarding";
import { getImageUrl } from '@/lib/image-directus';
import { Loader2 } from "lucide-react";

/**
 * CONFIGURACIÓN DE LAYOUT (Números puros para cálculos)
 */
const CARD_W_VW = 63.15;
const CARD_GAP_VW = 4.21;
const STEP_VW = CARD_W_VW + CARD_GAP_VW;

interface OnboardingProps {
  initialSlides?: OnboardSlide[];
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const mod = (n: number, m: number) => ((n % m) + m) % m;
const ringDist = (a: number, b: number, m: number) => {
  const d = mod(a - b, m);
  return d > m / 2 ? d - m : d;
};

export function Onboarding({ initialSlides = [] }: OnboardingProps) {
  const { setStep, isHydrated } = useApp();

  const slides = initialSlides;
  const COUNT = slides.length;

  const [virtualIndex, setVirtualIndex] = useState(0);
  const [dragDelta, setDragDelta] = useState(0); // Manejado en VW
  const [isDragging, setIsDragging] = useState(false);
  const [animating, setAnimating] = useState(false);

  const gesture = useRef({
    origin: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
    hasMoved: false
  }).current;

  const realIndex = useMemo(() => (COUNT > 0 ? mod(virtualIndex, COUNT) : 0), [virtualIndex, COUNT]);

  const moveBySteps = useCallback((steps: number) => {
    if (steps === 0 || animating) return;
    setAnimating(true);
    setVirtualIndex((prev) => prev + steps);
    setTimeout(() => setAnimating(false), 450);
  }, [animating]);

  const goToSlide = useCallback((targetReal: number) => {
    const diff = ringDist(targetReal, realIndex, COUNT);
    moveBySteps(diff);
  }, [realIndex, COUNT, moveBySteps]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (animating || COUNT === 0) return;
    setIsDragging(true);
    setDragDelta(0);
    gesture.hasMoved = false;
    gesture.origin = e.clientX;
    gesture.lastX = e.clientX;
    gesture.lastTime = Date.now();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dxPx = e.clientX - gesture.origin;
    const dxVw = (dxPx / window.innerWidth) * 100;

    if (Math.abs(dxPx) > 5) {
      gesture.hasMoved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    setDragDelta(-dxVw);

    const now = Date.now();
    const dt = now - gesture.lastTime;
    if (dt > 0) {
      const currentVw = (e.clientX / window.innerWidth) * 100;
      const lastVw = (gesture.lastX / window.innerWidth) * 100;
      gesture.velocity = (currentVw - lastVw) / dt;
    }
    gesture.lastX = e.clientX;
    gesture.lastTime = now;
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!gesture.hasMoved) {
      setDragDelta(0);
      return;
    }
    const velocityBias = clamp(-gesture.velocity * 25, -0.5, 0.5);
    const snapped = Math.round((dragDelta / STEP_VW) + velocityBias);
    setDragDelta(0);
    moveBySteps(snapped);
  };

  if (!isHydrated || slides.length === 0) {
    return (
      <div className="h-screen bg-[#4a1a8a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#71E5FF]" />
      </div>
    );
  }

  const currentSlide = slides[realIndex];

  return (
    <div
      className="relative flex flex-col h-screen max-h-screen bg-[#4a1a8a] overflow-hidden select-none"
      style={{ backgroundImage: 'url("/background.jpg")', backgroundSize: "cover" }}
    >
      <header className="relative z-10 flex justify-center pt-10 pb-4 shrink-0">
        <img
          src="/logo-telcel.svg"
          alt="Telcel Logo"
          className="h-auto w-[20.3vw] max-w-[140px]"
        />        </header>

      <div
        className="relative mt-4 z-10 shrink-0 touch-none overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height: "calc(380 / 812 * 100vh)" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[-2, -1, 0, 1, 2].map((offset) => {
            const slideIdx = mod(virtualIndex + offset, COUNT);
            const slide = slides[slideIdx];
            const pos = offset - dragDelta / STEP_VW;
            const dist = Math.abs(pos);

            const opacity = dist < 0.1 ? 1 : clamp(1 - dist * 0.5, 0.3, 0.7);
            const zIndex = 10 - Math.round(dist);
            const safeImageUrl = getImageUrl(slide.image.id);

            return (
              <div
                key={`slide-${virtualIndex + offset}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!gesture.hasMoved) moveBySteps(offset);
                }}
                className="absolute rounded-3xl overflow-hidden cursor-pointer pointer-events-auto"
                style={{
                  width: `${CARD_W_VW}vw`,
                  height: "calc(380 / 812 * 100vh)",
                  transform: `translateX(${pos * STEP_VW}vw) scale(${1 - dist * 0.05})`,
                  opacity,
                  zIndex,
                  transition: !isDragging ? "transform 0.45s cubic-bezier(.25,.85,.35,1), opacity 0.45s ease" : "none",
                }}
              >
                {safeImageUrl && (
                  <Image
                    src={`${safeImageUrl}?width=400`}
                    alt={slide.image_caption || ""}
                    fill
                    sizes={`${CARD_W_VW}vw`}
                    priority={offset === 0}
                    className="object-cover pointer-events-none"
                    draggable={false}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <span className="absolute bottom-[6%] left-0 right-0 text-white text-center font-semibold pointer-events-none text-[5vw] tracking-[-1px] leading-[1em] px-4">
                  {slide.image_caption}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-[2.1vw] py-[2.1vw] shrink-0">
        {slides.map((_, index) => (
          <button
            key={`dot-${index}`}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 h-[1vw] rounded-full ${index === realIndex
              ? "w-[8.4vw] bg-[#71E5FF]"
              : "w-[2.1vw] bg-white/40"
              }`}
          />
        ))}
      </div>

      <div
        key={`content-${realIndex}`}
        className="relative z-10 flex-1 flex flex-col items-center text-center min-h-0 mt-4 px-6"
        style={{ animation: "fadeInUp 0.5s ease-out forwards" }}
      >
        <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }` }} />
        <h1 className="text-white font-semibold text-[7vw] leading-[1.1em] max-w-[90%] text-balance">
          {currentSlide.title}
        </h1>
        <p className="text-white/70 text-[3vw] leading-[1.4em] mt-4 max-w-[90%] mx-auto">
          {currentSlide.description}
        </p>
      </div>

      <div className="relative z-10 flex justify-center px-6 pb-[4vh] pt-4 shrink-0">
        <Button
          onClick={() => setStep("phone-selector")}
          className="
      /* Ancho: flexible por defecto, fijo 350px si es > 380px */
      w-full min-[381px]:w-[380px] 
      
      /* Alto: h-16 (64px) por defecto, 8vh si es > 380px */
      h-16 min-[381px]:h-[8vh] 
      
      rounded-[18px] bg-[#71E5FF] text-[#012B5D] text-[4.5vw] font-semibold 
      hover:bg-white transition-colors border-none shadow-xl active:scale-95
    "
        >
          Empezar
        </Button>
      </div>
    </div>
  );
}