import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cover photos live in the same public bucket as visit photos, under covers/.
const PHOTOS_BUCKET = 'restaurant-review-photos'
const COVER_CONTENT_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

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

type LookupRequest = {
  url?: string
  query?: string
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
        'places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.location,places.priceLevel,places.photos,places.primaryType,places.types',
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

  let { url, query } = (await request.json()) as LookupRequest
  url = url?.trim()
  query = query?.trim()

  if (!url && !query) {
    return Response.json({ error: 'A Google Maps URL or place name is required' }, { status: 400 })
  }

  // Resolve short URLs with a browser User-Agent so Google redirects fully
  if (url && /goo\.gl|maps\.app\.goo\.gl/.test(url)) {
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

  const placeName = url ? extractPlaceName(url) ?? query ?? null : query ?? null
  if (!placeName) {
    return Response.json({ error: 'Could not extract a place name from the URL' }, { status: 400 })
  }

  const latLng = url ? extractLatLng(url) : null

  // 1. Try with location bias (more accurate when we have coordinates)
  // 2. Fall back to global search if nothing found
  let place = await searchPlaces(placeName, apiKey, latLng)
  if (!place && latLng) {
    place = await searchPlaces(placeName, apiKey, null)
  }

  if (!place) {
    return Response.json({ error: `"${placeName}" not found on Google Maps` }, { status: 404 })
  }

  // Copy the photo into our own Storage. The googleusercontent URL the media
  // endpoint redirects to expires after a while, which is how most of the older
  // covers went blank. The API key stays server-side either way.
  let photoUrl: string | undefined
  if (place.photos?.[0]?.name) {
    try {
      photoUrl = await persistCoverPhoto(place.photos[0].name as string, place.id as string, apiKey)
    } catch {
      // photo is optional
    }
  }

  return Response.json({
    name: place.displayName?.text as string | undefined,
    address: place.formattedAddress as string | undefined,
    place_id: place.id as string | undefined,
    google_maps_link: place.googleMapsUri as string | undefined,
    latitude: place.location?.latitude as number | undefined,
    longitude: place.location?.longitude as number | undefined,
    avg_price: place.priceLevel ? PRICE_MAP[place.priceLevel] : undefined,
    photo_url: photoUrl,
    primary_type: place.primaryType as string | undefined,
    types: Array.isArray(place.types) ? place.types : undefined,
  })
}

async function persistCoverPhoto(photoName: string, placeId: string, apiKey: string): Promise<string | undefined> {
  const photoRes = await fetch(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${apiKey}`, {
    redirect: 'follow',
  })
  if (!photoRes.ok) return undefined

  const contentType = (photoRes.headers.get('content-type') ?? '').split(';')[0].trim()
  const extension = COVER_CONTENT_TYPES[contentType]
  // Unexpected format: fall back to the (temporary) CDN URL rather than nothing
  if (!extension) return photoRes.url

  const supabase = await createClient()
  const path = `covers/${placeId}-${Date.now()}.${extension}`
  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, await photoRes.arrayBuffer(), { contentType, cacheControl: '31536000', upsert: false })
  if (error) return photoRes.url

  return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl
}
