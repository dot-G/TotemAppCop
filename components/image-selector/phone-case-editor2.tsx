"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SmartphoneCaseSimple } from "./smartphone-case-simple2";
import { ColorSelector } from "../shared/color-selector-vertical";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react"; // Importamos X de lucide
import { toPng } from "html-to-image";

export type CameraCutoutStyle = 
  | "horizontal-top" | "square-left" | "rectangular-left" 
  | "vertical-pill" | "pill-left" | "circle-large" 
  | "circle-small" | "square-center";

export interface EditorTransform { x: number; y: number; scale: number; rotation: number; }

interface AvailableColor { caseId: string; colourId: string; name: string; hex: string; }

interface PhoneCaseEditorProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (capturedImage: string, colorHex: string, transform: EditorTransform, caseId: string, colourId: string, cameraStyle: CameraCutoutStyle) => void;
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
  image, isOpen, onClose, onAccept, initialTransform, camera = "square-left", allowClose = false, availableColors = [], initialCaseId,
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
      }
    }
  }, [isOpen, initialTransform, initialCaseId, availableColors, camera]);

  const handleAccept = useCallback(async () => {
    if (!smartphoneRef.current || !selectedCase) return;
    setIsCapturing(true);
    try {
      const dataUrl = await toPng(smartphoneRef.current, { pixelRatio: 2, cacheBust: true });
      onAccept(dataUrl, selectedCase.hex, { x: imageOffset.x, y: imageOffset.y, scale: imageScale[0], rotation: imageRotation }, selectedCase.caseId, selectedCase.colourId, currentCamera);
    } catch (err) {
      console.error(err);
    } finally { setIsCapturing(false); }
  }, [onAccept, selectedCase, imageOffset, imageScale, imageRotation, currentCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-0 md:p-6 backdrop-blur-xl">
      <div className="bg-white md:rounded-[32px] shadow-2xl overflow-hidden w-full max-w-5xl flex flex-col h-full md:h-auto border-none relative">
        
        {/* BOTÓN CERRAR (X) SUPERIOR DERECHA */}
        {allowClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[130] p-2 bg-white/50 backdrop-blur-md rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* ÁREA DE VISUALIZACIÓN */}
        <div className="flex-1 bg-white flex flex-col items-center justify-center relative p-0 overflow-hidden min-h-[350px]">
          <div className="absolute top-4 left-6 z-10 pointer-events-none">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-100">Editor</span>
          </div>

          <div ref={smartphoneRef} className="w-full flex justify-center transform scale-[0.8] sm:scale-90 md:scale-90 transition-all duration-300">
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

        {/* PANEL DE CONTROLES */}
        <div className="bg-white px-5 pt-4 pb-6 border-t border-slate-50">
          <div className="grid grid-cols-[1fr_4fr] md:grid-cols-1 items-center gap-3 md:fixed md:right-10 md:top-1/2 md:-translate-y-1/2 md:w-20 md:bg-white/90 md:p-4 md:rounded-full md:shadow-2xl">
            
            {/* LENTE */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[7px] font-black uppercase text-slate-300 tracking-tighter">Lente</span>
              <button 
                onClick={() => setCameraDialogOpen(true)}
                className="w-8 h-12 bg-slate-800 rounded-[5px] relative overflow-hidden shadow-sm active:scale-90 transition-transform"
              >
                <div className={`absolute bg-slate-400 ${getMiniCutoutClass(currentCamera)}`} />
              </button>
            </div>

            {/* COLOR */}
            <div className="flex flex-col items-center gap-1">
              <span className="hidden text-[7px] font-black uppercase text-slate-300 tracking-tighter">Color</span>
              <div className="flex items-center justify-center w-full">
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
              </div>
            </div>
          </div>

          {/* ACCIÓN FINAL */}
          <div className="mt-6 flex items-center justify-center gap-2 w-full max-w-[500px] mx-auto">
            {allowClose && (
              <Button 
                variant="ghost" 
                className="h-14 md:h-16 flex-1 md:flex-none px-6 text-slate-400 font-bold text-sm uppercase tracking-tight hover:text-slate-600" 
                onClick={onClose}
              >
                Cancelar
              </Button>
            )}
            <Button
              className="h-14 md:h-16 flex-[2] md:max-w-[320px] rounded-[18px] md:rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base md:text-lg shadow-lg active:scale-95 transition-all"
              onClick={handleAccept}
              disabled={isCapturing}
            >
              {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar"}
            </Button>
          </div>
        </div>
      </div>

      {/* SELECTOR DE LENTES */}
      <Dialog open={cameraDialogOpen} onOpenChange={setCameraDialogOpen}>
        <DialogContent className="z-[200] max-w-sm bg-white rounded-[32px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Modelo de Lente</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-6">
            {cameraCutoutStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => { setCurrentCamera(style.value); setCameraDialogOpen(false); }}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
                  currentCamera === style.value ? "bg-indigo-50 ring-2 ring-indigo-500" : "hover:bg-slate-50"
                }`}
              >
                <div className="w-10 h-16 bg-slate-800 rounded-lg relative overflow-hidden shadow-md">
                  <div className={`absolute bg-slate-400 ${getMiniCutoutClass(style.value)}`} />
                </div>
                <span className="text-[9px] font-bold text-slate-600 uppercase text-center leading-tight">{style.name}</span>
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
    case "horizontal-top": return "w-[60%] h-[12%] top-[8%] left-[20%] rounded-full"; 
    case "square-left": return "w-[30%] h-[20%] top-[8%] left-[12%] rounded-[2px]"; 
    case "rectangular-left": return "w-[30%] h-[35%] top-[8%] left-[12%] rounded-[3px]"; 
    case "vertical-pill": return "w-[15%] h-[35%] top-[8%] left-[42.5%] rounded-full"; 
    case "pill-left": return "w-[15%] h-[35%] top-[8%] left-[12%] rounded-full"; 
    case "circle-large": return "w-[45%] h-[30%] top-[8%] left-[27.5%] rounded-full"; 
    case "circle-small": return "w-[22%] h-[15%] top-[8%] left-[12%] rounded-full"; 
    case "square-center": return "w-[38%] h-[25%] top-[8%] left-[31%] rounded-[3px]"; 
    default: return "";
  }
}