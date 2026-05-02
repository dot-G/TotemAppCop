import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const { imageUrl, transform, caseColor, width } = await req.json();

    // 1. Dimensiones base (proporción 1.85 de tu componente)
    const OUTPUT_WIDTH = 1200; 
    const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH * 1.85);
    
    // El área de impresión en tu SVG tiene un padding de 2.5%
    const printAreaWidth = OUTPUT_WIDTH - (OUTPUT_WIDTH * 0.025 * 2);

    // 2. Traer la imagen original
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error("No se pudo obtener la imagen");
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // 3. Procesar la imagen del usuario
    // Aplicamos el factor 1.2 de tu componente para el escalado base
    const userImgScaledWidth = Math.round(printAreaWidth * 1.2 * transform.scale);

    // Rotación y redimensionado inicial
    const processedUserImg = await sharp(imageBuffer)
      .rotate(transform.rotation)
      .resize({ width: userImgScaledWidth })
      .toBuffer();

    // 4. Composición Final
    // Calculamos el offset proporcional al nuevo tamaño (OUTPUT_WIDTH / width del cliente)
    const ratio = OUTPUT_WIDTH / width;
    const offsetX = transform.x * ratio;
    const offsetY = transform.y * ratio;

    const finalImageBuffer = await sharp({
      create: {
        width: OUTPUT_WIDTH,
        height: OUTPUT_HEIGHT,
        channels: 4,
        background: caseColor,
      },
    })
      .composite([
        {
          input: processedUserImg,
          // Centrado absoluto + el offset del usuario
          top: Math.round((OUTPUT_HEIGHT / 2) - (userImgScaledWidth / 2) + offsetY),
          left: Math.round((OUTPUT_WIDTH / 2) - (userImgScaledWidth / 2) + offsetX),
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    // 5. Retorno compatible con Safari y Web APIs
    const responseBody = new Uint8Array(finalImageBuffer);

    return new NextResponse(responseBody, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": responseBody.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error en Sharp API:", error);
    return NextResponse.json({ error: "Error procesando imagen" }, { status: 500 });
  }
}