import React from "react"
import type { Metadata } from 'next'
// 1. Importar la fuente de Google
import { Source_Sans_3 } from 'next/font/google'

import './globals.css'

//import { Provider as JotaiProvider } from "jotai"
import QueryProvider from '@/providers/query-provider'


// 2. Configurar la fuente (Nota: Google la renombró a Source Sans 3, es la versión más actual)
const sourceSans = Source_Sans_3({ 
  subsets: ['latin'],
  variable: '--font-source-sans', // Opcional: para usar como variable CSS
})

export const metadata: Metadata = {
  title: 'Telcel | Personaliza tu Protector de Celular',
  description: 'Diseña la protección perfecta para tu equipo. Crea un protector único que combine estilo premium y seguridad total para tu smartphone.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      {/* 3. Aplicar la clase de la fuente al body */}
      <body className={`${sourceSans.className} antialiased`}>
      {/*<JotaiProvider> */}
      <QueryProvider>
        {children}
      </QueryProvider>
      {/*</JotaiProvider> */}
      </body>
    </html>
  )
}