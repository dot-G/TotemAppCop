"use client"

import { cn } from "@/lib/utils"
import { useRef } from "react"

interface SmartphoneCasePreviewProps {
  frameColor?: string
  caseImage?: string
  className?: string
  width?: number
  cameraStyle?: "apple" | "samsung" | "google" | "huawei" | "xiaomi" | "oneplus"
  imageOffset?: { x: number; y: number }
  imageScale?: number
  imageRotation?: number
}

export function SmartphoneCasePreview({
  frameColor = "#1a1a1a",
  caseImage,
  className,
  width = 220,
  cameraStyle = "apple",
  imageOffset = { x: 0, y: 0 },
  imageScale = 1,
  imageRotation = 0,
}: SmartphoneCasePreviewProps) {
  const height = width * 2.1
  const borderRadius = width * 0.12
  const framePadding = width * 0.03

  const uniqueId = useRef(`preview-${Math.random().toString(36).substr(2, 9)}`).current

  // Camera module config
  const getCameraModule = () => {
    if (cameraStyle === "samsung") {
      const camX = width * 0.08
      const camY = height * 0.04
      const camW = width * 0.22
      const camH = width * 0.62
      const centerX = camX + camW / 2
      return {
        x: camX, y: camY, width: camW, height: camH, rx: width * 0.04,
        lenses: [
          { cx: centerX, cy: camY + camH * 0.12, r: width * 0.055 },
          { cx: centerX, cy: camY + camH * 0.32, r: width * 0.055 },
          { cx: centerX, cy: camY + camH * 0.52, r: width * 0.055 },
          { cx: centerX, cy: camY + camH * 0.72, r: width * 0.04 },
        ],
        flash: { cx: centerX, cy: camY + camH * 0.88, r: width * 0.015 },
      }
    }

    if (cameraStyle === "google") {
      const camX = width * 0.06
      const camY = height * 0.04
      const camW = width * 0.88
      const camH = width * 0.22
      const centerY = camY + camH / 2
      return {
        x: camX, y: camY, width: camW, height: camH, rx: width * 0.04,
        lenses: [
          { cx: camX + camW * 0.15, cy: centerY, r: width * 0.055 },
          { cx: camX + camW * 0.38, cy: centerY, r: width * 0.055 },
          { cx: camX + camW * 0.61, cy: centerY, r: width * 0.045 },
        ],
        flash: { cx: camX + camW * 0.82, cy: centerY, r: width * 0.018 },
      }
    }

    if (cameraStyle === "huawei") {
      const camX = width * 0.06
      const camY = height * 0.035
      const camSize = width * 0.4
      const centerX = camX + camSize / 2
      const centerY = camY + camSize / 2
      const ringRadius = camSize * 0.28
      return {
        x: camX, y: camY, width: camSize, height: camSize, rx: camSize / 2,
        lenses: [
          { cx: centerX, cy: centerY - ringRadius, r: width * 0.055 },
          { cx: centerX + ringRadius, cy: centerY, r: width * 0.055 },
          { cx: centerX, cy: centerY + ringRadius, r: width * 0.055 },
          { cx: centerX - ringRadius, cy: centerY, r: width * 0.045 },
        ],
        flash: { cx: centerX, cy: centerY, r: width * 0.02 },
      }
    }

    if (cameraStyle === "xiaomi") {
      const camX = width * 0.05
      const camY = height * 0.03
      const camSize = width * 0.45
      const centerX = camX + camSize / 2
      const centerY = camY + camSize / 2
      const offsetX = camSize * 0.22
      const offsetY = camSize * 0.22
      return {
        x: camX, y: camY, width: camSize, height: camSize, rx: camSize / 2,
        lenses: [
          { cx: centerX - offsetX, cy: centerY - offsetY, r: width * 0.065 },
          { cx: centerX + offsetX, cy: centerY - offsetY, r: width * 0.065 },
          { cx: centerX - offsetX, cy: centerY + offsetY, r: width * 0.065 },
          { cx: centerX + offsetX, cy: centerY + offsetY, r: width * 0.065 },
        ],
        flash: { cx: centerX, cy: centerY, r: width * 0.025 },
      }
    }

    if (cameraStyle === "oneplus") {
      const camX = width * 0.06
      const camY = height * 0.035
      const camW = width * 0.38
      const camH = width * 0.55
      const centerX = camX + camW / 2
      return {
        x: camX, y: camY, width: camW, height: camH, rx: width * 0.06,
        lenses: [
          { cx: centerX, cy: camY + camH * 0.2, r: width * 0.07 },
          { cx: centerX, cy: camY + camH * 0.5, r: width * 0.055 },
          { cx: centerX, cy: camY + camH * 0.75, r: width * 0.04 },
        ],
        flash: { cx: camX + camW * 0.8, cy: camY + camH * 0.9, r: width * 0.015 },
      }
    }

    // Apple
    const camX = width * 0.06
    const camY = height * 0.035
    const camSize = width * 0.36
    return {
      x: camX, y: camY, width: camSize, height: camSize, rx: width * 0.08,
      lenses: [
        { cx: camX + camSize * 0.28, cy: camY + camSize * 0.28, r: width * 0.065 },
        { cx: camX + camSize * 0.72, cy: camY + camSize * 0.28, r: width * 0.065 },
        { cx: camX + camSize * 0.28, cy: camY + camSize * 0.72, r: width * 0.065 },
      ],
      flash: { cx: camX + camSize * 0.72, cy: camY + camSize * 0.72, r: width * 0.022 },
    }
  }

  const camera = getCameraModule()

  const cameraZone = {
    x: camera.x - width * 0.02,
    y: camera.y - width * 0.02,
    width: camera.width + width * 0.04,
    height: camera.height + width * 0.04,
  }

  const printArea = {
    x: framePadding,
    y: cameraZone.y + cameraZone.height + width * 0.04,
    width: width - framePadding * 2,
    height: height - framePadding - (cameraZone.y + cameraZone.height + width * 0.04),
  }

  const printAreaRadius = borderRadius - framePadding / 2

  // Image dimensions
  const baseImageWidth = printArea.width * 1.2
  const baseImageHeight = printArea.height
  const scaledImageWidth = baseImageWidth * imageScale
  const scaledImageHeight = baseImageHeight * imageScale
  const imageX = printArea.x + (printArea.width - scaledImageWidth) / 2 + imageOffset.x
  const imageY = printArea.y + (printArea.height - scaledImageHeight) / 2 + imageOffset.y
  const printAreaCenterX = printArea.x + printArea.width / 2
  const printAreaCenterY = printArea.y + printArea.height / 2

  return (
    <div className={cn("relative inline-block", className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={`printClip-${uniqueId}`}>
            <path
              d={`
                M ${printArea.x} ${printArea.y}
                L ${printArea.x + printArea.width} ${printArea.y}
                L ${printArea.x + printArea.width} ${printArea.y + printArea.height - printAreaRadius}
                A ${printAreaRadius} ${printAreaRadius} 0 0 1 ${printArea.x + printArea.width - printAreaRadius} ${printArea.y + printArea.height}
                L ${printArea.x + printAreaRadius} ${printArea.y + printArea.height}
                A ${printAreaRadius} ${printAreaRadius} 0 0 1 ${printArea.x} ${printArea.y + printArea.height - printAreaRadius}
                Z
              `}
            />
          </clipPath>

          {/* Camera module gradient */}
          <radialGradient id={`cameraModule-${uniqueId}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor="#2d2d2d" />
            <stop offset="100%" stopColor="#0f0f0f" />
          </radialGradient>

          {/* Lens outer ring gradient */}
          <radialGradient id={`lensOuter-${uniqueId}`} cx="40%" cy="40%">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </radialGradient>

          {/* Lens glass gradient - blue tint */}
          <radialGradient id={`lensGlass-${uniqueId}`} cx="35%" cy="35%">
            <stop offset="0%" stopColor="#2a3040" />
            <stop offset="50%" stopColor="#1a2030" />
            <stop offset="100%" stopColor="#101520" />
          </radialGradient>

          {/* Lens aperture gradient */}
          <radialGradient id={`lensAperture-${uniqueId}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#080810" />
            <stop offset="80%" stopColor="#050508" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Flash glow gradient */}
          <radialGradient id={`flashGlow-${uniqueId}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#fffef5" />
            <stop offset="50%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </radialGradient>
        </defs>

        {/* Phone frame */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={borderRadius}
          fill={frameColor}
        />

        {/* Inner case surface */}
        <rect
          x={framePadding}
          y={framePadding}
          width={width - framePadding * 2}
          height={height - framePadding * 2}
          rx={borderRadius - framePadding / 2}
          fill={frameColor}
        />

        {/* Print area background */}
        <path
          d={`
            M ${printArea.x} ${printArea.y}
            L ${printArea.x + printArea.width} ${printArea.y}
            L ${printArea.x + printArea.width} ${printArea.y + printArea.height - printAreaRadius}
            A ${printAreaRadius} ${printAreaRadius} 0 0 1 ${printArea.x + printArea.width - printAreaRadius} ${printArea.y + printArea.height}
            L ${printArea.x + printAreaRadius} ${printArea.y + printArea.height}
            A ${printAreaRadius} ${printAreaRadius} 0 0 1 ${printArea.x} ${printArea.y + printArea.height - printAreaRadius}
            Z
          `}
          fill={frameColor}
        />

        {/* Image */}
        <g clipPath={`url(#printClip-${uniqueId})`}>
          {caseImage && (
            <g transform={`rotate(${imageRotation} ${printAreaCenterX} ${printAreaCenterY})`}>
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

        {/* Camera module */}
        <rect
          x={camera.x}
          y={camera.y}
          width={camera.width}
          height={camera.height}
          rx={camera.rx}
          fill={`url(#cameraModule-${uniqueId})`}
        />
        {/* Camera module border */}
        <rect
          x={camera.x + 0.5}
          y={camera.y + 0.5}
          width={camera.width - 1}
          height={camera.height - 1}
          rx={camera.rx - 0.5}
          fill="none"
          stroke="rgba(60,60,65,0.6)"
          strokeWidth="0.5"
        />

        {/* Camera lenses */}
        {camera.lenses.map((lens, i) => (
          <g key={i}>
            {/* Outer chrome ring */}
            <circle cx={lens.cx} cy={lens.cy} r={lens.r + 1.5} fill="#2a2a2a" />
            <circle cx={lens.cx} cy={lens.cy} r={lens.r + 1} fill={`url(#lensOuter-${uniqueId})`} />
            {/* Main lens body */}
            <circle cx={lens.cx} cy={lens.cy} r={lens.r} fill="#0c0c0c" />
            {/* Lens glass with blue tint */}
            <circle cx={lens.cx} cy={lens.cy} r={lens.r * 0.85} fill={`url(#lensGlass-${uniqueId})`} />
            {/* Inner ring detail */}
            <circle cx={lens.cx} cy={lens.cy} r={lens.r * 0.65} fill="none" stroke="rgba(50,55,70,0.5)" strokeWidth="0.5" />
            {/* Aperture center */}
            <circle cx={lens.cx} cy={lens.cy} r={lens.r * 0.35} fill={`url(#lensAperture-${uniqueId})`} />
            {/* Primary specular highlight */}
            <ellipse 
              cx={lens.cx - lens.r * 0.25} 
              cy={lens.cy - lens.r * 0.25} 
              rx={lens.r * 0.22} 
              ry={lens.r * 0.12} 
              fill="rgba(255,255,255,0.3)"
              transform={`rotate(-35 ${lens.cx - lens.r * 0.25} ${lens.cy - lens.r * 0.25})`}
            />
            {/* Secondary small highlight */}
            <circle 
              cx={lens.cx + lens.r * 0.2} 
              cy={lens.cy + lens.r * 0.25} 
              r={lens.r * 0.06} 
              fill="rgba(255,255,255,0.15)" 
            />
          </g>
        ))}

        {/* Flash with glow */}
        <circle cx={camera.flash.cx} cy={camera.flash.cy} r={camera.flash.r * 1.8} fill="rgba(254,243,199,0.2)" />
        <circle cx={camera.flash.cx} cy={camera.flash.cy} r={camera.flash.r * 1.3} fill="rgba(254,243,199,0.4)" />
        <circle cx={camera.flash.cx} cy={camera.flash.cy} r={camera.flash.r} fill={`url(#flashGlow-${uniqueId})`} />
        <circle cx={camera.flash.cx - camera.flash.r * 0.2} cy={camera.flash.cy - camera.flash.r * 0.2} r={camera.flash.r * 0.3} fill="rgba(255,255,255,0.5)" />

        {/* Hint text when no image */}
        {!caseImage && (
          <text
            x={printArea.x + printArea.width / 2}
            y={printArea.y + printArea.height / 2}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize={width * 0.05}
            fontFamily="system-ui"
          >
            Sin imagen
          </text>
        )}
      </svg>
    </div>
  )
}
