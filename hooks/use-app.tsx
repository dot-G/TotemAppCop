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
  storeCodeAtom // Importamos el nuevo átomo
} from '@/lib/store'

export function useApp() {
  const [isMounted, setIsMounted] = useState(false)
  
  // --- Suscripciones a los Átomos ---
  const selection = useAtomValue(selectionAtom)
  const currentStep = useAtomValue(currentStepAtom)
  const progress = useAtomValue(stepProgressAtom)
  const stepsPath = useAtomValue(stepsPathAtom)
  const totalSelectionPrice = useAtomValue(totalSelectionPriceAtom)
  
  // Átomos con lectura y escritura (useAtom)
  const [activeImageTab, setActiveImageTab] = useAtom(activeImageTabAtom)
  const [storeCode, setStoreCode] = useAtom(storeCodeAtom)
  
  // Setters puros
  const setStep = useSetAtom(currentStepAtom)
  const setSelection = useSetAtom(selectionAtom)
  const setMissingBrands = useSetAtom(missingBrandsAtom)
  const setMissingModels = useSetAtom(missingModelsAtom)

  // --- Control de Hidratación para evitar errores de SSR ---
  useEffect(() => { 
    setIsMounted(true) 
  }, [])

  /**
   * updateSelection: Merge simple y directo para el estado de selección.
   */
  const updateSelection = useCallback((data: Partial<SelectionState>) => {
    setSelection((prev) => ({
      ...prev,
      ...data
    }));
  }, [setSelection]);

  // --- Navegación ---
  const nextStep = () => { 
    if (progress.next) setStep(progress.next) 
  }

  const prevStep = () => { 
    if (progress.previous) setStep(progress.previous) 
  }

  /**
   * resetApp: Limpia todo el estado de la aplicación y el almacenamiento local.
   */
  const resetApp = () => {
    setSelection(initialSelection)
    setStep('onboarding')
    setMissingBrands([])
    setMissingModels([])
    //setStoreCode(null) // Limpiamos el código de tienda al resetear
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('telcel_selection')
      localStorage.removeItem('telcel_step')
      localStorage.removeItem('no-results-brand')
      localStorage.removeItem('no-results-model')
      localStorage.removeItem('telcel_store_code')
    }
  }

  return {
    // --- Estado Rehidratado ---
    selection: isMounted ? selection : initialSelection,
    currentStep: isMounted ? currentStep : 'onboarding',
    storeCode: isMounted ? storeCode : null, // Estado de la tienda
    totalSelectionPrice: isMounted ? totalSelectionPrice : 0,
    progress,
    stepsPath,
    activeImageTab,
    isHydrated: isMounted,
    
    // --- Acciones / Setters ---
    setStoreCode, // Para guardar el código que viene de la URL
    setActiveImageTab,
    setStep,
    nextStep,
    prevStep,
    updateSelection,
    resetApp,
    
    // Setters manuales de búsqueda
    setMissingBrands,
    setMissingModels,
  }
}