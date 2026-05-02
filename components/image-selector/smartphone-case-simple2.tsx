"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useCallback, useEffect } from "react";

export type CameraCutoutStyle = 
  | "horizontal-top" | "square-left" | "vertical-pill" 
  | "pill-left" | "circle-large" | "circle-small" 
  | "square-center" | "rectangular-left";

interface SmartphoneCaseSimpleProps {
  frameColor?: string;
  caseImage?: string;
  className?: string;
  width?: number;
  cameraCutout?: CameraCutoutStyle;
  glowIntensity?: number;
  imageOffset?: { x: number; y: number };
  imageScale?: number;
  imageRotation?: number;
  onImageOffsetChange?: (offset: { x: number; y: number }) => void;
  onImageScaleChange?: (scale: number) => void;
  onImageRotationChange?: (rotation: number) => void;
  enableDrag?: boolean;
  enablePinchZoom?: boolean;
  enablePinchRotation?: boolean;
}

export function SmartphoneCaseSimple({
  frameColor = "#1a1a1a",
  caseImage,
  className,
  width = 280,
  cameraCutout = "square-left",
  glowIntensity = 0.3,
  imageOffset: externalOffset,
  imageScale = 1,
  imageRotation = 0,
  onImageOffsetChange,
  onImageScaleChange,
  onImageRotationChange,
  enableDrag = true,
  enablePinchZoom = true,
  enablePinchRotation = true,
}: SmartphoneCaseSimpleProps) {
  const [internalOffset, setInternalOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });
  const pinchStartDistanceRef = useRef(0);
  const pinchStartScaleRef = useRef(1);
  const pinchStartAngleRef = useRef(0);
  const pinchStartRotationRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const offset = externalOffset ?? internalOffset;
  const setOffset = onImageOffsetChange ?? setInternalOffset;

  const height = width * 1.85;
  const borderRadius = width * 0.12;
  const framePadding = width * 0.025;

  const getMousePosition = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (width / rect.width),
      y: (clientY - rect.top) * (height / rect.height),
    };
  }, [width, height]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!enableDrag || !caseImage) return;
    setIsDragging(true);
    const pos = getMousePosition(clientX, clientY);
    dragStartRef.current = pos;
    offsetStartRef.current = offset;
  }, [enableDrag, caseImage, getMousePosition, offset]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    const pos = getMousePosition(clientX, clientY);
    const dx = pos.x - dragStartRef.current.x;
    const dy = pos.y - dragStartRef.current.y;

    const rad = (imageRotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    setOffset({
      x: offsetStartRef.current.x + (dx * cos + dy * sin),
      y: offsetStartRef.current.y + (-dx * sin + dy * cos),
    });
  }, [isDragging, getMousePosition, setOffset, imageRotation]);

  // Manejo de eventos táctiles optimizado para iPhone (No-pasivo)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onTouchStart = (e: TouchEvent) => {
      if (!caseImage) return;
      if (e.touches.length === 2 && (enablePinchZoom || enablePinchRotation)) {
        e.preventDefault();
        setIsPinching(true);
        setIsDragging(false);
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        pinchStartScaleRef.current = imageScale;
        pinchStartAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
        pinchStartRotationRef.current = imageRotation;
      } else if (e.touches.length === 1) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!caseImage) return;
      if (e.cancelable) e.preventDefault();

      if (isPinching && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        
        if (enablePinchZoom && onImageScaleChange) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          const newScale = Math.min(4, Math.max(0.5, pinchStartScaleRef.current * (dist / pinchStartDistanceRef.current)));
          onImageScaleChange(newScale);
        }
        if (enablePinchRotation && onImageRotationChange) {
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          onImageRotationChange(pinchStartRotationRef.current + (angle - pinchStartAngleRef.current));
        }
      } else if (isDragging) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      setIsDragging(false);
      setIsPinching(false);
    };

    svg.addEventListener("touchstart", onTouchStart, { passive: false });
    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    svg.addEventListener("touchend", onTouchEnd);

    return () => {
      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onTouchEnd);
    };
  }, [caseImage, isPinching, isDragging, imageScale, imageRotation, handleStart, handleMove, onImageScaleChange, onImageRotationChange, enablePinchZoom, enablePinchRotation]);

  const getCameraCutout = () => {
    const tm = width * 0.08;
    const styles: Record<string, any> = {
      "square-left": { x: width * 0.06, y: tm, width: width * 0.385, height: width * 0.385, rx: width * 0.066 },
      "horizontal-top": { x: (width - width * 0.82) / 2, y: tm, width: width * 0.82, height: width * 0.22, rx: width * 0.055 },
      "vertical-pill": { x: (width - width * 0.176) / 2, y: tm, width: width * 0.176, height: width * 0.605, rx: width * 0.088 },
      "pill-left": { x: width * 0.06, y: tm, width: width * 0.176, height: width * 0.605, rx: width * 0.088 },
      "circle-large": { x: (width - width * 0.55) / 2, y: tm, width: width * 0.55, height: width * 0.55, rx: (width * 0.55) / 2 },
      "circle-small": { x: width * 0.06, y: tm, width: width * 0.275, height: width * 0.275, rx: width * 0.1375 },
      "square-center": { x: (width - width * 0.45) / 2, y: tm, width: width * 0.45, height: width * 0.45, rx: width * 0.06 },
      "rectangular-left": { x: width * 0.06, y: tm, width: width * 0.385, height: width * 0.52, rx: width * 0.066 },
    };
    return styles[cameraCutout] || styles["square-left"];
  };

  const camera = getCameraCutout();
  const imageAreaTop = camera.y + camera.height + width * 0.04;
  const printArea = {
    x: framePadding,
    y: imageAreaTop,
    width: width - framePadding * 2,
    height: height - imageAreaTop - framePadding,
  };

  const scaledWidth = printArea.width * 1.2 * imageScale;
  const scaledHeight = printArea.height * imageScale;
  const uniqueId = useRef(Math.random().toString(36).substr(2, 9)).current;

  return (
    <div className={cn("relative inline-block select-none touch-none", className)}>
      {/* Glow externo */}
      <div
        className="absolute inset-0 blur-3xl -z-10 scale-110"
        style={{
          backgroundColor: frameColor,
          opacity: glowIntensity,
          borderRadius: borderRadius,
        }}
      />

      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <defs>
          {/* ClipPath para el área de impresión */}
          <clipPath id={`clip-${uniqueId}`}>
            <rect x={printArea.x} y={printArea.y} width={printArea.width} height={printArea.height} rx={borderRadius * 0.5} />
          </clipPath>

          {/* Gradiente de estructura de la funda */}
          <linearGradient id={`frameGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={frameColor} stopOpacity="1" />
            <stop offset="50%" stopColor={frameColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={frameColor} stopOpacity="0.75" />
          </linearGradient>

          {/* Brillo principal (Shine) */}
          <linearGradient id={`shine-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>

          {/* Brillo superior */}
          <linearGradient id={`topShine-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Reflejo lateral */}
          <linearGradient id={`sideRef-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="black" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* 1. Marco Exterior (Outer Frame) */}
        <rect width={width} height={height} rx={borderRadius} fill={`url(#frameGrad-${uniqueId})`} />
        
        {/* Borde sutil de luz perimetral */}
        <rect x="1" y="1" width={width-2} height={height-2} rx={borderRadius-1} fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1" />

        {/* 2. Botones Laterales */}
        <rect x="-2" y={height * 0.18} width="3" height={width * 0.06} rx="1" fill={frameColor} />
        <rect x="-2" y={height * 0.26} width="3" height={width * 0.12} rx="1" fill={frameColor} />
        <rect x={width-1} y={height * 0.23} width="3" height={width * 0.14} rx="1" fill={frameColor} />

        {/* 3. Superficie Trasera Base */}
        <rect 
          x={framePadding} y={framePadding} 
          width={width - framePadding*2} height={height - framePadding*2} 
          rx={borderRadius - framePadding/2} fill={frameColor} 
        />

        {/* 4. Capa de Imagen del Cliente */}
        <g clipPath={`url(#clip-${uniqueId})`}>
          {caseImage && (
            <image
              href={caseImage}
              x={printArea.x + (printArea.width - scaledWidth) / 2 + offset.x}
              y={printArea.y + (printArea.height - scaledHeight) / 2 + offset.y}
              width={scaledWidth}
              height={scaledHeight}
              transform={`rotate(${imageRotation} ${printArea.x + printArea.width / 2} ${printArea.y + printArea.height / 2})`}
              style={{ transition: isDragging || isPinching ? "none" : "all 0.1s ease-out" }}
              preserveAspectRatio="xMidYMid slice"
            />
          )}
        </g>

        {/* 5. Capas de Realismo (Overlays) */}
        {/* Brillo General */}
        <rect 
          x={framePadding} y={framePadding} 
          width={width - framePadding*2} height={height - framePadding*2} 
          rx={borderRadius - framePadding/2} fill={`url(#shine-${uniqueId})`} 
          pointerEvents="none" 
        />
        {/* Reflejo Lateral */}
        <rect 
          x={framePadding} y={framePadding} 
          width={width - framePadding*2} height={height - framePadding*2} 
          rx={borderRadius - framePadding/2} fill={`url(#sideRef-${uniqueId})`} 
          pointerEvents="none" 
        />
        {/* Brillo de Borde Superior */}
        <rect 
          x={framePadding + 10} y={framePadding + 2} 
          width={width - framePadding*2 - 20} height={height * 0.1} 
          rx={borderRadius} fill={`url(#topShine-${uniqueId})`} 
          pointerEvents="none" 
        />

        {/* 6. Hueco de Cámara (Camera Cutout) */}
        {camera && (
          <g>
            {/* Profundidad del hueco */}
            <rect x={camera.x - 1} y={camera.y - 1} width={camera.width + 2} height={camera.height + 2} rx={camera.rx + 1} fill="#0a0a0a" />
            {/* Fondo del hueco */}
            <rect x={camera.x} y={camera.y} width={camera.width} height={camera.height} rx={camera.rx} fill="#000000" />
            {/* Brillo en el borde del hueco */}
            <rect x={camera.x} y={camera.y} width={camera.width} height={camera.height} rx={camera.rx} fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="0.5" />
          </g>
        )}
      </svg>
    </div>
  );
}