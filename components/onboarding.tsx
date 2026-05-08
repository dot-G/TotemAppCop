"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { OnboardSlide } from "@/services/onboarding";
import { getImageUrl } from '@/lib/image-directus';
import { Loader2 } from "lucide-react";

// Configuración del Layout del Carrusel
const CARD_W_PERCENT = 63.15; 
const CARD_GAP_PERCENT = 4.21; 
const STEP_PERCENT = CARD_W_PERCENT + CARD_GAP_PERCENT;

const clampVal = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const mod = (n: number, m: number) => ((n % m) + m) % m;

export function Onboarding({ initialSlides = [] }: OnboardingProps) {
  const { setStep, isHydrated } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const slides = initialSlides;
  const COUNT = slides.length;

  // Estados de Navegación
  const [virtualIndex, setVirtualIndex] = useState(0);
  const [dragDelta, setDragDelta] = useState(0); 
  const [isDragging, setIsDragging] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Estados de Animación de Texto
  const [textOpacity, setTextOpacity] = useState(1);
  const [displayIndex, setDisplayIndex] = useState(0);

  const gesture = useRef({ origin: 0, hasMoved: false }).current;
  const realIndex = useMemo(() => (COUNT > 0 ? mod(virtualIndex, COUNT) : 0), [virtualIndex, COUNT]);

  // Sincronización suave del texto con el cambio de slide
  useEffect(() => {
    if (realIndex !== displayIndex) {
      setTextOpacity(0); 
      const timeout = setTimeout(() => {
        setDisplayIndex(realIndex);
        setTextOpacity(1);
      }, 250); // El texto cambia justo cuando la card nueva está cubriendo el centro
      return () => clearTimeout(timeout);
    }
  }, [realIndex, displayIndex]);

  const moveBySteps = useCallback((steps: number) => {
    if (steps === 0 || animating) return;
    setAnimating(true);
    setVirtualIndex((prev) => prev + steps);
    setTimeout(() => setAnimating(false), 500);
  }, [animating]);

  if (!isHydrated || slides.length === 0) {
    return (
      <div className="h-[100dvh] bg-[#4a1a8a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#71E5FF]" />
      </div>
    );
  }

  const currentSlide = slides[displayIndex];

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-[100dvh] w-full bg-[#4a1a8a] overflow-hidden select-none @container/main"
      style={{ 
        backgroundImage: 'url("/background.jpg")', 
        backgroundSize: "cover",
        backgroundPosition: "center",
        /* 
           Lógica de escala: Si la pantalla es horizontal, limitamos el ancho 
           del contenido a un ratio 9:16 para que no se deforme.
        */
        "--max-content-w": "min(100cqw, 100cqh * 0.56)", 
        "--u": "calc(var(--max-content-w) / 100)",
        "--t-size": "calc(var(--u) * 7.2)",
        "--d-size": "calc(var(--u) * 4.2)",
        "--logo-w": "calc(var(--u) * 22)",
        "--btn-h": "8.5dvh"
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="relative z-10 flex justify-center pt-[7dvh] shrink-0">
        <img 
            src="/logo-telcel.svg" 
            alt="Telcel" 
            style={{ width: "var(--logo-w)" }} 
            className="h-auto max-w-[280px]" 
        />
      </header>

      {/* Carousel */}
     <div
  className="relative mt-[4dvh] z-10 shrink-0 touch-none overflow-hidden"
  style={{ height: "38dvh" }} 
  onPointerDown={(e) => { 
    if (animating) return; 
    setIsDragging(true); 
    gesture.origin = e.clientX; 
    gesture.hasMoved = false;
  }}
  onPointerMove={(e) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - gesture.origin;
    if (Math.abs(dx) > 5) gesture.hasMoved = true;
    setDragDelta(-(dx / containerRef.current.offsetWidth) * 100);
  }}
  onPointerUp={() => {
    setIsDragging(false);
    if (gesture.hasMoved) {
      moveBySteps(Math.round(dragDelta / STEP_PERCENT));
    }
    setDragDelta(0);
  }}
>
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[-2, -1, 0, 1, 2].map((offset) => {
      const slideIdx = mod(virtualIndex + offset, COUNT);
      const pos = offset - dragDelta / STEP_PERCENT;
      const dist = Math.abs(pos);
      
      // Solo renderizamos lo que está cerca para optimizar
      if (dist > 2.2) return null;

      return (
        <div
          key={`slide-${virtualIndex + offset}`}
          onClick={() => { if (!gesture.hasMoved) moveBySteps(offset); }}
          className="absolute rounded-[calc(var(--u)*5)] overflow-hidden pointer-events-auto cursor-pointer"
          style={{
            width: `${CARD_W_PERCENT}%`,
            height: "100%",
            maxWidth: "500px",
            // Quitamos la opacidad general y usamos transformaciones puras
            transform: `translateX(${pos * STEP_PERCENT}%) scale(${1 - dist * 0.12})`,
            zIndex: 10 - Math.round(dist * 2), // Multiplicamos para que el centro gane siempre
            transition: !isDragging ? "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none",
            backgroundColor: "#4a1a8a", // Fondo sólido para que no se vea a través
          }}
        >
          <Image 
            src={`${getImageUrl(slides[slideIdx].image.id)}?width=800`} 
            alt="" 
            fill 
            className="object-cover pointer-events-none" 
            priority={offset === 0}
          />
          
          {/* Overlay Dinámico: Se oscurece a medida que se aleja del centro */}
          <div 
            className="absolute inset-0 transition-colors duration-500"
            style={{ 
              backgroundColor: `rgba(0, 0, 0, ${clampVal(dist * 0.6, 0, 1)})`,
              // Un degradado extra para el texto siempre visible abajo
              backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)'
            }} 
          />

          <span 
            className="absolute bottom-[10%] left-0 right-0 text-white text-center font-semibold text-[calc(var(--u)*5.5)] px-6 leading-tight transition-opacity duration-300"
            style={{ 
              // El texto de las tarjetas laterales se desvanece un poco para no distraer
              opacity: clampVal(1 - dist, 0, 1) 
            }}
          >
            {slides[slideIdx].image_caption}
          </span>
        </div>
      );
    })}
  </div>
</div>

      {/* Dots */}
      <div className="flex justify-center gap-[1.5dvh] pt-[4dvh] pb-[2dvh] shrink-0">
        {slides.map((_, index) => (
          <div 
            key={index} 
            onClick={() => {
                const diff = ((index - realIndex + (COUNT / 2)) % COUNT) - (COUNT / 2);
                moveBySteps(Math.round(diff));
            }}
            className={`h-[1dvh] cursor-pointer rounded-full transition-all duration-300 ${index === realIndex ? "w-[4dvh] bg-[#71E5FF]" : "w-[1dvh] bg-white/30"}`} 
          />
        ))}
      </div>

     {/* Text Content: Con transición de opacidad y posición manual */}
<div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8 min-[960px]:px-16 overflow-hidden">  <div
    style={{
      opacity: textOpacity,
      transform: `translateY(${textOpacity === 0 ? '15px' : '0px'})`,
      transition: "opacity 0.5s ease-in-out, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
      willChange: "opacity, transform"
    }}
  >
    <h1 className="text-white font-semibold leading-[1.1] text-balance" style={{ fontSize: "var(--t-size)" }}>
      {currentSlide.title}
    </h1>
    <p className="text-white/80 leading-[1.3em] mt-[2.5dvh] max-w-[100%]" style={{ fontSize: "var(--d-size)" }}>
      {currentSlide.description}
    </p>
  </div>
</div>

      {/* Button */}
      <div className="relative z-10 flex px-10 pb-[7dvh] pt-4 shrink-0">
        <Button
          onClick={() => setStep("phone-selector")}
          className="flex-1 rounded-[calc(var(--u)*4)] bg-[#71E5FF] text-[#012B5D] font-semibold shadow-2xl active:scale-95 transition-all max-w-[450px] mx-auto"
          style={{ 
            height: "var(--btn-h)", 
            fontSize: "calc(var(--t-size) * 0.7)" 
          }}
        >
          Empezar
        </Button>
      </div>
    </div>
  );
}

interface OnboardingProps {
  initialSlides?: OnboardSlide[];
}