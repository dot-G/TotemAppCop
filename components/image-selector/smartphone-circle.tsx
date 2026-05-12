"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";

export type CameraCutoutStyle = 
  | "horizontal-top" | "square-left" | "vertical-pill" 
  | "pill-left" | "circle-large" | "circle-small" 
  | "square-center" | "rectangular-left";

interface SmartphoneCircleProps {
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
  showRotationWheel?: boolean;
}

const SNAP_ANGLES = [0, 90, 180, 270, 360];
const SNAP_THRESHOLD = 8;

export function SmartphoneCircle({
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
  showRotationWheel = false,
}: SmartphoneCircleProps) {
  const [internalOffset, setInternalOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [internalShowWheel, setInternalShowWheel] = useState(false);
  
  // --- Lógica Anti-Parpadeo Síncrona ---
  const [isLoading, setIsLoading] = useState(false);
  const [lastImage, setLastImage] = useState<string | undefined>(caseImage);

  // Si la prop caseImage cambió, activamos loading ANTES de renderizar el siguiente frame
  if (caseImage !== lastImage) {
    setLastImage(caseImage);
    setIsLoading(true);
  }

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });
  const pinchStartDistanceRef = useRef(0);
  const pinchStartScaleRef = useRef(1);
  const pinchStartAngleRef = useRef(0);
  const pinchStartRotationRef = useRef(0);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const offset = externalOffset ?? internalOffset;
  const setOffset = onImageOffsetChange ?? setInternalOffset;

  const handleImageLoad = () => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    // Un pequeño delay (300ms) asegura que el navegador haya decodificado bien el PNG
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const snapToAngle = useCallback((angle: number): number => {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    for (const snapAngle of SNAP_ANGLES) {
      const diff = Math.abs(normalizedAngle - snapAngle);
      if (diff <= SNAP_THRESHOLD || diff >= 360 - SNAP_THRESHOLD) {
        return snapAngle === 360 ? 0 : snapAngle;
      }
    }
    return angle;
  }, []);

  const isNearSnapAngle = useCallback((angle: number): boolean => {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    for (const snapAngle of SNAP_ANGLES) {
      const diff = Math.abs(normalizedAngle - snapAngle);
      if (diff <= SNAP_THRESHOLD || diff >= 360 - SNAP_THRESHOLD) {
        return true;
      }
    }
    return false;
  }, []);

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
    if (!enableDrag || !caseImage || isLoading) return;
    setIsDragging(true);
    const pos = getMousePosition(clientX, clientY);
    dragStartRef.current = pos;
    offsetStartRef.current = offset;
  }, [enableDrag, caseImage, isLoading, getMousePosition, offset]);

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

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onTouchStart = (e: TouchEvent) => {
      if (!caseImage || isLoading) return;
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
      if (!caseImage || isLoading) return;
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
          const newRotation = pinchStartRotationRef.current + (angle - pinchStartAngleRef.current);
          setInternalShowWheel(true);
          if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
          const snappedRotation = snapToAngle(newRotation);
          onImageRotationChange(snappedRotation);
        }
      } else if (isDragging) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => { 
      setIsDragging(false); 
      setIsPinching(false);
      wheelTimeoutRef.current = setTimeout(() => {
        setInternalShowWheel(false);
      }, 800);
    };

    svg.addEventListener("touchstart", onTouchStart, { passive: false });
    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    svg.addEventListener("touchend", onTouchEnd);
    return () => {
      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onTouchEnd);
    };
  }, [caseImage, isLoading, isPinching, isDragging, imageScale, imageRotation, handleStart, handleMove, onImageScaleChange, onImageRotationChange, enablePinchZoom, enablePinchRotation, snapToAngle]);

  const getCameraCutout = () => {
    const tm = width * 0.08;
    const styles: Record<string, { x: number; y: number; width: number; height: number; rx: number }> = {
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
  const printAreaCenterX = printArea.x + printArea.width / 2;
  const printAreaCenterY = printArea.y + printArea.height / 2;

  const scaledWidth = printArea.width * 1.2 * imageScale;
  const scaledHeight = printArea.height * imageScale;
  const uniqueId = useRef(Math.random().toString(36).substr(2, 9)).current;

  const normalizedRotation = ((imageRotation % 360) + 360) % 360;
  const isSnapped = isNearSnapAngle(imageRotation);
  const displayWheel = (showRotationWheel || internalShowWheel) && !isLoading;

  return (
    <div className={cn("relative inline-block select-none touch-none", className)}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <defs>
          <clipPath id={`clip-${uniqueId}`}>
            <rect x={printArea.x} y={printArea.y} width={printArea.width} height={printArea.height} rx={borderRadius * 0.5} />
          </clipPath>
          <linearGradient id={`frameGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={frameColor} stopOpacity="1" />
            <stop offset="50%" stopColor={frameColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={frameColor} stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id={`shine-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id={`topShine-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Estructura del teléfono */}
        <rect width={width} height={height} rx={borderRadius} fill={`url(#frameGrad-${uniqueId})`} />
        <rect x={framePadding} y={framePadding} width={width - framePadding*2} height={height - framePadding*2} rx={borderRadius - framePadding/2} fill={frameColor} />

        {/* Área de Imagen */}
        <g clipPath={`url(#clip-${uniqueId})`}>
          {caseImage && (
            <image
              key={caseImage} // Forzar reset de elemento al cambiar URL
              href={caseImage}
              {...({ crossOrigin: "anonymous" } as any)}
              x={printArea.x + (printArea.width - scaledWidth) / 2 + offset.x}
              y={printArea.y + (printArea.height - scaledHeight) / 2 + offset.y}
              width={scaledWidth}
              height={scaledHeight}
              onLoad={handleImageLoad}
              opacity={isLoading ? 0 : 1}
              transform={`rotate(${imageRotation} ${printAreaCenterX} ${printAreaCenterY})`}
              style={{ 
                transition: isDragging || isPinching ? "none" : "opacity 0.3s ease-in-out",
                willChange: "opacity, transform"
              }}
              preserveAspectRatio="xMidYMid slice"
            />
          )}
        </g>

        {/* Brillo realista sobre la carcasa e imagen */}
        <rect x={framePadding} y={framePadding} width={width - framePadding*2} height={height - framePadding*2} rx={borderRadius - framePadding/2} fill={`url(#shine-${uniqueId})`} pointerEvents="none" />
        <rect x={framePadding + 10} y={framePadding + 2} width={width - framePadding*2 - 20} height={height * 0.1} rx={borderRadius} fill={`url(#topShine-${uniqueId})`} pointerEvents="none" />

        {/* Módulo de Cámara */}
        {camera && (
          <g>
            <rect x={camera.x - 1} y={camera.y - 1} width={camera.width + 2} height={camera.height + 2} rx={camera.rx + 1} fill="#0a0a0a" />
            <rect x={camera.x} y={camera.y} width={camera.width} height={camera.height} rx={camera.rx} fill="#000000" />
          </g>
        )}

        {/* Spinner (solo visible mientras carga la nueva imagen) */}
        {isLoading && caseImage && (
          <g transform={`translate(${printAreaCenterX}, ${printAreaCenterY})`}>
            <circle r="20" fill="rgba(0,0,0,0.3)" />
            <foreignObject x="-12" y="-12" width="24" height="24">
              <Loader2 className="w-6 h-6 text-white/70 animate-spin" />
            </foreignObject>
          </g>
        )}

        {/* Rueda de Rotación */}
        {displayWheel && caseImage && (
          <g transform={`translate(${printAreaCenterX}, ${printAreaCenterY})`} style={{ pointerEvents: 'none' }}>
            <circle r={Math.min(printArea.width, printArea.height) * 0.38} fill="none" stroke={isSnapped ? "#22c55e" : "rgba(255,255,255,0.3)"} strokeWidth={isSnapped ? 3 : 2} />
            <text y={Math.min(printArea.width, printArea.height) * 0.38 + 40} fill="white" fontSize={18} fontWeight="bold" textAnchor="middle">{Math.round(normalizedRotation)}°</text>
          </g>
        )}
      </svg>
    </div>
  );
}