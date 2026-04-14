"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, FileText, Trash2, Zap } from "lucide-react"

export default function WikiCounter() {
  // URLs precargadas en el estado inicial
  const [urls, setUrls] = useState<string[]>([
    "https://es.wikipedia.org/wiki/Solifugae",
    "https://es.wikipedia.org/wiki/Cultura_de_Ghana",
    "https://es.wikipedia.org/wiki/Dua_Lipa",
    "https://es.wikipedia.org/wiki/Tratado_de_Par%C3%ADs_(1898)",
    "https://es.wikipedia.org/wiki/Estadio_Monumental_de_Matur%C3%ADn"
  ])
  
  const [results, setResults] = useState<{url: string, count: number, error?: boolean}[]>([])
  const [loading, setLoading] = useState(false)

  const countWords = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/count-wiki", {
        method: "POST",
        body: JSON.stringify({ urls: urls.filter(u => u.trim() !== "") }),
        headers: { "Content-Type": "application/json" }
      })
      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const clearAll = () => {
    setUrls(["", "", "", "", ""])
    setResults([])
  }

  return (
    <div className="max-w-md mx-auto p-4 font-sans min-h-screen flex flex-col justify-center bg-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
          <Zap size={18} className="text-[#6b21a8]" /> Wiki Word Stats
        </h1>
        <button onClick={clearAll} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid gap-2 mb-4">
        {urls.map((url, i) => (
          <div key={i} className="relative group">
            <Input 
              placeholder={`URL de Wikipedia ${i + 1}`}
              value={url}
              onChange={(e) => {
                const n = [...urls]; n[i] = e.target.value; setUrls(n)
              }}
              className="h-10 rounded-lg text-[11px] pr-8 border-slate-200 focus:ring-[#6b21a8]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">
              {i + 1}
            </div>
          </div>
        ))}
      </div>

      <Button 
        onClick={countWords} 
        disabled={loading}
        className="w-full h-12 rounded-xl bg-[#6b21a8] hover:bg-[#581c87] text-white font-bold uppercase text-xs shadow-lg shadow-purple-100"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Analizar Contenido"}
      </Button>

      <div className="mt-6 space-y-2">
        {results.map((res, i) => (
          <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col overflow-hidden pr-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Artículo</span>
              <span className="text-[11px] text-slate-600 truncate max-w-[180px] font-medium">
                {res.url.split('/').pop()?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-lg font-black leading-none ${res.error ? 'text-red-500' : 'text-slate-900'}`}>
                {res.error ? "!!" : res.count.toLocaleString()}
              </span>
              <p className="text-[8px] uppercase font-bold text-slate-400">Palabras</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}