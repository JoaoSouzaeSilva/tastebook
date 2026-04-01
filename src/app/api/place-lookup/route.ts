import { NextRequest } from 'next/server'

const PRICE_MAP: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '€',
  PRICE_LEVEL_MODERATE: '€€',
  PRICE_LEVEL_EXPENSIVE: '€€€',
  PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
}

const BROWSER_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

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
  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  return null
}

async function searchPlaces(
  query: string,
  apiKey: string,
  latLng?: { lat: number; lng: number } | null
) {
  const body: Record<string, unknown> = { textQuery: query }

  if (latLng) {
    body.locationBias = {
      circle: {
        center: { latitude: latLng.lat, longitude: latLng.lng },
        radius: 2000.0,
      },
    }
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.priceLevel,places.photos',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return data.places?.[0] ?? null
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

  // Resolve short URLs with a browser User-Agent so Google redirects fully
  if (/goo\.gl|maps\.app\.goo\.gl/.test(url)) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': BROWSER_UA },
      })
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

  // 1. Try with location bias (more accurate when we have coordinates)
  // 2. Fall back to global search if nothing found
  let place = await searchPlaces(placeName, apiKey, latLng)
  if (!place && latLng) {
    place = await searchPlaces(placeName, apiKey, null)
  }

  if (!place) {
    return Response.json({ error: `"${placeName}" not found on Google Maps` }, { status: 404 })
  }

  // Resolve photo to CDN URL — keeps API key server-side
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
