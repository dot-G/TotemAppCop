"use client"

import { cn } from "@/lib/utils"
import { useState, useRef, useCallback, useEffect } from "react"

// Camera cutout styles based on the reference image
export type CameraCutoutStyle = 
  | "horizontal-top"      // Rectangular horizontal at top (wide)
  | "square-left"         // Small square top left
  | "vertical-pill"       // Vertical pill/capsule shape centered
  | "pill-left"           // Vertical pill on the left side
  | "circle-large"        // Large circle
  | "circle-small"        // Small circle top left corner
  | "square-center"       // Large square center top
  | "rectangular-left"    // Rectangular top left (taller than square)

interface SmartphoneCaseSimpleProps {
  frameColor?: string
  caseImage?: string
  className?: string
  width?: number
  cameraCutout?: CameraCutoutStyle
  glowIntensity?: number
  imageOffset?: { x: number; y: number }
  imageScale?: number
  imageRotation?: number
  onImageOffsetChange?: (offset: { x: number; y: number }) => void
  onImageScaleChange?: (scale: number) => void
  onImageRotationChange?: (rotation: number) => void
  enableDrag?: boolean
  enablePinchZoom?: boolean
  enablePinchRotation?: boolean
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
  const [internalOffset, setInternalOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isPinching, setIsPinching] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const offsetStartRef = useRef({ x: 0, y: 0 })
  const pinchStartDistanceRef = useRef(0)
  const pinchStartScaleRef = useRef(1)
  const pinchStartAngleRef = useRef(0)
  const pinchStartRotationRef = useRef(0)
  const svgRef = useRef<SVGSVGElement>(null)

  const offset = externalOffset ?? internalOffset
  const setOffset = onImageOffsetChange ?? setInternalOffset

  const height = width * 1.85
  const borderRadius = width * 0.12
  const framePadding = width * 0.025

  // Camera cutout dimensions based on style - all centered horizontally where appropriate
  const getCameraCutout = () => {
    const topMargin = width * 0.08
    
    switch (cameraCutout) {
      case "horizontal-top": {
        // Horizontal rectangle centered at top - wider
        const cutWidth = width * 0.82
        const cutHeight = width * 0.22
        return {
          x: (width - cutWidth) / 2,
          y: topMargin,
          width: cutWidth,
          height: cutHeight,
          rx: width * 0.055,
        }
      }
      case "square-left":
        // Square top left
        return {
          x: width * 0.06,
          y: topMargin,
          width: width * 0.385,
          height: width * 0.385,
          rx: width * 0.066,
        }
      case "vertical-pill": {
        // Vertical pill centered - thinner
        const cutWidth = width * 0.176
        const cutHeight = width * 0.605
        return {
          x: (width - cutWidth) / 2,
          y: topMargin,
          width: cutWidth,
          height: cutHeight,
          rx: width * 0.088,
        }
      }
      case "pill-left": {
        // Vertical pill on the left side
        const cutWidth = width * 0.176
        const cutHeight = width * 0.605
        return {
          x: width * 0.06,
          y: topMargin,
          width: cutWidth,
          height: cutHeight,
          rx: width * 0.088,
        }
      }
      case "circle-large": {
        // Large circle centered - bigger
        const cutSize = width * 0.55
        return {
          x: (width - cutSize) / 2,
          y: topMargin,
          width: cutSize,
          height: cutSize,
          rx: cutSize / 2,
        }
      }
      case "circle-small":
        // Small circle top left corner
        return {
          x: width * 0.06,
          y: topMargin,
          width: width * 0.275,
          height: width * 0.275,
          rx: width * 0.1375,
        }
      case "square-center": {
        // Large square centered
        const cutSize = width * 0.45
        return {
          x: (width - cutSize) / 2,
          y: topMargin,
          width: cutSize,
          height: cutSize,
          rx: width * 0.06,
        }
      }
      case "rectangular-left":
        // Rectangular top left (taller than square)
        return {
          x: width * 0.06,
          y: topMargin,
          width: width * 0.385,
          height: width * 0.52,
          rx: width * 0.066,
        }
      default:
        return null
    }
  }

  const camera = getCameraCutout()

  // Camera zone with safety margin
  const cameraZone = camera ? {
    x: camera.x - width * 0.02,
    y: camera.y - width * 0.02,
    width: camera.width + width * 0.04,
    height: camera.height + width * 0.04,
  } : null

