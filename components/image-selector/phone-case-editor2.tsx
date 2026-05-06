"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SmartphoneCaseSimple } from "./smartphone-case-simple2";
import { ColorSelector } from "../shared/color-selector";
import { ColorSelectorVertical } from "../shared/color-selector-vertical";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";
import html2canvas from 'html2canvas';
import { set as setIDB } from "idb-keyval";

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

async function getSafeImageData(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return url;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error convirtiendo imagen a Base64:", error);
    return url;
  }
}

export function PhoneCaseEditor({
  image, isOpen, onClose, onAccept, initialTransform, camera = "square-left", allowClose = false, availableColors = [], initialCaseId,
}: PhoneCaseEditorProps) {
  const [safeImage, setSafeImage] = useState<string>("");
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState([1]);
  const [imageRotation, setImageRotation] = useState(0);
  const [currentCamera, setCurrentCamera] = useState<CameraCutoutStyle>(camera);
  const [selectedCase, setSelectedCase] = useState<AvailableColor | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);

  // NUEVO: Estado para manejar el ancho real del componente sin usar scale de CSS
  const [componentWidth, setComponentWidth] = useState(280);

  const smartphoneRef = useRef<HTMLDivElement>(null);

  // Manejo de responsividad manual para el width del componente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setComponentWidth(220); // Tamaño más pequeño para móviles
      } else {
        setComponentWidth(500); // Tamaño para desktop
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && image) {
      getSafeImageData(image).then(setSafeImage);
    }
  }, [isOpen, image]);

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
      // 1. Pequeño delay para asegurar que el SVG escalado se renderice bien
      await new Promise(r => setTimeout(r, 300));
      const element = smartphoneRef.current;

      // 2. Captura con fondo blanco (necesario para JPG)
      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: "#ffffff", // Fondo sólido para evitar artefactos en el JPG
        scale: 2,                   // Calidad Retina
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

      /**
       * 3. Generar JPG comprimido
       * "image/jpeg" -> Define el formato
       * 0.8 -> Calidad de 0 a 1 (80% es excelente para web)
       */
      const compressedJpg = canvas.toDataURL("image/jpeg", 0.8);

      // 4. Persistencia en IndexedDB
      const storageKey = `case-design-${Date.now()}`;
      await setIDB(storageKey, compressedJpg);

      // 5. Callback final
      onAccept(
        compressedJpg,
        selectedCase.hex,
        {
          x: imageOffset.x,
          y: imageOffset.y,
          scale: imageScale[0],
          rotation: imageRotation
        },
        selectedCase.caseId,
        selectedCase.colourId,
        currentCamera
      );

    } catch (err) {
      console.error("Error en el proceso de captura JPG:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [onAccept, selectedCase, imageOffset, imageScale, imageRotation, currentCamera]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center min-[960px]:items-start justify-center z-[120] p-0 md:p-6 backdrop-blur-xl">
      <div className="bg-white md:rounded-[32px] shadow-2xl overflow-hidden w-full max-w-5xl flex flex-col h-full md:h-auto border-none relative">

        {allowClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[130] p-2 bg-white/50 backdrop-blur-md rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="flex-1 bg-white flex flex-col items-center justify-center relative p-0  min-[960px]:p-16 overflow-hidden min-h-[320px] min-[960px]:min-h-[50vh]">
          {/* 
              CAMBIO: Se eliminan las clases scale-90 / scale-80. 
              El tamaño ahora es controlado por la prop width que recibe SmartphoneCaseSimple.
          */}
          <div
            ref={smartphoneRef}
            className="w-fit h-fit bg-transparent flex justify-center transition-all duration-300"
          >
            <SmartphoneCaseSimple
              width={componentWidth} // <--- Prop de ancho dinámico
              frameColor={selectedCase?.hex || "#000000"}
              caseImage={safeImage}
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

          <div className="absolute top-46 left-10 w-16 h-16 hidden min-[960px]:flex min-[960px]:w-40 min-[960px]:h-40 flex flex-col items-center">
            <img
              src="/pinch.gif"
              alt="Gestos"
              className="object-contain w-full h-full"
            />
            <p className="min-[960px]:text-[22px] leading-[1.2em] text-center w-full">
                               Usa los dedos para mover, zoom y rotar

            </p>
          </div>


          <div className="hidden w-[50px] min-[960px]:flex fixed right-10 top-55 flex-col items-center gap-6 bg-white/90 p-5 z-[130] border border-slate-100 rounded-full shadow-sm">


            <div className="flex flex-col gap-2">
              <span className="text-[10px] min-[960px]:text-[12px] font-semibold uppercase text-slate-400">Color</span>
              <ColorSelectorVertical
                casesApi={availableColors.map(c => ({
                  id: c.caseId, colourId: c.colourId, colour: { name: c.name, hex_code: c.hex }
                }))}
                selectedCaseId={selectedCase?.caseId || null}
                onCaseChange={(item) =>
                  setSelectedCase({
                    caseId: item.id, colourId: item.colourId, name: item.colour.name, hex: item.colour.hex_code,
                  })
                }
              />
            </div>
            <div className="hidden w-8 h-[1px] bg-slate-100" />
            <div className="hidden flex flex-col items-center gap-2">
              <span className="text-[10px] min-[960px]:text-[12px] font-semibold uppercase text-slate-400">Cámara</span>
              <button
                onClick={() => setCameraDialogOpen(true)}
                className="w-10 h-14 bg-slate-800 rounded-[8px] relative overflow-hidden shadow-sm active:scale-95 transition-transform"
              >
                <div className={`absolute bg-slate-400 ${getMiniCutoutClass(currentCamera)}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Controles Inferiores */}
        <div className="bg-white px-5 pt-0 pb-6">


          <div className="grid items-center min-[960px]:hidden w-full">
            <div className="grid grid-cols-2 w-full items-center">

              {/* COLUMNA 1: Gesto Pinch (Alineado a la izquierda) */}
              <div className="flex flex-row items-center shrink-0">
                <div className="w-[200px]">
                  <img
                    src="/pinch.gif"
                    alt="Gestos"
                    className="object-contain w-full h-full"
                  />
                </div>
                <p className="text-[12px] min-[960px]:text-[20px] leading-tight text-left text-slate-500 font-medium mt-2">
                  Usa los dedos para mover, zoom y rotar
                </p>
              </div>

              {/* COLUMNA 2: Selector de Colores (Alineado a la derecha) */}
              <div className="flex justify-end items-center">
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

          <div className="mt-6 flex items-center justify-center gap-2 w-full max-w-[500px] mx-auto">
            {allowClose && (
              <Button
                variant="ghost"
                className="h-14 md:h-16 flex-1 md:flex-none px-6 text-slate-400 font-bold text-sm min-[960px]:text-[22px] uppercase hover:text-slate-600"
                onClick={onClose}
              >
                Cancelar
              </Button>
            )}
            <Button
              className="h-14 md:h-16 flex-[2] md:max-w-[320px] rounded-[18px] md:rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base min-[960px]:text-[25px] md:text-lg shadow-lg active:scale-95 transition-all"
              onClick={handleAccept}
              disabled={isCapturing}
            >
              {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar"}
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        div[data-radix-portal] div[data-state="open"].fixed.inset-0.bg-black\\/80 {
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          background-color: rgba(0, 0, 0, 0.4) !important;
        }
      `}</style>

      <Dialog open={cameraDialogOpen} onOpenChange={setCameraDialogOpen}>
        <DialogContent className="z-[200] max-w-sm bg-white rounded-[32px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-[13px] font-semibold uppercase tracking-widest text-slate-400 mb-6">
              Disposición de la cámara
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-6">
            {cameraCutoutStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => {
                  setCurrentCamera(style.value);
                  setCameraDialogOpen(false);
                }}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${currentCamera === style.value
                  ? "bg-indigo-50 ring-2 ring-indigo-500"
                  : "hover:bg-slate-50"
                  }`}
              >
                <div className="w-10 h-16 bg-slate-800 rounded-lg relative overflow-hidden shadow-md">
                  <div className={`absolute bg-slate-400 ${getMiniCutoutClass(style.value)}`} />
                </div>
                <span className="text-[9px] font-bold text-slate-600 uppercase text-center leading-tight">
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