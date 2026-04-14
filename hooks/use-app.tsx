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
  totalSelectionPriceAtom 
} from '@/lib/store'

export function useApp() {
  const [isMounted, setIsMounted] = useState(false)
  
  // Suscripciones a los Átomos
  const selection = useAtomValue(selectionAtom)
  const currentStep = useAtomValue(currentStepAtom)
  const progress = useAtomValue(stepProgressAtom)
  const stepsPath = useAtomValue(stepsPathAtom)
  const totalSelectionPrice = useAtomValue(totalSelectionPriceAtom)
  const [activeImageTab, setActiveImageTab] = useAtom(activeImageTabAtom)
  
  // Setters
  const setStep = useSetAtom(currentStepAtom)
  const setSelection = useSetAtom(selectionAtom)
  const setMissingBrands = useSetAtom(missingBrandsAtom)
  const setMissingModels = useSetAtom(missingModelsAtom)

  // Control de Hidratación para evitar errores de SSR
  useEffect(() => { 
    setIsMounted(true) 
  }, [])

  /**
   * updateSelection: Merge simple y directo.
   * Eliminamos la lógica interna de precios para que no pise valores con 0.
   * Recuerda hacer el spread de config en el componente:
   * updateSelection({ config: { ...selection.config, prices: { ... } } })
   */
  const updateSelection = useCallback((data: Partial<SelectionState>) => {
    setSelection((prev) => ({
      ...prev,
      ...data
    }));
  }, [setSelection]);

  const nextStep = () => { 
    if (progress.next) setStep(progress.next) 
  }

  const prevStep = () => { 
    if (progress.previous) setStep(progress.previous) 
  }

  const resetApp = () => {
    setSelection(initialSelection)
    setStep('onboarding')
    setMissingBrands([])
    setMissingModels([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('telcel_selection')
      localStorage.removeItem('telcel_step')
    }
  }

  return {
    // Estado
    selection: isMounted ? selection : initialSelection,
    currentStep: isMounted ? currentStep : 'onboarding',
    totalSelectionPrice: isMounted ? totalSelectionPrice : 0,
    progress,
    stepsPath, // Necesario para el StepIndicator
    activeImageTab,
    isHydrated: isMounted,
    
    // Acciones
    setActiveImageTab,
    setStep,
    nextStep,
    prevStep,
    updateSelection,
    resetApp,
    // Setters manuales por si los necesitas en algún log
    setMissingBrands,
    setMissingModels,
  }
}