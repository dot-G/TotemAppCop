"use client";

import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

// --- 1. TIPOS Y ENUMS ---
export type StepType =
  | "onboarding"
  | "phone-selector"
  | "combo-selector"
  | "mica-selector"
  | "case-selector"
  | "image-selector"
  | "contact-form"
  | "final-summary"
  | "payment";

export type ImageSourceType = "brand" | "custom" | null;
export type ImageSize = "Pequeña" | "Mediana" | "Grande";

// Estilos de cámara permitidos (como strings para el store)
export type CameraCutoutStyle = 
  | "horizontal-top" 
  | "square-left" 
  | "rectangular-left" 
  | "vertical-pill" 
  | "pill-left" 
  | "circle-large" 
  | "circle-small" 
  | "square-center";

export interface EditorTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface AvailableColor {
  caseId: string;
  colourId: string;
  name: string;
  hex: string;
  caseImage: string;
}

export interface ImageConfig {
  rotation: number;
  size: ImageSize;
}

export interface MissingModelEntry {
  brand: string;
  model: string;
  timestamp: string;
}

export interface ComboPrices {
  micaDefault: number;
  mica: number;
  case: number;
  uv: number;
}

export interface ComboConfig {
  includes_mica: boolean;
  includes_case: boolean;
  includes_uv_print: boolean;
  prices: ComboPrices;
}

// --- 2. INTERFAZ DEL ESTADO DE SELECCIÓN ---
export interface SelectionState {
  brand: string | null;
  brandId: string | null;
  model: string | null;
  modelId: string | null;
  comboId: string;
  config: ComboConfig;
  micaId: string | null;
  micaImage: string | null;
  micaName: string | null;
  caseId: string | null;
  uvPrintId: string | null;
  mica_combo_content: string | null;
  case_combo_content: string | null;
  uv_print_combo_content: string | null;
  catalog_image_combo_content: string | null;
  caseImage: string | null;
  caseName: string | null;
  caseColor: string | null;
  caseTypeId: string | null;
  colourId: string | null;
  colourHex: string | null;
  availableColors: AvailableColor[];
  capturedBrandPreview: string | null;
  capturedCustomPreview: string | null;
  brandTransform: EditorTransform | null;
  customTransform: EditorTransform | null;
  
  // Nuevos campos de cámara (persisten como string)
  brandCameraStyle: CameraCutoutStyle;
  customCameraStyle: CameraCutoutStyle;

  imageSourceType: ImageSourceType;
  catalogId: string | null;
  catalog_image: string | null;
  selectedBrandTag: string | null;
  imageBrandConfig: ImageConfig;
  imageBrandPrice: number;
  orderCustomImage: string | null;
  imageCustomUrl: string | null;
  imageCustomConfig: ImageConfig;
  imageCustomPrice: number;
  acceptedTerms: boolean;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  orderId: string | null;
  orderNumber: string | null;
  orderSku: string | null;
  orderPrice: number | null;
}

// Configuración de almacenamiento persistente
const storage = createJSONStorage<any>(() =>
  typeof window !== "undefined" ? localStorage : ({} as Storage)
);

// --- 3. ESTADO INICIAL ---
export const initialSelection: SelectionState = {
  brand: null,
  brandId: null,
  model: null,
  modelId: null,
  comboId: "",
  config: {
    includes_mica: false,
    includes_case: false,
    includes_uv_print: false,
    prices: {
      micaDefault: 0,
      mica: 0,
      case: 0,
      uv: 0,
    },
  },
  micaId: null,
  micaImage: null,
  micaName: null,
  caseId: null,
  caseImage: null,
  uvPrintId: null,
  mica_combo_content: null,
  case_combo_content: null,
  uv_print_combo_content: null,
  catalog_image_combo_content: null,
  caseName: null,
  caseColor: null,
  colourHex: null,
  caseTypeId: null,
  colourId: null,
  availableColors: [],
  imageSourceType: null,
  orderCustomImage: null,
  catalogId: null,
  catalog_image: null,
  selectedBrandTag: null,
  capturedBrandPreview: null,
  capturedCustomPreview: null,
  brandTransform: null,
  customTransform: null,

  // Inicialización de estilos de cámara por defecto
  brandCameraStyle: "square-left",
  customCameraStyle: "square-left",

  imageBrandConfig: { rotation: 0, size: "Grande" },
  imageBrandPrice: 0,
  acceptedTerms: false,
  imageCustomUrl: null,
  imageCustomConfig: { rotation: 0, size: "Grande" },
  imageCustomPrice: 0,
  contact: { name: "", email: "", phone: "" },
  orderId: null,
  orderNumber: null,
  orderSku: null,
  orderPrice: null,
};

// --- 4. ÁTOMOS PERSISTENTES ---
export const selectionAtom = atomWithStorage<SelectionState>(
  "telcel_selection",
  initialSelection,
  storage
);

export const currentStepAtom = atomWithStorage<StepType>(
  "telcel_step",
  "onboarding",
  storage
);

export const missingBrandsAtom = atomWithStorage<string[]>(
  "no-results-brand",
  [],
  storage
);

export const missingModelsAtom = atomWithStorage<MissingModelEntry[]>(
  "no-results-model",
  [],
  storage
);

export const storeCodeAtom = atomWithStorage<string | null>(
  "store_code",
  null,
  storage
);

// --- 5. ÁTOMOS DE UI ---
export const activeImageTabAtom = atom<"brand" | "custom">("brand");

// --- 6. ÁTOMOS DERIVADOS ---
export const stepsPathAtom = atom((get) => {
  const selection = get(selectionAtom);
  const steps: StepType[] = ["onboarding", "phone-selector", "combo-selector"];

  if (selection.config) {
    if (selection.config.includes_mica) steps.push("mica-selector");
    if (selection.config.includes_case) steps.push("case-selector");
    if (selection.config.includes_uv_print) steps.push("image-selector");
  }

  steps.push("contact-form", "final-summary", "payment");
  return steps;
});

export const stepProgressAtom = atom((get) => {
  const steps = get(stepsPathAtom);
  const currentStep = get(currentStepAtom);
  const currentIndex = steps.indexOf(currentStep);

  let visualStep = 1;
  if (currentStep === "phone-selector") visualStep = 1;
  else if (currentStep === "combo-selector") visualStep = 2;
  else if (["mica-selector", "case-selector", "image-selector"].includes(currentStep))
    visualStep = 3;
  else if (["contact-form", "final-summary", "payment"].includes(currentStep))
    visualStep = 4;

  return {
    current: visualStep,
    total: 4,
    currentIndex,
    previous: (currentIndex > 0 ? steps[currentIndex - 1] : "onboarding") as StepType,
    next: (currentIndex < steps.length - 1 ? steps[currentIndex + 1] : "payment") as StepType,
  };
});

export const totalSelectionPriceAtom = atom((get) => {
  const s = get(selectionAtom);
  if (!s.brandId || !s.modelId) return 0;

  const pMica = Number(s.config?.prices?.mica || 0);
  const pCase = Number(s.config?.prices?.case || 0);
  const pUv = Number(s.config?.prices?.uv || 0);
  const pCustomExtra = s.imageSourceType === "custom" ? Number(s.imageCustomPrice || 0) : 0;

  return Math.round(pMica + pCase + pUv + pCustomExtra);
});