  // Image area starts below the camera cutout
  const imageAreaTop = camera 
    ? camera.y + camera.height + width * 0.04 // Start below camera with some margin
    : framePadding

  // Printable area for the image - below the camera
  const printArea = {
    x: framePadding,
    y: imageAreaTop,
    width: width - framePadding * 2,
    height: height - imageAreaTop - framePadding,
  }

  // Border radius for printable area (matches phone frame)
  const printAreaRadius = borderRadius - framePadding / 2

  const uniqueId = `case-simple-${Math.random().toString(36).substr(2, 9)}`

  // Drag handlers
  const getMousePosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }

    const rect = svg.getBoundingClientRect()
    const scaleX = width / rect.width
    const scaleY = height / rect.height

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [width, height])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!enableDrag || !caseImage) return

    if ('touches' in e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setIsDragging(true)
    const pos = getMousePosition(e)
    dragStartRef.current = pos
    offsetStartRef.current = offset
  }, [enableDrag, caseImage, getMousePosition, offset])

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return

    if ('touches' in e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const pos = getMousePosition(e)
    const dx = pos.x - dragStartRef.current.x
    const dy = pos.y - dragStartRef.current.y

    const normalizedRotation = ((imageRotation % 360) + 360) % 360
    const rad = (normalizedRotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const adjustedDx = dx * cos + dy * sin
    const adjustedDy = -dx * sin + dy * cos

    setOffset({
      x: offsetStartRef.current.x + adjustedDx,
      y: offsetStartRef.current.y + adjustedDy,
    })
  }, [isDragging, getMousePosition, setOffset, imageRotation])

  const handleDragEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      e.preventDefault()
    }
    setIsDragging(false)
    setIsPinching(false)
  }, [])

  // Pinch zoom and rotation helpers
  const getDistanceBetweenTouches = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getAngleBetweenTouches = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const dx = touches[1].clientX - touches[0].clientX
    const dy = touches[1].clientY - touches[0].clientY
    return Math.atan2(dy, dx) * (180 / Math.PI)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!caseImage) return

    e.preventDefault()
    e.stopPropagation()

    if (e.touches.length === 2 && (enablePinchZoom || enablePinchRotation)) {
      setIsPinching(true)
      setIsDragging(false)
      pinchStartDistanceRef.current = getDistanceBetweenTouches(e.touches)
      pinchStartScaleRef.current = imageScale
      pinchStartAngleRef.current = getAngleBetweenTouches(e.touches)
      pinchStartRotationRef.current = imageRotation
      return
    }

    if (e.touches.length === 1 && enableDrag) {
      setIsDragging(true)
      const pos = getMousePosition(e)
      dragStartRef.current = pos
      offsetStartRef.current = offset
    }
  }, [caseImage, enableDrag, enablePinchZoom, enablePinchRotation, getMousePosition, offset, imageScale, imageRotation, getDistanceBetweenTouches, getAngleBetweenTouches])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
  if (!caseImage) return;

  e.preventDefault();
  e.stopPropagation();

  if (isPinching && e.touches.length === 2) {
    // 1. Manejo de Pinch Zoom
    if (enablePinchZoom && onImageScaleChange) {
      const currentDistance = getDistanceBetweenTouches(e.touches);
      const scaleFactor = currentDistance / pinchStartDistanceRef.current;
      const newScale = Math.min(4, Math.max(0.5, pinchStartScaleRef.current * scaleFactor));
      onImageScaleChange(newScale);
    }
    
    // 2. Manejo de Rotación con corrección de "Rebote"
    if (enablePinchRotation && onImageRotationChange) {
      const currentAngle = getAngleBetweenTouches(e.touches);
      
      // Calculamos la diferencia de ángulo entre el frame actual y el inicio del toque
      let angleDiff = currentAngle - pinchStartAngleRef.current;

      // --- LÓGICA ANTI-REBOTE ---
      // Si el salto es mayor a 180 grados, detectamos que cruzó la frontera de Atan2
      // y corregimos la diferencia para que el giro sea continuo.
      if (angleDiff > 180) {
        angleDiff -= 360;
      } else if (angleDiff < -180) {
        angleDiff += 360;
      }

      // Sumamos la diferencia corregida a la rotación que ya tenía la imagen
      let newRotation = pinchStartRotationRef.current + angleDiff;

      // --- NORMALIZACIÓN (0 a 360) ---
      // Esto asegura que el valor siempre sea positivo y no crezca hasta el infinito
      newRotation = ((newRotation % 360) + 360) % 360;

      onImageRotationChange(newRotation);
    }
    return;
  }

  // 3. Manejo de Drag (Movimiento)
  if (isDragging && e.touches.length === 1) {
    const pos = getMousePosition(e);
    const dx = pos.x - dragStartRef.current.x;
    const dy = pos.y - dragStartRef.current.y;

    const normalizedRotation = ((imageRotation % 360) + 360) % 360;
    const rad = (normalizedRotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const adjustedDx = dx * cos + dy * sin;
    const adjustedDy = -dx * sin + dy * cos;

    setOffset({
      x: offsetStartRef.current.x + adjustedDx,
      y: offsetStartRef.current.y + adjustedDy,
    });
  }
}, [
  caseImage, 
  isPinching, 
  isDragging, 
  enablePinchZoom, 
  enablePinchRotation, 
  onImageScaleChange, 
  onImageRotationChange, 
  getDistanceBetweenTouches, 
  getAngleBetweenTouches, 
  getMousePosition, 
  setOffset, 
  imageRotation
]);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 0) {
      setIsDragging(false)
      setIsPinching(false)
    } else if (e.touches.length === 1) {
      setIsPinching(false)
      if (enableDrag) {
        setIsDragging(true)
        const touch = e.touches[0]
        const svg = svgRef.current
        if (svg) {
          const rect = svg.getBoundingClientRect()
          const scaleX = width / rect.width
          const scaleY = height / rect.height
          dragStartRef.current = {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY,
          }
          offsetStartRef.current = offset
        }
      }
    }
  }, [enableDrag, width, height, offset])

  // Add non-passive touch event listeners
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !caseImage) return

    const preventScroll = (e: TouchEvent) => {
      if (isDragging || isPinching) {
        e.preventDefault()
      }
    }

    svg.addEventListener('touchmove', preventScroll, { passive: false })
    svg.addEventListener('touchstart', preventScroll, { passive: false })

    return () => {
      svg.removeEventListener('touchmove', preventScroll)
      svg.removeEventListener('touchstart', preventScroll)
    }
  }, [caseImage, isDragging, isPinching])

  // Image dimensions
  const baseImageWidth = printArea.width * 1.2
  const baseImageHeight = printArea.height

  const scaledImageWidth = baseImageWidth * imageScale
  const scaledImageHeight = baseImageHeight * imageScale

  const imageX = printArea.x + (printArea.width - scaledImageWidth) / 2 + offset.x
  const imageY = printArea.y + (printArea.height - scaledImageHeight) / 2 + offset.y

  const printAreaCenterX = printArea.x + printArea.width / 2
  const printAreaCenterY = printArea.y + printArea.height / 2

  // Generate clip path for image area only (rectangular area below camera)
  const generateImageClipPath = () => {
    // Simple rectangular clip for the image area below the camera
    const imgAreaRadius = Math.min(printAreaRadius, (printArea.height) / 4)
    
    return `
      M ${printArea.x} ${printArea.y}
      H ${printArea.x + printArea.width}
      V ${printArea.y + printArea.height - imgAreaRadius}
      A ${imgAreaRadius} ${imgAreaRadius} 0 0 1 ${printArea.x + printArea.width - imgAreaRadius} ${printArea.y + printArea.height}
      H ${printArea.x + imgAreaRadius}
      A ${imgAreaRadius} ${imgAreaRadius} 0 0 1 ${printArea.x} ${printArea.y + printArea.height - imgAreaRadius}
      Z
    `
  }

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Glow effect */}
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
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: enableDrag && caseImage ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: enableDrag && caseImage ? 'none' : 'auto',
        }}
      >
        <defs>
          {/* Frame gradient with enhanced shine */}
          <linearGradient id={`frameGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={frameColor} stopOpacity="1" />
            <stop offset="25%" stopColor={frameColor} stopOpacity="0.95" />
            <stop offset="50%" stopColor={frameColor} stopOpacity="0.85" />
            <stop offset="75%" stopColor={frameColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={frameColor} stopOpacity="0.75" />
          </linearGradient>

          {/* Enhanced shine highlight */}
          <linearGradient id={`shine-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="30%" stopColor="white" stopOpacity="0.1" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="70%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0.15" />
          </linearGradient>

          {/* Top edge shine */}
          <linearGradient id={`topShine-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="20%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Side reflection */}
          <linearGradient id={`sideReflection-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.2" />
            <stop offset="10%" stopColor="white" stopOpacity="0.05" />
            <stop offset="90%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.1" />
          </linearGradient>

          {/* Camera hole inner shadow */}
          <radialGradient id={`holeShadow-${uniqueId}`} cx="50%" cy="50%">
            <stop offset="70%" stopColor="#000000" stopOpacity="1" />
            <stop offset="85%" stopColor="#1a1a1a" stopOpacity="1" />
            <stop offset="100%" stopColor="#2a2a2a" stopOpacity="1" />
          </radialGradient>

          {/* Clip for image area (below camera) */}
          <clipPath id={`printAreaClip-${uniqueId}`}>
            <path d={generateImageClipPath()} />
          </clipPath>
        </defs>

        {/* Phone frame outer */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx={borderRadius}
          fill={`url(#frameGrad-${uniqueId})`}
        />

        {/* Frame edge highlight */}
        <rect
          x="1"
          y="1"
          width={width - 2}
          height={height - 2}
          rx={borderRadius - 1}
          fill="none"
          stroke="white"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* Side buttons */}
        <rect x="-2.5" y={height * 0.18} width="2.5" height={width * 0.06} rx="1" fill={frameColor} />
        <rect x="-2.5" y={height * 0.26} width="2.5" height={width * 0.12} rx="1" fill={frameColor} />
        <rect x="-2.5" y={height * 0.33} width="2.5" height={width * 0.12} rx="1" fill={frameColor} />
        <rect x={width} y={height * 0.23} width="2.5" height={width * 0.14} rx="1" fill={frameColor} />

        {/* Back case surface */}
        <rect
          x={framePadding}
          y={framePadding}
          width={width - framePadding * 2}
          height={height - framePadding * 2}
          rx={borderRadius - framePadding / 2}
          fill={frameColor}
        />



        {/* Printable image area */}
        <g clipPath={`url(#printAreaClip-${uniqueId})`}>
          {caseImage && (
            <g
              style={{
                transition: 'transform 0.3s ease-out',
              }}
              transform={`rotate(${imageRotation} ${printAreaCenterX} ${printAreaCenterY})`}
            >
              <image
                href={caseImage}
                x={imageX}
                y={imageY}
                width={scaledImageWidth}
                height={scaledImageHeight}
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
          )}
        </g>

        {/* Enhanced shine overlay on the case */}
        <rect
          x={framePadding}
          y={framePadding}
          width={width - framePadding * 2}
          height={height - framePadding * 2}
          rx={borderRadius - framePadding / 2}
          fill={`url(#shine-${uniqueId})`}
          style={{ pointerEvents: 'none' }}
        />

        {/* Top edge shine */}
        <rect
          x={framePadding + 10}
          y={framePadding + 2}
          width={width - framePadding * 2 - 20}
          height={height * 0.15}
          rx={borderRadius - framePadding / 2}
          fill={`url(#topShine-${uniqueId})`}
          style={{ pointerEvents: 'none' }}
        />

        {/* Side reflection line */}
        <rect
          x={framePadding}
          y={framePadding}
          width={width - framePadding * 2}
          height={height - framePadding * 2}
          rx={borderRadius - framePadding / 2}
          fill={`url(#sideReflection-${uniqueId})`}
          style={{ pointerEvents: 'none' }}
        />

        {/* Camera cutout hole */}
        {camera && (
          <>
            {/* Outer dark ring for depth */}
            <rect
              x={camera.x - 2}
              y={camera.y - 2}
              width={camera.width + 4}
              height={camera.height + 4}
              rx={camera.rx + 1}
              fill="#0a0a0a"
            />
            {/* Inner hole - pure black */}
            <rect
              x={camera.x}
              y={camera.y}
              width={camera.width}
              height={camera.height}
              rx={camera.rx}
              fill="#000000"
            />
            {/* Subtle inner edge highlight */}
            <rect
              x={camera.x + 1}
              y={camera.y + 1}
              width={camera.width - 2}
              height={camera.height - 2}
              rx={camera.rx - 1}
              fill="none"
              stroke="white"
              strokeOpacity="0.05"
              strokeWidth="0.5"
            />
          </>
        )}

      </svg>
    </div>
  )
}
