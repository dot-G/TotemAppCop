// app/api/image/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN; // Variable privada (sin NEXT_PUBLIC)

  if (!id) {
    return NextResponse.json({ error: "ID de asset requerido" }, { status: 400 });
  }

  // Reenviamos todos los parámetros (width, height, quality, fit, etc.) a Directus
  const queryString = searchParams.toString();
  const directusUrl = `${API_URL}/assets/${id}${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(directusUrl, {
      headers: {
        'Authorization': `Bearer ${STATIC_TOKEN}`,
      },
      // Importante: Next.js puede cachear la respuesta del fetch a nivel de servidor
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    // Usamos el body directamente como stream para alta eficiencia
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/png',
        // Cache-Control para el navegador y el CDN (1 año)
        'Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error("Error en Image Proxy:", error);
    return new NextResponse(null, { status: 500 });
  }
}