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
  title: 'Coppel | Personaliza tu Protector de Celular',
  description: 'Diseña la protección perfecta para tu equipo. Crea un protector único que combine estilo premium y seguridad total para tu smartphone.',
  icons: {
    icon: '/favicon.png',
  },
  // --- IMAGEN DESTACADA (OG Image) ---
  openGraph: {
    title: 'Coppel | Personaliza tu Protector de Celular',
    description: 'Diseña la protección perfecta para tu equipo.',
    //url: 'https://tu-dominio.com', // Reemplaza por tu URL real
    siteName: 'Coppel Personalización',
    images: [
      {
        url: '/case.jpg', // Ruta a la imagen en /public
        width: 1200,
        height: 630,
        alt: 'Personaliza tu Case',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coppel | Personaliza tu Protector de Celular',
    description: 'Diseña la protección perfecta para tu equipo.',
    images: ['/case.jpg'],
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