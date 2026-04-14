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
  title: 'CaseShop - Fundas Premium para tu Smartphone',
  description: 'Descubre las mejores fundas para tu smartphone con diseños exclusivos y protección premium. Envío gratis en compras mayores a $500 MXN.',
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