type MapsLinkSource = {
  name: string
  address?: string
  google_maps_link?: string | null
  google_place_id?: string | null
}

/**
 * Canonical open-in-Google-Maps URL for a restaurant.
 *
 * Uses the official Maps URLs scheme (https://developers.google.com/maps/documentation/urls),
 * which opens the native app on iOS/Android with the place pinned. Preference order:
 * 1. Place ID — stable identifier, always lands on the exact place
 * 2. Stored link — whatever the user pasted
 * 3. Name + address search — guaranteed fallback so every restaurant is clickable
 */
export function getGoogleMapsUrl(restaurant: MapsLinkSource): string {
  if (restaurant.google_place_id) {
    const params = new URLSearchParams({
      api: '1',
      query: restaurant.name,
      query_place_id: restaurant.google_place_id,
    })
    return `https://www.google.com/maps/search/?${params}`
  }

  if (restaurant.google_maps_link) return restaurant.google_maps_link

  const params = new URLSearchParams({
    api: '1',
    query: [restaurant.name, restaurant.address].filter(Boolean).join(', '),
  })
  return `https://www.google.com/maps/search/?${params}`
}
