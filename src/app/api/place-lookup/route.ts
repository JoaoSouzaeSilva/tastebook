import { NextRequest } from 'next/server'

const PRICE_MAP: Record<number, string> = { 1: '€', 2: '€€', 3: '€€€', 4: '€€€€' }

function extractPlaceName(url: string): string | null {
  // /maps/place/NAME/@... or /maps/place/NAME/...
  const match = url.match(/\/maps\/place\/([^/@?#]+)/)
  if (match) return decodeURIComponent(match[1].replace(/\+/g, ' '))

  // ?q=NAME or ?query=NAME
  try {
    const u = new URL(url)
    return u.searchParams.get('q') || u.searchParams.get('query')
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  let { url } = (await request.json()) as { url: string }
  if (!url?.trim()) {
    return Response.json({ error: 'URL is required' }, { status: 400 })
  }

  // Resolve short URLs (goo.gl/maps or maps.app.goo.gl)
  if (/goo\.gl|maps\.app\.goo\.gl/.test(url)) {
    try {
      const res = await fetch(url, { redirect: 'follow', method: 'HEAD' })
      url = res.url
    } catch {
      // keep original url and try anyway
    }
  }

  const placeName = extractPlaceName(url)
  if (!placeName) {
    return Response.json({ error: 'Could not extract a place name from the URL' }, { status: 400 })
  }

  // Find place ID
  const findRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(placeName)}&inputtype=textquery&fields=place_id&key=${apiKey}`
  )
  const findData = await findRes.json()
  const placeId = findData.candidates?.[0]?.place_id
  if (!placeId) {
    return Response.json({ error: `Place "${placeName}" not found` }, { status: 404 })
  }

  // Get place details
  const detailsRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,price_level,photos&key=${apiKey}`
  )
  const detailsData = await detailsRes.json()
  const d = detailsData.result

  if (!d) {
    return Response.json({ error: 'Failed to fetch place details' }, { status: 502 })
  }

  // Follow the Places photo redirect to get a stable CDN URL — keeps the API key server-side
  let photoUrl: string | undefined
  if (d.photos?.[0]?.photo_reference) {
    try {
      const photoRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${d.photos[0].photo_reference}&key=${apiKey}`,
        { redirect: 'follow' }
      )
      photoUrl = photoRes.url
    } catch {
      // photo is optional
    }
  }

  return Response.json({
    name: d.name as string | undefined,
    address: d.formatted_address as string | undefined,
    avg_price: d.price_level != null ? PRICE_MAP[d.price_level as number] : undefined,
    photo_url: photoUrl,
  })
}
