"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SmartphoneCaseSimple } from "./smartphone-case-simple";
import { ColorSelector } from "../shared/color-selector2";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, X, Loader2 } from "lucide-react";
import { toJpeg } from "html-to-image";

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

  // Sincronización inicial con el Store global
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

      const dataUrl = await toJpeg(smartphoneRef.current, {
        quality: 0.9,
        canvasWidth: width * 3,
        canvasHeight: height * 3,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: "#ffffff",
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

  /**
   * MAPEO SIMPLIFICADO:
   * Como ahora el ColorSelector es consistente y usa '.id' para todo,
   * solo necesitamos pasar el 'caseId' como el identificador principal.
   */
  const colorOptionsForSelector = availableColors.map((c) => ({
    id: c.caseId, // Identificador único para el anillo y el label
    colourId: c.colourId,
    colour: {
      name: c.name,
      hex_code: c.hex,
    },
  }));

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[120] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl overflow-hidden border border-white/20">
        
        <div className="flex justify-between items-center mb-6">
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

        <div className="flex justify-center bg-white rounded-2xl mb-6 overflow-hidden border border-slate-50">
          <div
            ref={smartphoneRef}
            className="bg-white p-6 flex items-center justify-center"
            style={{
              width: "100%",
              maxWidth: "260px",
              aspectRatio: "9 / 19",
              display: "flex",
            }}
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

        <div className="space-y-5">
          {/* Al usar selectedCase?.caseId, ColorSelector encontrará el match
              automáticamente con la propiedad .id que mapeamos arriba. */}
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

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-400 w-10 text-center">Zoom</span>
            <Slider
              value={[imageScale]}
              onValueChange={(v) => setImageScale(v[0])}
              min={0.5} max={4} step={0.1}
              className="flex-1"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline" size="icon"
              className="h-14 w-14 rounded-2xl border-slate-200"
              onClick={() => setImageRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="w-5 h-5 text-slate-600" />
            </Button>

            <Button
              className="h-14 flex-1 rounded-2xl bg-slate-900 text-white font-bold"
              onClick={handleAccept}
              disabled={isCapturing}
            >
              {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : "GUARDAR CAMBIOS"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}