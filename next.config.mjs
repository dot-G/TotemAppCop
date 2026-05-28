/** @type {import('next').NextConfig} */

// 1. Extraemos el host de la variable de entorno
// Ejemplo: "https://admin3pa.ai-labs.com.mx" -> "admin3pa.ai-labs.com.mx"
const apiHost = process.env.NEXT_PUBLIC_API_URL 
  ? new URL(process.env.NEXT_PUBLIC_API_URL).hostname 
  : 'admin3pa.ai-labs.com.mx'; // Un fallback por si la variable no está definida

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: apiHost, // <--- Usamos la variable dinámica aquí
        pathname: '/assets/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig;