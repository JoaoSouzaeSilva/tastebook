// Backfill google_place_id (and missing google_maps_link) for existing restaurants
// by resolving each one against the Google Places API.
//
// Dry run (default — writes nothing, prints what would change):
//   node --env-file=.env.local scripts/backfill-place-ids.mjs
//
// Apply high-confidence matches:
//   node --env-file=.env.local scripts/backfill-place-ids.mjs --apply
//
// Requires SUPABASE_SERVICE_ROLE_KEY in the environment (RLS only allows
// authenticated users, so the anon key cannot update rows).

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY

if (!supabaseUrl) throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseServiceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
if (!mapsApiKey) throw new Error('Missing GOOGLE_MAPS_API_KEY')

const apply = process.argv.includes('--apply')

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const BROWSER_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

function extractPlaceName(url) {
  const match = url.match(/\/maps\/place\/([^/@?#]+)/)
  if (match) return decodeURIComponent(match[1].replace(/\+/g, ' '))
  try {
    const u = new URL(url)
    return u.searchParams.get('q') || u.searchParams.get('query')
  } catch {
    return null
  }
}

function extractLatLng(url) {
  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  return null
}

async function resolveShortUrl(url) {
  if (!/goo\.gl|maps\.app\.goo\.gl/.test(url)) return url
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': BROWSER_UA } })
    return res.url
  } catch {
    return url
  }
}

async function searchPlace(textQuery, latLng) {
  const body = { textQuery }
  if (latLng) {
    body.locationBias = {
      circle: { center: { latitude: latLng.lat, longitude: latLng.lng }, radius: 2000.0 },
    }
  }
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': mapsApiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.googleMapsUri',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Places API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.places?.[0] ?? null
}

function normalize(value) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Confident when one name contains the other, or most words of the stored name
// appear in the returned name (guards against the API returning a lookalike).
function namesMatch(stored, returned) {
  const a = normalize(stored)
  const b = normalize(returned)
  if (!a || !b) return false
  if (a.includes(b) || b.includes(a)) return true
  const wordsA = a.split(' ')
  const overlap = wordsA.filter((word) => b.includes(word)).length
  return overlap / wordsA.length >= 0.6
}

const { data: restaurants, error } = await supabase
  .from('restaurants')
  .select('id, name, address, google_maps_link, google_place_id')
  .order('created_at', { ascending: true })

if (error) throw error

const pending = restaurants.filter((r) => !r.google_place_id)
console.log(`${restaurants.length} restaurants total, ${pending.length} missing a place ID.`)
console.log(apply ? 'Mode: APPLY — matches will be written.\n' : 'Mode: DRY RUN — nothing will be written. Re-run with --apply to save.\n')

let updated = 0
let lowConfidence = 0
let notFound = 0

for (const restaurant of pending) {
  let query = [restaurant.name, restaurant.address].filter(Boolean).join(', ')
  let latLng = null

  if (restaurant.google_maps_link) {
    const fullUrl = await resolveShortUrl(restaurant.google_maps_link)
    latLng = extractLatLng(fullUrl)
    const linkName = extractPlaceName(fullUrl)
    if (linkName) query = linkName
  }

  let place
  try {
    place = await searchPlace(query, latLng)
    if (!place && latLng) place = await searchPlace(query, null)
  } catch (err) {
    console.log(`✗ ${restaurant.name} — lookup failed: ${err.message}`)
    notFound++
    continue
  }

  if (!place) {
    console.log(`✗ ${restaurant.name} — no result for "${query}"`)
    notFound++
    continue
  }

  const returnedName = place.displayName?.text ?? ''
  const confident = namesMatch(restaurant.name, returnedName)

  if (!confident) {
    console.log(`? ${restaurant.name} — low confidence, skipped (API returned "${returnedName}", ${place.formattedAddress ?? 'no address'})`)
    lowConfidence++
    continue
  }

  console.log(`✓ ${restaurant.name} → ${returnedName} (${place.id})`)

  if (apply) {
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        google_place_id: place.id,
        // Only fill the link when empty — the place ID takes precedence in the app anyway
        ...(restaurant.google_maps_link ? {} : { google_maps_link: place.googleMapsUri ?? null }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', restaurant.id)

    if (updateError) {
      console.log(`  ! update failed: ${updateError.message}`)
      continue
    }
  }
  updated++

  // Stay well under the Places API rate limit
  await new Promise((resolve) => setTimeout(resolve, 150))
}

console.log(`\n${apply ? 'Updated' : 'Would update'}: ${updated} · Low confidence (skipped): ${lowConfidence} · Not found/failed: ${notFound}`)
if (!apply && updated > 0) console.log('Re-run with --apply to write these changes.')
if (lowConfidence > 0) console.log('Low-confidence ones are safest fixed by opening the restaurant in the app and pressing “✦ Fill”.')
