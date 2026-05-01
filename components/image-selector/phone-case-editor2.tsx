"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SmartphoneCaseSimple } from "./smartphone-case-simple2";
import { ColorSelector } from "../shared/color-selector2";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RotateCw, X, Loader2, Camera } from "lucide-react";
import { toPng } from "html-to-image";

// Tipos de recortes (Se mantiene igual)
export type CameraCutoutStyle = 
  | "horizontal-top" | "square-left" | "rectangular-left" 
  | "vertical-pill" | "pill-left" | "circle-large" 
  | "circle-small" | "square-center";

export interface EditorTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface AvailableColor {
  caseId: string;
  colourId: string;
  name: string;
  hex: string;
}

interface PhoneCaseEditorProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  // AJUSTE: Ahora devolvemos también el estilo de cámara
  onAccept: (
    capturedImage: string,
    colorHex: string,
    transform: EditorTransform,
    caseId: string,
    colourId: string,
    cameraStyle: CameraCutoutStyle 
  ) => void;
  initialTransform?: EditorTransform | null;
  camera?: CameraCutoutStyle;
  allowClose?: boolean;
  availableColors: AvailableColor[];
  initialCaseId: string | null;
}

const cameraCutoutStyles: Array<{ name: string; value: CameraCutoutStyle }> = [
  { name: "Horizontal", value: "horizontal-top" },
  { name: "Cuadrado L", value: "square-left" },
  { name: "Rect. L", value: "rectangular-left" },
  { name: "Pill Centro", value: "vertical-pill" },
  { name: "Pill L", value: "pill-left" },
  { name: "Círculo G", value: "circle-large" },
  { name: "Círculo P", value: "circle-small" },
  { name: "Cuadrado C", value: "square-center" },
];

