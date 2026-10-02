'use client'

import { useMemo, useState } from 'react'
import type { Restaurant } from '@/types'
import { withAlpha } from '@/lib/colors'

interface PlacePhotoProps {
  restaurant: Restaurant
  /** CSS aspect-ratio, e.g. "4 / 5" */
  ratio?: string
  radius?: number | string
  /** Load immediately instead of lazily — for the first screenful */
  priority?: boolean
  children?: React.ReactNode
  style?: React.CSSProperties
}

/**
 * The place's cover photo, falling back to one of our own visit photos, then to a
 * warm tile in the place's category colour. Space is reserved by aspect-ratio so
 * the list never jumps while images arrive, and an expired URL degrades quietly.
 */
export function PlacePhoto({ restaurant, ratio = '4 / 5', radius = 'var(--radius-lg)', priority = false, children, style }: PlacePhotoProps) {
  const sources = useMemo(
    () =>
      [restaurant.photo_url, ...(restaurant.review_photos ?? []).map((photo) => photo.image_url)].filter(
        (src): src is string => Boolean(src)
      ),
    [restaurant.photo_url, restaurant.review_photos]
  )
  // Keyed by URL rather than index, so new data never needs an effect to reset state
  const [failed, setFailed] = useState<string[]>([])
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)

  const src = sources.find((candidate) => !failed.includes(candidate))
  const loaded = src !== undefined && loadedSrc === src
  const category = restaurant.categories?.[0]
  const tint = category?.color ?? '#B0432A'

  return (
    <div
      className="place-photo"
      style={{
        aspectRatio: ratio,
        borderRadius: radius,
        background: `linear-gradient(155deg, ${withAlpha(tint, 0.22)} 0%, ${withAlpha(tint, 0.08)} 55%), var(--bg-subtle)`,
        ...style,
      }}
    >
      {!src || !loaded ? <Fallback name={restaurant.name} icon={category?.icon} tint={tint} /> : null}
      {src && (
        // Plain <img>: sources are third-party/Storage URLs we don't want to proxy
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          className={loaded ? 'is-loaded' : undefined}
          // A cached image can finish before React wires onLoad; catch that case too
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0 && loadedSrc !== src) setLoadedSrc(src)
          }}
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailed((list) => [...list, src])}
        />
      )}
      {children}
    </div>
  )
}

function Fallback({ name, icon, tint }: { name: string; icon?: string; tint: string }) {
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        color: withAlpha(tint, 0.55),
      }}
    >
      {icon ? (
        <span style={{ fontSize: 34, filter: 'saturate(0.85)', opacity: 0.9 }}>{icon}</span>
      ) : (
        <span className="font-display" style={{ fontSize: 44, fontWeight: 500, fontStyle: 'italic' }}>
          {initial}
        </span>
      )}
    </div>
  )
}
