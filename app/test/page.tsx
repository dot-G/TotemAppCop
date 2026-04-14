"use client"

import { useState, useRef } from "react"
import { SmartphoneBackCase } from "@/components/smartphone-back-case2"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Upload, X, RotateCw, Download } from "lucide-react"

const presetColors = [
  { name: "Rojo", value: "#dc2626" },
  { name: "Verde", value: "#16a34a" },
  { name: "Azul", value: "#2563eb" },
  { name: "Dorado", value: "#c9a55c" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Negro", value: "#1a1a1a" },
  { name: "Plata", value: "#94a3b8" },
]

const cameraStyles: Array<{ name: string; value: "island" | "vertical" | "square" }> = [
  { name: "Island (iPhone)", value: "island" },
  { name: "Vertical (Samsung)", value: "vertical" },
  { name: "Square (Pixel)", value: "square" },
]

export default function SmartphoneBackCaseDemo() {
  const [frameColor, setFrameColor] = useState("#dc2626")
  const [caseImage, setCaseImage] = useState("")
  const [phoneSize, setPhoneSize] = useState([220])
  const [showPrintArea, setShowPrintArea] = useState(true)
  const [cameraStyle, setCameraStyle] = useState<"island" | "vertical" | "square">("island")
  const [glowIntensity, setGlowIntensity] = useState([0.3])
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const [imageScale, setImageScale] = useState([1])
  const [imageRotation, setImageRotation] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const smartphoneRef = useRef<HTMLDivElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate that it's an image
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        setCaseImage(event.target?.result as string)
        setImageOffset({ x: 0, y: 0 })
        setImageScale([1])
        setImageRotation(0)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setCaseImage("")
    setImageOffset({ x: 0, y: 0 })
    setImageScale([1])
    setImageRotation(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const resetImagePosition = () => {
    setImageOffset({ x: 0, y: 0 })
  }

  const rotateImage = () => {
    setImageRotation((prev) => prev + 90)
    setImageOffset({ x: 0, y: 0 })
  }

  const handlePinchScaleChange = (scale: number) => {
    // Pinch zoom - NO auto center
    setImageScale([scale])
  }

  const handleSliderScaleChange = (values: number[]) => {
    setImageScale(values)
    // Auto center when reaching 1x
    if (values[0] <= 1) {
      setImageOffset({ x: 0, y: 0 })
    }
  }

  const downloadImage = async () => {
    const svgElement = smartphoneRef.current?.querySelector('svg')
    if (!svgElement) return

    // Clone the SVG to modify it without affecting the display
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
    
    // Get SVG dimensions
    const width = parseInt(svgElement.getAttribute('width') || '300')
    const height = parseInt(svgElement.getAttribute('height') || '600')
    
    // Serialize SVG to string
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clonedSvg)
    
    // Create a blob from SVG
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    
    // Create image from SVG
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      // Create canvas with higher resolution for better quality
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, width, height)
      
      // Download as PNG
      const link = document.createElement('a')
      link.download = `smartphone-case-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      URL.revokeObjectURL(url)
    }
    
    img.src = url
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Preview */}
          <div className="flex flex-col items-center justify-center min-h-[700px] relative">
            {/* Background pattern */}
            <div 
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at center, ${frameColor} 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />
            
            <div ref={smartphoneRef}>
              <SmartphoneBackCase
                frameColor={frameColor}
                caseImage={caseImage}
                width={phoneSize[0]}
                showPrintArea={showPrintArea}
                cameraStyle={cameraStyle}
                glowIntensity={glowIntensity[0]}
                imageOffset={imageOffset}
                imageScale={imageScale[0]}
                imageRotation={imageRotation}
                onImageOffsetChange={setImageOffset}
                onImageScaleChange={handlePinchScaleChange}
                enableDrag={true}
                enablePinchZoom={true}
              />
            </div>

            {/* Buttons below smartphone */}
            <div className="mt-6 flex gap-3 flex-wrap justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                variant="outline"
                className="h-12 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5" />
                Subir imagen
              </Button>
              {caseImage && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12"
                  onClick={rotateImage} 
                  title="Rotar 90 grados"
                >
                  <RotateCw className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="outline"
                className="h-12 gap-2"
                onClick={downloadImage}
                title="Descargar imagen"
              >
                <Download className="w-5 h-5" />
                Descargar
              </Button>
              {caseImage && (
                <Button variant="destructive" size="icon" className="h-12 w-12" onClick={clearImage}>
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>

            <p className="mt-4 text-zinc-500 text-sm text-center max-w-xs">
              La linea azul indica el area imprimible. La zona roja esta reservada para la camara.
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            
            {/* Image Upload */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">
                Imagen del Case
              </h2>
              
              {/* Image positioning controls */}
              {caseImage && (
                <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-300">Ajustar imagen</h3>
                    <Button variant="ghost" size="sm" onClick={resetImagePosition}>
                      Centrar
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Zoom: {imageScale[0].toFixed(1)}x</span>
                      <Button variant="outline" size="sm" onClick={rotateImage} title="Rotar 90 grados">
                        <RotateCw className="w-4 h-4 mr-1" />
                        {imageRotation % 360}°
                      </Button>
                    </div>
                    <Slider
                      value={imageScale}
                      onValueChange={handleSliderScaleChange}
                      min={0.5}
                      max={4}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <p className="text-xs text-zinc-500">
                    Arrastra para mover. En mobile usa dos dedos para hacer zoom (max 4x).
                  </p>
                </div>
              )}
            </div>

            {/* Color Selection */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: frameColor }} />
                Color del Marco
              </h2>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={frameColor === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFrameColor(preset.value)}
                    className="gap-2"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-zinc-600"
                      style={{ backgroundColor: preset.value }}
                    />
                    {preset.name}
                  </Button>
                ))}
              </div>
              
              {/* Custom color picker */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-zinc-400">Personalizado:</label>
                <input
                  type="color"
                  value={frameColor}
                  onChange={(e) => setFrameColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border border-zinc-700 bg-transparent"
                />
                <span className="text-sm text-zinc-500 font-mono">{frameColor}</span>
              </div>
            </div>

            {/* Camera Style */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">
                Estilo de Camara
              </h2>
              <div className="flex flex-wrap gap-2">
                {cameraStyles.map((style) => (
                  <Button
                    key={style.value}
                    variant={cameraStyle === style.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCameraStyle(style.value)}
                  >
                    {style.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Size Control */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">
                Tamaño de vista previa: {phoneSize[0]}px
              </h2>
              <Slider
                value={phoneSize}
                onValueChange={setPhoneSize}
                min={220}
                max={420}
                step={10}
                className="w-full"
              />
            </div>

            {/* Glow Intensity */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">
                Intensidad del Brillo: {Math.round(glowIntensity[0] * 100)}%
              </h2>
              <Slider
                value={glowIntensity}
                onValueChange={setGlowIntensity}
                min={0}
                max={0.6}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* Show Print Area Toggle */}
            <div className="flex items-center gap-3">
              <Button
                variant={showPrintArea ? "default" : "outline"}
                onClick={() => setShowPrintArea(!showPrintArea)}
              >
                {showPrintArea ? "Ocultar guias de impresion" : "Mostrar guias de impresion"}
              </Button>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  )
}
