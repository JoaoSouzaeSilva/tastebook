'use client'

import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Restaurant } from '@/types'
import type { LatLng } from '@/lib/geo'

interface MapViewProps {
  restaurants: Restaurant[]
  userLocation: LatLng | null
  locationError: string | null
  onRequestLocation: () => void
  onOpenRestaurant: (id: string) => void
}

const FALLBACK_CENTER: L.LatLngExpression = [38.7223, -9.1393] // Lisbon

function pinIcon(color: string, favorite: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:9px;line-height:1;color:#fff">${favorite ? '★' : ''}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.25)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export function MapView({ restaurants, userLocation, locationError, onRequestLocation, onOpenRestaurant }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const didFitRef = useRef(false)

  const located = useMemo(
    () => restaurants.filter((r) => r.latitude != null && r.longitude != null),
    [restaurants]
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { zoomControl: false })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: 'map-tiles',
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.setView(FALLBACK_CENTER, 12)
    markersRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // The container mounts inside an animating layout — recalc once it settles
    const settle = setTimeout(() => map.invalidateSize(), 80)

    return () => {
      clearTimeout(settle)
      map.remove()
      mapRef.current = null
      markersRef.current = null
      userMarkerRef.current = null
      didFitRef.current = false
    }
  }, [])

  // Sync restaurant pins
  useEffect(() => {
    const map = mapRef.current
    const layer = markersRef.current
    if (!map || !layer) return

    layer.clearLayers()
    for (const restaurant of located) {
      const tried = restaurant.status === 'tried'
      const color = tried ? 'var(--accent-secondary)' : 'var(--accent-primary)'
      L.marker([restaurant.latitude!, restaurant.longitude!], {
        icon: pinIcon(color, restaurant.is_favorite),
      })
        .bindTooltip(restaurant.name, { direction: 'top', offset: [0, -10] })
        .on('click', () => onOpenRestaurant(restaurant.id))
        .addTo(layer)
    }

    if (!didFitRef.current && located.length > 0) {
      didFitRef.current = true
      const bounds = L.latLngBounds(located.map((r) => [r.latitude!, r.longitude!] as [number, number]))
      if (userLocation) bounds.extend([userLocation.lat, userLocation.lng])
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 })
    }
  }, [located, userLocation, onOpenRestaurant])

  // Sync the user-position dot
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }
    if (userLocation) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        interactive: false,
        zIndexOffset: 500,
      }).addTo(map)
    }
  }, [userLocation])

  function handleLocate() {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 14)
    } else {
      onRequestLocation()
    }
  }

  // Pan to the user the first time their position arrives
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 14)
    }
  }, [userLocation])

  return (
    // isolation traps Leaflet's internal z-indexes (up to 1000) so overlaying
    // sheets (z-index 120) still render above the map
    <div style={{ position: 'relative', isolation: 'isolate', zIndex: 0 }}>
      <div
        ref={containerRef}
        style={{
          height: 'calc(100svh - 350px)',
          minHeight: 340,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      />

      <button
        onClick={handleLocate}
        aria-label="Show my location"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 800,
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-surface)',
          color: userLocation ? '#2563EB' : 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 4px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-secondary)', display: 'inline-block' }} /> Tried
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }} /> Want to try
        </span>
        {located.length < restaurants.length && (
          <span style={{ color: 'var(--text-muted)' }}>
            {restaurants.length - located.length} without a location yet
          </span>
        )}
      </div>
      {locationError && (
        <p style={{ padding: '6px 4px 0', fontSize: 12, color: '#DC2626' }}>{locationError}</p>
      )}
    </div>
  )
}