export function PhoneCaseEditor({
  image,
  isOpen,
  onClose,
  onAccept,
  initialTransform,
  camera = "square-left",
  allowClose = false,
  availableColors = [],
  initialCaseId,
}: PhoneCaseEditorProps) {
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState([1]);
  const [imageRotation, setImageRotation] = useState(0);
  const [currentCamera, setCurrentCamera] = useState<CameraCutoutStyle>(camera);
  
  const [selectedCase, setSelectedCase] = useState<AvailableColor | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);

  const smartphoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const current = availableColors.find((c) => c.caseId === initialCaseId) || availableColors[0];
      setSelectedCase(current || null);
      setCurrentCamera(camera || "square-left");

      if (initialTransform) {
        setImageOffset({ x: initialTransform.x, y: initialTransform.y });
        setImageScale([initialTransform.scale]);
        setImageRotation(initialTransform.rotation);
      } else {
        setImageOffset({ x: 0, y: 0 });
        setImageScale([1]);
        setImageRotation(0);
      }
    }
  }, [isOpen, initialTransform, initialCaseId, availableColors, camera]);

  // Función de compresión (Se mantiene igual)
  const compressBase64 = (base64Str: string, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        const result = canvas.toDataURL("image/jpeg", quality);
        resolve(result);
      };
    });
  };

  const handleAccept = useCallback(async () => {
    if (!smartphoneRef.current || !selectedCase) return;
    setIsCapturing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      const width = smartphoneRef.current.offsetWidth;
      const height = smartphoneRef.current.offsetHeight;

      const dataUrl = await toPng(smartphoneRef.current, {
        canvasWidth: width * 2, 
        canvasHeight: height * 2,
        pixelRatio: 1,
        cacheBust: true,
      });

      const optimizedImage = await compressBase64(dataUrl, 0.8);

      // AJUSTE: Pasamos currentCamera al final
      onAccept(
        optimizedImage,
        selectedCase.hex,
        {
          x: imageOffset.x,
          y: imageOffset.y,
          scale: imageScale[0],
          rotation: imageRotation,
        },
        selectedCase.caseId,
        selectedCase.colourId,
        currentCamera 
      );
    } catch (err) {
      console.error("Error en captura:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [onAccept, selectedCase, imageOffset, imageScale, imageRotation, currentCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[120] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl overflow-hidden border border-white/20">
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Editor</span>
            <h3 className="text-[12px] font-bold text-slate-900">Ajusta tu diseño</h3>
          </div>
          {allowClose && (
            <button onClick={onClose} className="p-2 active:scale-90">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        <Button 
          variant="outline" 
          className="w-full mb-4 gap-2 rounded-xl"
          onClick={() => setCameraDialogOpen(true)}
        >
          <Camera className="w-4 h-4" />
          <span>Cámara: {cameraCutoutStyles.find(s => s.value === currentCamera)?.name}</span>
        </Button>

        <div className="flex justify-center bg-slate-50 rounded-2xl mb-6 py-4 overflow-hidden">
          <div ref={smartphoneRef} className="flex items-center justify-center">
            <SmartphoneCaseSimple
              frameColor={selectedCase?.hex || "#000000"}
              caseImage={image}
              cameraCutout={currentCamera}
              imageOffset={imageOffset}
              imageScale={imageScale[0]}
              imageRotation={imageRotation}
              onImageOffsetChange={setImageOffset}
              onImageScaleChange={(s) => setImageScale([s])}
              onImageRotationChange={setImageRotation}
              enableDrag={true}
              enablePinchZoom={true}
              enablePinchRotation={true}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-2xl shrink-0"
              onClick={() => {
                setImageRotation((r) => r + 90);
                setImageOffset({ x: 0, y: 0 });
              }}
            >
              <RotateCw className="w-5 h-5 text-slate-600" />
            </Button>

            <div className="flex-1 flex flex-col justify-center gap-1 bg-slate-50 h-14 px-4 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black uppercase text-slate-400">Zoom</span>
              <Slider
                value={imageScale}
                onValueChange={setImageScale}
                min={0.5}
                max={4}
                step={0.1}
                className="flex-1"
              />
            </div>
          </div>

          <ColorSelector
            casesApi={availableColors.map(c => ({
              id: c.caseId,
              colourId: c.colourId,
              colour: { name: c.name, hex_code: c.hex }
            }))}
            selectedCaseId={selectedCase?.caseId || null}
            onCaseChange={(item) =>
              setSelectedCase({
                caseId: item.id,
                colourId: item.colourId,
                name: item.colour.name,
                hex: item.colour.hex_code,
              })
            }
          />

          <Button
            className="h-14 w-full rounded-2xl bg-[#6b21a8] hover:bg-[#581c87] text-white font-bold"
            onClick={handleAccept}
            disabled={isCapturing}
          >
            {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Elegir Diseño"}
          </Button>
        </div>
      </div>

      <Dialog open={cameraDialogOpen} onOpenChange={setCameraDialogOpen}>
        <DialogContent className="z-[200] sm:max-w-md bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-slate-900">Disposición de cámara</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4 justify-items-center">
            {cameraCutoutStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => {
                  setCurrentCamera(style.value);
                  setCameraDialogOpen(false);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all w-full ${
                  currentCamera === style.value 
                    ? "bg-slate-100 ring-2 ring-purple-600" 
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="w-10 h-16 bg-slate-400 rounded-lg relative">
                  <div className={`absolute bg-slate-900 rounded-[2px] ${getMiniCutoutClass(style.value)}`} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                  {style.name}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getMiniCutoutClass(style: CameraCutoutStyle) {
  switch (style) {
    case "horizontal-top": return "w-7 h-2 top-1 left-1.5";
    case "square-left": return "w-4 h-4 top-1 left-1";
    case "rectangular-left": return "w-4 h-6 top-1 left-1";
    case "vertical-pill": return "w-2 h-7 top-1 left-4";
    case "pill-left": return "w-2 h-7 top-1 left-1";
    case "circle-large": return "w-6 h-6 top-1 left-2 rounded-full";
    case "circle-small": return "w-3 h-3 top-1 left-1 rounded-full";
    case "square-center": return "w-5 h-5 top-1 left-2.5";
    default: return "";
  }
}