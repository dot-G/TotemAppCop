"use client"

import { cn } from "@/lib/utils"
import { useState, useRef, useCallback, useEffect } from "react"

interface SmartphoneBackCaseProps {
  frameColor?: string
  caseImage?: string
  className?: string
  width?: number
  showPrintArea?: boolean
  cameraStyle?: "island" | "vertical" | "square"
  glowIntensity?: number
  imageOffset?: { x: number; y: number }
  imageScale?: number
  imageRotation?: number
  onImageOffsetChange?: (offset: { x: number; y: number }) => void
  onImageScaleChange?: (scale: number) => void
  enableDrag?: boolean
  enablePinchZoom?: boolean
}

export function SmartphoneBackCase({
  frameColor = "#1a1a1a",
  caseImage,
  className,
  width = 280,
  showPrintArea = true,
  cameraStyle = "island",
  glowIntensity = 0.3,
  imageOffset: externalOffset,
  imageScale = 1,
  imageRotation = 0,
  onImageOffsetChange,
  onImageScaleChange,
  enableDrag = true,
  enablePinchZoom = true,
}: SmartphoneBackCaseProps) {
  const [internalOffset, setInternalOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isPinching, setIsPinching] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const offsetStartRef = useRef({ x: 0, y: 0 })
  const pinchStartDistanceRef = useRef(0)
  const pinchStartScaleRef = useRef(1)
  const svgRef = useRef<SVGSVGElement>(null)

  const offset = externalOffset ?? internalOffset
  const setOffset = onImageOffsetChange ?? setInternalOffset

  const height = width * 2.1
  const borderRadius = width * 0.12
  const framePadding = width * 0.025

  // Camera module dimensions based on style
  const getCameraModule = () => {
    switch (cameraStyle) {
      case "island":
        return {
          x: width * 0.06,
          y: width * 0.06,
          width: width * 0.32,
          height: width * 0.32,
          rx: width * 0.06,
          lenses: [
            { cx: width * 0.13, cy: width * 0.13, r: width * 0.055 },
            { cx: width * 0.28, cy: width * 0.13, r: width * 0.055 },
            { cx: width * 0.13, cy: width * 0.28, r: width * 0.055 },
          ],
          flash: { cx: width * 0.28, cy: width * 0.28, r: width * 0.025 },
        }
      case "vertical":
        return {
          x: width * 0.06,
          y: width * 0.06,
          width: width * 0.18,
          height: width * 0.55,
          rx: width * 0.09,
          lenses: [
            { cx: width * 0.15, cy: width * 0.14, r: width * 0.05 },
            { cx: width * 0.15, cy: width * 0.29, r: width * 0.05 },
            { cx: width * 0.15, cy: width * 0.44, r: width * 0.05 },
          ],
          flash: { cx: width * 0.15, cy: width * 0.55, r: width * 0.02 },
        }
      case "square":
        return {
          x: width * 0.06,
          y: width * 0.06,
          width: width * 0.28,
          height: width * 0.28,
          rx: width * 0.04,
          lenses: [
            { cx: width * 0.13, cy: width * 0.13, r: width * 0.045 },
            { cx: width * 0.26, cy: width * 0.13, r: width * 0.045 },
            { cx: width * 0.13, cy: width * 0.26, r: width * 0.045 },
          ],
          flash: { cx: width * 0.26, cy: width * 0.26, r: width * 0.02 },
        }
    }
  }

  const camera = getCameraModule()
  
  // Camera zone with safety margin
  const cameraZone = {
    x: camera.x - width * 0.02,
    y: camera.y - width * 0.02,
    width: camera.width + width * 0.04,
    height: camera.height + width * 0.04,
  }

  // Printable area starts below camera zone
  const printArea = {
    x: framePadding,
    y: cameraZone.y + cameraZone.height + width * 0.04,
    width: width - framePadding * 2,
    height: height - framePadding - (cameraZone.y + cameraZone.height + width * 0.04),
  }

  // Bottom border radius for printable area (matches phone frame bottom)
  const printAreaBottomRadius = borderRadius - framePadding / 2

  const uniqueId = `case-${Math.random().toString(36).substr(2, 9)}`

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
    
    // Prevent default to stop page scrolling on mobile
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
    
    // Prevent default to stop page scrolling on mobile
    if ('touches' in e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    const pos = getMousePosition(e)
    const dx = pos.x - dragStartRef.current.x
    const dy = pos.y - dragStartRef.current.y
    
    // Adjust drag direction based on rotation (normalize to 0-360)
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

  // Pinch zoom helpers
  const getDistanceBetweenTouches = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!caseImage) return
    
    e.preventDefault()
    e.stopPropagation()

    // Pinch zoom with 2 fingers
    if (e.touches.length === 2 && enablePinchZoom) {
      setIsPinching(true)
      setIsDragging(false)
      pinchStartDistanceRef.current = getDistanceBetweenTouches(e.touches)
      pinchStartScaleRef.current = imageScale
      return
    }

    // Single finger drag
    if (e.touches.length === 1 && enableDrag) {
      setIsDragging(true)
      const pos = getMousePosition(e)
      dragStartRef.current = pos
      offsetStartRef.current = offset
    }
  }, [caseImage, enableDrag, enablePinchZoom, getMousePosition, offset, imageScale, getDistanceBetweenTouches])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!caseImage) return
    
    e.preventDefault()
    e.stopPropagation()

    // Pinch zoom
    if (isPinching && e.touches.length === 2 && enablePinchZoom && onImageScaleChange) {
      const currentDistance = getDistanceBetweenTouches(e.touches)
      const scaleFactor = currentDistance / pinchStartDistanceRef.current
      const newScale = Math.min(4, Math.max(0.5, pinchStartScaleRef.current * scaleFactor))
      onImageScaleChange(newScale)
      return
    }

    // Single finger drag
    if (isDragging && e.touches.length === 1) {
      const pos = getMousePosition(e)
      const dx = pos.x - dragStartRef.current.x
      const dy = pos.y - dragStartRef.current.y
      
      // Adjust drag direction based on rotation (normalize to 0-360)
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
    }
  }, [caseImage, isPinching, isDragging, enablePinchZoom, onImageScaleChange, getDistanceBetweenTouches, getMousePosition, setOffset, imageRotation])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 0) {
      setIsDragging(false)
      setIsPinching(false)
    } else if (e.touches.length === 1) {
      // Transitioned from pinch to drag
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

  // Add non-passive touch event listeners to prevent page scroll
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

  // Image dimensions - simple, fit to height
  const baseImageWidth = printArea.width * 1.5
  const baseImageHeight = printArea.height
  
  const scaledImageWidth = baseImageWidth * imageScale
  const scaledImageHeight = baseImageHeight * imageScale
  
  // Center the image in the print area
  const imageX = printArea.x + (printArea.width - scaledImageWidth) / 2 + offset.x
  const imageY = printArea.y + (printArea.height - scaledImageHeight) / 2 + offset.y
  
  // Center point for rotation (center of the print area, not the image)
  const printAreaCenterX = printArea.x + printArea.width / 2
  const printAreaCenterY = printArea.y + printArea.height / 2

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
          {/* Frame gradient */}
          <linearGradient id={`frameGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={frameColor} stopOpacity="1" />
            <stop offset="50%" stopColor={frameColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={frameColor} stopOpacity="0.7" />
          </linearGradient>

          {/* Frame highlight */}
          <linearGradient id={`frameHighlight-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.25" />
            <stop offset="40%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Camera module gradient */}
          <linearGradient id={`cameraGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </linearGradient>

          {/* Lens gradient for 3D effect */}
          <radialGradient id={`lensGrad-${uniqueId}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor="#4a4a5a" />
            <stop offset="50%" stopColor="#1a1a2a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>

          {/* Lens ring */}
          <radialGradient id={`lensRing-${uniqueId}`} cx="50%" cy="50%">
            <stop offset="70%" stopColor="#3a3a4a" />
            <stop offset="85%" stopColor="#5a5a6a" />
            <stop offset="100%" stopColor="#2a2a3a" />
          </radialGradient>

          {/* Clip for printable area - rounded corners only at bottom */}
          <clipPath id={`printAreaClip-${uniqueId}`}>
            <path
              d={`
                M ${printArea.x} ${printArea.y}
                L ${printArea.x + printArea.width} ${printArea.y}
                L ${printArea.x + printArea.width} ${printArea.y + printArea.height - printAreaBottomRadius}
                A ${printAreaBottomRadius} ${printAreaBottomRadius} 0 0 1 ${printArea.x + printArea.width - printAreaBottomRadius} ${printArea.y + printArea.height}
                L ${printArea.x + printAreaBottomRadius} ${printArea.y + printArea.height}
                A ${printAreaBottomRadius} ${printAreaBottomRadius} 0 0 1 ${printArea.x} ${printArea.y + printArea.height - printAreaBottomRadius}
                Z
              `}
            />
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
          strokeOpacity="0.15"
          strokeWidth="1"
        />

        {/* Side buttons */}
        <rect x="-2.5" y={height * 0.18} width="2.5" height={width * 0.06} rx="1" fill={frameColor} />
        <rect x="-2.5" y={height * 0.26} width="2.5" height={width * 0.12} rx="1" fill={frameColor} />
        <rect x="-2.5" y={height * 0.33} width="2.5" height={width * 0.12} rx="1" fill={frameColor} />
        <rect x={width} y={height * 0.23} width="2.5" height={width * 0.14} rx="1" fill={frameColor} />

        {/* Back case surface - same color as frame */}
        <rect
          x={framePadding}
          y={framePadding}
          width={width - framePadding * 2}
          height={height - framePadding * 2}
          rx={borderRadius - framePadding / 2}
          fill={frameColor}
        />

        {/* Printable area background - same color as frame, with rounded bottom corners */}
        <path
          d={`
            M ${printArea.x} ${printArea.y}
            L ${printArea.x + printArea.width} ${printArea.y}
            L ${printArea.x + printArea.width} ${printArea.y + printArea.height - printAreaBottomRadius}
            A ${printAreaBottomRadius} ${printAreaBottomRadius} 0 0 1 ${printArea.x + printArea.width - printAreaBottomRadius} ${printArea.y + printArea.height}
            L ${printArea.x + printAreaBottomRadius} ${printArea.y + printArea.height}
            A ${printAreaBottomRadius} ${printAreaBottomRadius} 0 0 1 ${printArea.x} ${printArea.y + printArea.height - printAreaBottomRadius}
            Z
          `}
          fill={frameColor}
        />

        {/* Printable image area - positioned below camera, rectangular */}
        <g clipPath={`url(#printAreaClip-${uniqueId})`}>
          {/* Custom image - draggable, scalable and rotatable with smooth animation */}
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

        {/* Print area indicator (dashed border) */}
        {showPrintArea && (
          <g opacity="0.6">
            {/* Printable area boundary - rounded only at bottom */}
            <path
              d={`
                M ${printArea.x + 2} ${printArea.y + 2}
                L ${printArea.x + printArea.width - 2} ${printArea.y + 2}
                L ${printArea.x + printArea.width - 2} ${printArea.y + printArea.height - printAreaBottomRadius}
                A ${printAreaBottomRadius - 2} ${printAreaBottomRadius - 2} 0 0 1 ${printArea.x + printArea.width - printAreaBottomRadius} ${printArea.y + printArea.height - 2}
                L ${printArea.x + printAreaBottomRadius} ${printArea.y + printArea.height - 2}
                A ${printAreaBottomRadius - 2} ${printAreaBottomRadius - 2} 0 0 1 ${printArea.x + 2} ${printArea.y + printArea.height - printAreaBottomRadius}
                Z
              `}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            
            {/* Camera zone indicator */}
            <rect
              x={cameraZone.x}
              y={cameraZone.y}
              width={cameraZone.width}
              height={cameraZone.height}
              rx={camera.rx + width * 0.01}
              fill="rgba(239, 68, 68, 0.08)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            
            {/* Zone labels */}
            <text
              x={printArea.x + printArea.width / 2}
              y={printArea.y + printArea.height - 8}
              fontSize={width * 0.028}
              fill="#3b82f6"
              textAnchor="middle"
              fontFamily="system-ui"
            >
              Area imprimible
            </text>
            <text
              x={cameraZone.x + cameraZone.width / 2}
              y={cameraZone.y + cameraZone.height + width * 0.04}
              fontSize={width * 0.022}
              fill="#ef4444"
              textAnchor="middle"
              fontFamily="system-ui"
            >
              Camara
            </text>
            
            {/* Drag hint */}
            {enableDrag && caseImage && (
              <text
                x={printArea.x + printArea.width / 2}
                y={printArea.y + 20}
                fontSize={width * 0.025}
                fill="#3b82f6"
                textAnchor="middle"
                fontFamily="system-ui"
              >
                Arrastra para mover la imagen
              </text>
            )}
          </g>
        )}

        {/* Camera module base */}
        <rect
          x={camera.x}
          y={camera.y}
          width={camera.width}
          height={camera.height}
          rx={camera.rx}
          fill={`url(#cameraGrad-${uniqueId})`}
        />

        {/* Camera module highlight */}
        <rect
          x={camera.x + 1}
          y={camera.y + 1}
          width={camera.width - 2}
          height={camera.height - 2}
          rx={camera.rx - 1}
          fill="none"
          stroke="white"
          strokeOpacity="0.1"
          strokeWidth="1"
        />

        {/* Camera lenses */}
        {camera.lenses.map((lens, i) => (
          <g key={i}>
            {/* Outer ring */}
            <circle
              cx={lens.cx}
              cy={lens.cy}
              r={lens.r + width * 0.012}
              fill={`url(#lensRing-${uniqueId})`}
            />
            {/* Lens body */}
            <circle
              cx={lens.cx}
              cy={lens.cy}
              r={lens.r}
              fill={`url(#lensGrad-${uniqueId})`}
            />
            {/* Lens reflection */}
            <circle
              cx={lens.cx - lens.r * 0.25}
              cy={lens.cy - lens.r * 0.25}
              r={lens.r * 0.2}
              fill="white"
              opacity="0.3"
            />
            {/* Inner ring detail */}
            <circle
              cx={lens.cx}
              cy={lens.cy}
              r={lens.r * 0.7}
              fill="none"
              stroke="#2a2a3a"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* Flash LED */}
        <circle
          cx={camera.flash.cx}
          cy={camera.flash.cy}
          r={camera.flash.r}
          fill="#f5f5dc"
        />
        <circle
          cx={camera.flash.cx}
          cy={camera.flash.cy}
          r={camera.flash.r * 0.6}
          fill="#fffacd"
        />

        {/* Surface reflection overlay */}
        <rect
          x={framePadding}
          y={framePadding}
          width={width - framePadding * 2}
          height={(height - framePadding * 2) * 0.35}
          rx={borderRadius - framePadding / 2}
          fill={`url(#frameHighlight-${uniqueId})`}
          style={{ mixBlendMode: "overlay" }}
        />
      </svg>
    </div>
  )
}
