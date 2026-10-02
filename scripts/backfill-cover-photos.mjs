// Re-fetch every restaurant's cover photo from Google Places and store a copy in
// Supabase Storage (restaurant-review-photos/covers/), then point photo_url at it.
//
// Why: place-lookup used to save the googleusercontent URL the Places photo endpoint
// redirects to. Those URLs expire, so older covers had started to go blank. Copies
// in our own bucket don't.
//
// Dry run (default — writes nothing, reports which covers are broken and what would change):
//   node --env-file=.env.local scripts/backfill-cover-photos.mjs
//
// Apply:
//   node --env-file=.env.local scripts/backfill-cover-photos.mjs --apply
//
// Rows whose photo_url already points at our Storage are skipped, so it is safe to
// re-run. Requires SUPABASE_SERVICE_ROLE_KEY (RLS only lets signed-in users write)
// and GOOGLE_MAPS_API_KEY. Cost: one Place Details (photos field) + one photo
// request per restaurant.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY

if (!supabaseUrl) throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseServiceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
if (!mapsApiKey) throw new Error('Missing GOOGLE_MAPS_API_KEY')

const apply = process.argv.includes('--apply')
const BUCKET = 'restaurant-review-photos'
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const storagePrefix = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/`

async function isAlive(url) {
  if (!url) return false
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
    return res.ok || res.status === 206
  } catch {
    return false
  }
}

async function firstPhotoName(placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': mapsApiKey, 'X-Goog-FieldMask': 'photos' },
  })
  if (!res.ok) throw new Error(`Place Details ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data.photos?.[0]?.name ?? null
}

async function copyPhoto(photoName, placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${mapsApiKey}`, {
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Photo media ${res.status}`)
  const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim()
  const extension = EXTENSIONS[contentType]
  if (!extension) throw new Error(`Unexpected content type ${contentType}`)

  const path = `covers/${placeId}-${Date.now()}.${extension}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, await res.arrayBuffer(), { contentType, cacheControl: '31536000', upsert: false })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

const { data: rows, error } = await supabase
  .from('restaurants')
  .select('id, name, google_place_id, photo_url')
  .order('created_at', { ascending: true })
if (error) throw error

const todo = rows.filter((r) => r.google_place_id && !(r.photo_url ?? '').startsWith(storagePrefix))
const skippedNoPlace = rows.filter((r) => !r.google_place_id).length
console.log(`${rows.length} restaurants · ${todo.length} to copy · ${rows.length - todo.length - skippedNoPlace} already in Storage · ${skippedNoPlace} without a Google place ID`)
if (!apply) console.log('Dry run — pass --apply to write.\n')

let copied = 0
let failed = 0
for (const row of todo) {
  const alive = await isAlive(row.photo_url)
  const state = row.photo_url ? (alive ? 'working' : 'BROKEN') : 'none'
  if (!apply) {
    console.log(`would copy  ${row.name}  (current photo: ${state})`)
    continue
  }
  try {
    const photoName = await firstPhotoName(row.google_place_id)
    if (!photoName) {
      console.log(`no photo    ${row.name}`)
      continue
    }
    const url = await copyPhoto(photoName, row.google_place_id)
    const { error: updateError } = await supabase.from('restaurants').update({ photo_url: url }).eq('id', row.id)
    if (updateError) throw updateError
    copied++
    console.log(`copied      ${row.name}  (was: ${state})`)
  } catch (e) {
    failed++
    console.log(`FAILED      ${row.name}: ${e instanceof Error ? e.message : e}`)
  }
}

if (apply) console.log(`\nDone: ${copied} copied, ${failed} failed.`)
