import React from "react"
import type { Metadata } from 'next'
import { Source_Sans_3 } from 'next/font/google'

import './globals.css'

import QueryProvider from '@/providers/query-provider'

const sourceSans = Source_Sans_3({ 
  subsets: ['latin'],
  variable: '--font-source-sans',
})

export const metadata: Metadata = {
  title: 'Telcel | Personaliza tu Protector de Celular',
  description: 'Diseña la protección perfecta para tu equipo. Crea un protector único que combine estilo premium y seguridad total para tu smartphone.',
  // Opción A: Definición explícita en metadatos
  icons: {
    icon: '/favicon.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${sourceSans.className} antialiased`}>
      <QueryProvider>
        {children}
      </QueryProvider>
      </body>
    </html>
  )
}