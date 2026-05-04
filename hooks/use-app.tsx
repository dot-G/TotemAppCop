"use client"

import { useAtomValue, useSetAtom, useAtom } from 'jotai'
import { useEffect, useState, useCallback } from 'react'
import { 
  selectionAtom, 
  currentStepAtom, 
  stepProgressAtom, 
  stepsPathAtom, 
  initialSelection, 
  SelectionState,
  missingBrandsAtom,
  missingModelsAtom,
  activeImageTabAtom,
  totalSelectionPriceAtom,
  storeCodeAtom,
  // IMPORTANTE: Importamos el tipo para tipar el retorno
  StepType 
} from '@/lib/store'

// Definimos la interfaz del progreso para que TS no infiera "string"
interface StepProgress {
  current: number;
  total: number;
  currentIndex: number;
  previous: StepType;
  next: StepType;
}

export function useApp() {
  const [isMounted, setIsMounted] = useState(false)
  
  const selection = useAtomValue(selectionAtom)
  const currentStep = useAtomValue(currentStepAtom)
  // Forzamos el tipo aquí al leer el átomo
  const progress = useAtomValue(stepProgressAtom) as StepProgress
  const stepsPath = useAtomValue(stepsPathAtom)
  const totalSelectionPrice = useAtomValue(totalSelectionPriceAtom)
  
  const [activeImageTab, setActiveImageTab] = useAtom(activeImageTabAtom)
  const [storeCode, setStoreCode] = useAtom(storeCodeAtom)
  
  const setStep = useSetAtom(currentStepAtom)
  const setSelection = useSetAtom(selectionAtom)
  const setMissingBrands = useSetAtom(missingBrandsAtom)
  const setMissingModels = useSetAtom(missingModelsAtom)

  useEffect(() => { 
    setIsMounted(true) 
  }, [])

  const updateSelection = useCallback((data: Partial<SelectionState>) => {
    setSelection((prev) => ({ ...prev, ...data }));
  }, [setSelection]);

  const nextStep = useCallback(() => { 
    if (progress?.next) setStep(progress.next) 
  }, [progress, setStep])

  const prevStep = useCallback(() => { 
    if (progress?.previous) setStep(progress.previous) 
  }, [progress, setStep])

  const resetApp = useCallback(() => {
    setSelection(initialSelection)
    setStep('onboarding')
    setMissingBrands([])
    setMissingModels([])
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('telcel_selection')
      localStorage.removeItem('telcel_step')
      localStorage.removeItem('no-results-brand')
      localStorage.removeItem('no-results-model')
      localStorage.removeItem('store_code')
    }
  }, [setSelection, setStep, setMissingBrands, setMissingModels])

  return {
    selection: isMounted ? selection : initialSelection,
    currentStep: isMounted ? currentStep : 'onboarding',
    storeCode: isMounted ? storeCode : null,
    totalSelectionPrice: isMounted ? totalSelectionPrice : 0,
    // Aquí también aseguramos el tipo en el estado de carga inicial
    progress: isMounted ? progress : { 
      current: 1, 
      total: 4, 
      currentIndex: 0, 
      previous: 'onboarding' as StepType, 
      next: 'phone-selector' as StepType 
    },
    stepsPath,
    activeImageTab,
    isHydrated: isMounted,
    
    setStoreCode, 
    setActiveImageTab,
    setStep,
    nextStep,
    prevStep,
    updateSelection,
    resetApp,
    setMissingBrands,
    setMissingModels,
  }
}