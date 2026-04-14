import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeleteConfirmProps {
  activeTab: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmModal({ activeTab, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center">
        <AlertCircle size={32} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-xl font-black text-slate-900 uppercase">¿Cambiar imagen?</h3>
        <p className="text-slate-500 text-sm mt-2">Se borrará el diseño de <b>{activeTab}</b>.</p>
        <div className="flex flex-col gap-2 mt-8">
          <Button onClick={onConfirm} className="w-full h-14 bg-amber-500 text-white rounded-2xl font-bold uppercase">Sí, cambiar</Button>
          <Button onClick={onCancel} variant="ghost" className="w-full h-14 text-slate-400 font-bold uppercase">Cancelar</Button>
        </div>
      </motion.div>
    </div>
  )
}