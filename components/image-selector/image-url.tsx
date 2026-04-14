"use client"

import { useState, useEffect } from "react"
import { PhoneCaseEditor, CameraStyle } from "./phone-case-editor"
import { Button } from "@/components/ui/button"
import { Pencil, Download } from "lucide-react"

interface PhoneUrlPageProps {
  imageUrl?: string
  color?: string
  camera?: CameraStyle
}

export default function PhoneUrlPage({ 
  imageUrl = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&h=1200&fit=crop",
  color = "#dc2626", 
  camera = "huawei" 
}: PhoneUrlPageProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState("")
  const [currentColor, setCurrentColor] = useState(color)

  // Abrir editor automaticamente al cargar con imagen URL
  useEffect(() => {
    if (imageUrl && !capturedImage) {
      setIsEditorOpen(true)
    }
  }, [imageUrl, capturedImage])

  const handleAccept = (captured: string, newColor: string) => {
    setCapturedImage(captured)
    setCurrentColor(newColor)
    setIsEditorOpen(false)
  }

  const downloadImage = () => {
    if (!capturedImage) return
    const link = document.createElement('a')
    link.download = `case-${Date.now()}.png`
    link.href = capturedImage
    link.click()
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      {/* Preview */}
      {capturedImage && (
        <img 
          src={capturedImage} 
          alt="Case personalizado" 
          className="max-w-[220px] rounded-lg"
        />
      )}

      {/* Action buttons */}
      {capturedImage && (
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={() => setIsEditorOpen(true)}
          >
            <Pencil className="w-5 h-5" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={downloadImage}
          >
            <Download className="w-5 h-5" />
            Descargar
          </Button>
        </div>
      )}

      {/* Editor popup */}
      <PhoneCaseEditor
        image={imageUrl}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onAccept={handleAccept}
        initialColor={currentColor}
        camera={camera}
        allowClose={!!capturedImage}
      />
    </div>
  )
}
