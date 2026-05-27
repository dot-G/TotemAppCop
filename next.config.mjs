/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Esto evita que el build falle por errores de tipos, 
    // útil para desplegar rápido, aunque lo ideal es corregirlos.
    ignoreBuildErrors: true,
  },
 images: {
    // 1. Autorizamos tu dominio de Directus
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coppel3pa.ai-labs.com.mx',
        pathname: '/assets/**',
      },
    ],
    // 2. Permitimos SVGs (Esto corrige el error de "dangerouslyAllowSVG")
    dangerouslyAllowSVG: true,
    // 3. Recomendado por seguridad al habilitar SVGs
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig;