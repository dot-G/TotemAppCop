"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // En un kiosco, queremos que los datos sean "frescos" por mucho tiempo
        staleTime: 1000 * 60 * 60, // 1 hora
        gcTime: 1000 * 60 * 60 * 24, // Mantener en memoria 24 horas
        retry: 3, // Reintentar si falla el internet del kiosco
        refetchOnWindowFocus: false, // Evitar recargas molestas al tocar la pantalla
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}