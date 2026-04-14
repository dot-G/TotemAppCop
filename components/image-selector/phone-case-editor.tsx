"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SmartphoneCaseSimple } from "./smartphone-case-simple";
import { ColorSelector } from "../shared/color-selector2";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, X, Loader2 } from "lucide-react";
import { toPng } from "html-to-image"; // Cambiado a toPng para preservar transparencia

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
  onAccept: (
    capturedImage: string,
    colorHex: string,
    transform: EditorTransform,
    caseId: string,
    colourId: string
  ) => void;
  initialTransform?: EditorTransform | null;
  camera?: "apple" | "samsung" | "google" | "huawei" | "xiaomi" | "oneplus";
  allowClose?: boolean;
  availableColors: AvailableColor[];
  initialCaseId: string | null;
}

export function PhoneCaseEditor({
  image,
  isOpen,
  onClose,
  onAccept,
  initialTransform,
  camera = "apple",
  allowClose = false,
  availableColors = [],
  initialCaseId,
}: PhoneCaseEditorProps) {
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  const [selectedCase, setSelectedCase] = useState<AvailableColor | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const smartphoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const current =
        availableColors.find((c) => c.caseId === initialCaseId) ||
        availableColors[0];
      
      setSelectedCase(current || null);

      if (initialTransform) {
        setImageOffset({ x: initialTransform.x, y: initialTransform.y });
        setImageScale(initialTransform.scale);
        setImageRotation(initialTransform.rotation);
      } else {
        setImageOffset({ x: 0, y: 0 });
        setImageScale(1);
        setImageRotation(0);
      }
    }
  }, [isOpen, initialTransform, initialCaseId, availableColors]);

  const handleAccept = useCallback(async () => {
    if (!smartphoneRef.current || !selectedCase) return;
    setIsCapturing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const width = smartphoneRef.current.offsetWidth;
      const height = smartphoneRef.current.offsetHeight;

      // Captura en PNG para que los bordes y la transparencia sean reales
      const dataUrl = await toPng(smartphoneRef.current, {
        canvasWidth: width * 3,
        canvasHeight: height * 3,
        pixelRatio: 1,
        cacheBust: true,
      });

      if (!dataUrl || dataUrl === "data:,") throw new Error("Captura fallida");

      onAccept(
        dataUrl,
        selectedCase.hex,
        {
          x: imageOffset.x,
          y: imageOffset.y,
          scale: imageScale,
          rotation: imageRotation,
        },
        selectedCase.caseId,
        selectedCase.colourId
      );
    } catch (err) {
      console.error("Error en captura:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [onAccept, selectedCase, imageOffset, imageScale, imageRotation]);

  if (!isOpen) return null;

  const colorOptionsForSelector = availableColors.map((c) => ({
    id: c.caseId,
    colourId: c.colourId,
    colour: {
      name: c.name,
      hex_code: c.hex,
    },
  }));

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

        <div className="flex justify-center bg-white rounded-2xl mb-6 overflow-hidden">
          <div
            ref={smartphoneRef}
            className="bg-white pt-6 flex items-center justify-center"
            style={{ width: "100%", maxWidth: "240px", display: "flex" }}
          >
            <SmartphoneCaseSimple
              frameColor={selectedCase?.hex || "#000000"}
              caseImage={image}
              cameraStyle={camera as any}
              imageOffset={imageOffset}
              imageScale={imageScale}
              imageRotation={imageRotation}
              onImageOffsetChange={setImageOffset}
              onImageScaleChange={setImageScale}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {/* CORRECCIÓN: Eliminado el % 360 para que la rotación sea continua e infinita visualmente */}
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-2xl border-slate-200 shrink-0"
              onClick={() => setImageRotation((r) => r + 90)}
            >
              <RotateCw className="w-5 h-5 text-slate-600" />
            </Button>

            <div className="flex-1 flex items-center gap-3 bg-slate-50 h-14 px-4 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 w-8 text-center">
                Zoom
              </span>
              <Slider
                value={[imageScale]}
                onValueChange={(v) => setImageScale(v[0])}
                min={0.5}
                max={4}
                step={0.1}
                className="flex-1"
              />
            </div>
          </div>

          <ColorSelector
            casesApi={colorOptionsForSelector}
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

          <div className="flex gap-3 pt-2">
            <Button
              className="h-14 flex-1 rounded-[14px] bg-[#6b21a8] text-[16px] text-white font-semibold"
              onClick={handleAccept}
              disabled={isCapturing}
            >
              {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Elegir Diseño"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}