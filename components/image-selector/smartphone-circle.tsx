"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useCallback, useEffect } from "react";

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
  
  // Estados para la transición suave
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
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

  // Manejo de la carga y fade suave
  useEffect(() => {
    if (!caseImage) return;

    setIsVisible(false);
    setIsLoading(true);

    // Simula la precarga de la imagen
    const img = new Image();
    img.src = caseImage;
    img.onload = () => {
      setIsLoading(false);
      // Pequeño timeout para asegurar que el navegador renderice el cambio de estado antes de la transición
      setTimeout(() => setIsVisible(true), 50);
    };
  }, [caseImage]);

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
  }, [enableDrag, caseImage, getMousePosition, offset, isLoading]);

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
  }, [caseImage, isPinching, isDragging, imageScale, imageRotation, handleStart, handleMove, onImageScaleChange, onImageRotationChange, enablePinchZoom, enablePinchRotation, snapToAngle, isLoading]);

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
  const isVertical = normalizedRotation === 0 || normalizedRotation === 180;
  const isHorizontal = normalizedRotation === 90 || normalizedRotation === 270;
  const displayWheel = showRotationWheel || internalShowWheel;

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

          <linearGradient id={`sideRef-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="black" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <rect width={width} height={height} rx={borderRadius} fill={`url(#frameGrad-${uniqueId})`} />
        <rect x="1" y="1" width={width-2} height={height-2} rx={borderRadius-1} fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1" />

        <rect x="-2" y={height * 0.18} width="3" height={width * 0.06} rx="1" fill={frameColor} />
        <rect x="-2" y={height * 0.26} width="3" height={width * 0.12} rx="1" fill={frameColor} />
        <rect x={width-1} y={height * 0.23} width="3" height={width * 0.14} rx="1" fill={frameColor} />

        <rect x={framePadding} y={framePadding} width={width - framePadding*2} height={height - framePadding*2} rx={borderRadius - framePadding/2} fill={frameColor} />

        <g clipPath={`url(#clip-${uniqueId})`}>
          {caseImage && (
            <image
              href={caseImage}
              {...({ crossOrigin: "anonymous" } as any)}
              x={printArea.x + (printArea.width - scaledWidth) / 2 + offset.x}
              y={printArea.y + (printArea.height - scaledHeight) / 2 + offset.y}
              width={scaledWidth}
              height={scaledHeight}
              transform={`rotate(${imageRotation} ${printAreaCenterX} ${printAreaCenterY})`}
              style={{ 
                opacity: isVisible ? 1 : 0,
                transition: isDragging || isPinching ? "none" : "opacity 0.6s ease-in-out",
                willChange: "opacity"
              }}
              preserveAspectRatio="xMidYMid slice"
            />
          )}
        </g>

        <rect x={framePadding} y={framePadding} width={width - framePadding*2} height={height - framePadding*2} rx={borderRadius - framePadding/2} fill={`url(#shine-${uniqueId})`} pointerEvents="none" />
        <rect x={framePadding} y={framePadding} width={width - framePadding*2} height={height - framePadding*2} rx={borderRadius - framePadding/2} fill={`url(#sideRef-${uniqueId})`} pointerEvents="none" />
        <rect x={framePadding + 10} y={framePadding + 2} width={width - framePadding*2 - 20} height={height * 0.1} rx={borderRadius} fill={`url(#topShine-${uniqueId})`} pointerEvents="none" />

        {camera && (
          <g>
            <rect x={camera.x - 1} y={camera.y - 1} width={camera.width + 2} height={camera.height + 2} rx={camera.rx + 1} fill="#0a0a0a" />
            <rect x={camera.x} y={camera.y} width={camera.width} height={camera.height} rx={camera.rx} fill="#000000" />
            <rect x={camera.x} y={camera.y} width={camera.width} height={camera.height} rx={camera.rx} fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="0.5" />
          </g>
        )}

        {/* Simple Loader Overlay */}
        {isLoading && (
          <g transform={`translate(${printAreaCenterX}, ${printAreaCenterY})`}>
             <circle
              r={width * 0.08}
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeDasharray={`${width * 0.1} ${width * 0.1}`}
              className="animate-spin"
              style={{ transformOrigin: 'center', opacity: 0.5 }}
            />
          </g>
        )}

        {displayWheel && caseImage && !isLoading && (
          <g style={{ pointerEvents: 'none' }}>
            {(() => {
              const wheelRadius = Math.min(printArea.width, printArea.height) * 0.38;
              const tickLength = 8;
              const majorTickLength = 14;
              
              return (
                <g transform={`translate(${printAreaCenterX}, ${printAreaCenterY})`}>
                  <circle r={wheelRadius} fill="none" stroke={isSnapped ? "#22c55e" : "rgba(255,255,255,0.3)"} strokeWidth={isSnapped ? 3 : 2} />
                  <circle r={wheelRadius - 20} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                  {Array.from({ length: 24 }, (_, i) => i * 15).map((angle) => {
                    const rad = (angle - 90) * Math.PI / 180;
                    const isMajor = angle % 90 === 0;
                    const len = isMajor ? majorTickLength : tickLength;
                    const x1 = Math.cos(rad) * (wheelRadius - len);
                    const y1 = Math.sin(rad) * (wheelRadius - len);
                    const x2 = Math.cos(rad) * wheelRadius;
                    const y2 = Math.sin(rad) * wheelRadius;
                    const isCurrentSnap = Math.abs(normalizedRotation - angle) <= SNAP_THRESHOLD || (angle === 0 && normalizedRotation >= 360 - SNAP_THRESHOLD);
                    return (
                      <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isCurrentSnap ? "#22c55e" : isMajor ? "white" : "rgba(255,255,255,0.4)"} strokeWidth={isMajor ? 2.5 : 1.5} strokeOpacity={isCurrentSnap ? 1 : isMajor ? 0.9 : 0.6} />
                    );
                  })}
                  {[0, 90, 180, 270].map((angle) => {
                    const rad = (angle - 90) * Math.PI / 180;
                    const x = Math.cos(rad) * (wheelRadius + 18);
                    const y = Math.sin(rad) * (wheelRadius + 18);
                    const isCurrentSnap = Math.abs(normalizedRotation - angle) <= SNAP_THRESHOLD || (angle === 0 && normalizedRotation >= 360 - SNAP_THRESHOLD);
                    return (
                      <text key={angle} x={x} y={y} fill={isCurrentSnap ? "#22c55e" : "white"} fillOpacity={isCurrentSnap ? 1 : 0.7} fontSize={12} fontWeight={isCurrentSnap ? "bold" : "normal"} textAnchor="middle" dominantBaseline="middle">{angle}°</text>
                    );
                  })}
                  {(() => {
                    const currentRad = (normalizedRotation - 90) * Math.PI / 180;
                    const x = Math.cos(currentRad) * (wheelRadius - 5);
                    const y = Math.sin(currentRad) * (wheelRadius - 5);
                    return (
                      <>
                        <line x1={0} y1={0} x2={x} y2={y} stroke="black" strokeWidth={5} strokeLinecap="round" strokeOpacity={0.3} />
                        <line x1={0} y1={0} x2={x} y2={y} stroke={isSnapped ? "#22c55e" : "#f97316"} strokeWidth={3} strokeLinecap="round" />
                        <circle cx={x} cy={y} r={4} fill={isSnapped ? "#22c55e" : "#f97316"} />
                      </>
                    );
                  })()}
                  <circle r={8} fill={isSnapped ? "#22c55e" : "#f97316"} />
                  <circle r={4} fill="white" />
                  <text y={wheelRadius + 45} fill="white" fontSize={18} fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{Math.round(normalizedRotation)}°</text>
                  {isSnapped && (
                    <text y={wheelRadius + 62} fill="#22c55e" fontSize={12} fontWeight="600" textAnchor="middle" dominantBaseline="middle">{isVertical ? "Vertical" : isHorizontal ? "Horizontal" : ""}</text>
                  )}
                </g>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
}