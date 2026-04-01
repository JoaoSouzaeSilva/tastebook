import { NextRequest } from 'next/server'

const PRICE_MAP: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '€',
  PRICE_LEVEL_MODERATE: '€€',
  PRICE_LEVEL_EXPENSIVE: '€€€',
  PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
}

function extractPlaceName(url: string): string | null {
  const match = url.match(/\/maps\/place\/([^/@?#]+)/)
  if (match) return decodeURIComponent(match[1].replace(/\+/g, ' '))
  try {
    const u = new URL(url)
    return u.searchParams.get('q') || u.searchParams.get('query')
  } catch {
    return null
  }
}

function extractLatLng(url: string): { lat: number; lng: number } | null {
  // @lat,lng,zoom or @lat,lng,Xm
  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  return null
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

  // Resolve short URLs using GET so all redirect chains are followed
  if (/goo\.gl|maps\.app\.goo\.gl/.test(url)) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      url = res.url
    } catch {
      // keep original url and try anyway
    }
  }

  const placeName = extractPlaceName(url)
  if (!placeName) {
    return Response.json({ error: 'Could not extract a place name from the URL' }, { status: 400 })
  }

  const latLng = extractLatLng(url)

  // Places API (New) — Text Search with optional location bias
  const body: Record<string, unknown> = { textQuery: placeName }
  if (latLng) {
    body.locationBias = {
      circle: {
        center: { latitude: latLng.lat, longitude: latLng.lng },
        radius: 500.0,
      },
    }
  }

  const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.priceLevel,places.photos',
    },
    body: JSON.stringify(body),
  })

  const searchData = await searchRes.json()
  const place = searchData.places?.[0]
  if (!place) {
    return Response.json({ error: `Place "${placeName}" not found` }, { status: 404 })
  }

  // Resolve photo to a CDN URL — keeps API key server-side
  let photoUrl: string | undefined
  if (place.photos?.[0]?.name) {
    try {
      const photoRes = await fetch(
        `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=800&key=${apiKey}`,
        { redirect: 'follow' }
      )
      photoUrl = photoRes.url
    } catch {
      // photo is optional
    }
  }

  return Response.json({
    name: place.displayName?.text as string | undefined,
    address: place.formattedAddress as string | undefined,
    avg_price: place.priceLevel ? PRICE_MAP[place.priceLevel] : undefined,
    photo_url: photoUrl,
  })
}
