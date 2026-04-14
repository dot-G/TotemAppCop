import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // La interfaz Request nos permite obtener el JSON de la petición
    const { urls }: { urls: string[] } = await req.json()

    const results = await Promise.all(urls.map(async (url: string) => {
      try {
        const title = url.split("/wiki/").pop()
        if (!title) throw new Error("URL inválida")

        const wikiRes = await fetch(
          `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${title}&format=json&origin=*`
        )
        const data = await wikiRes.json()
        
        const pages = data.query.pages
        const pageId = Object.keys(pages)[0]
        const text: string = pages[pageId].extract || ""

        // SOLUCIÓN AL ERROR: Definimos 'w' como string
        const count = text
          .split(/\s+/)
          .filter((w: string) => w.length > 0).length

        return { url, count, error: false }
      } catch (e) {
        return { url, count: 0, error: true }
      }
    }))

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: "Error procesando Request" }, { status: 400 })
  }
}