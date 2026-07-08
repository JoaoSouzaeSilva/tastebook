'use client'

import type { Restaurant } from '@/types'
import { formatEuroAmount, getLatestVisit } from '@/lib/reviewStats'
import { formatDistance } from '@/lib/geo'
import { CategoryBadge } from '../ui/CategoryBadge'

interface RestaurantCardProps {
  restaurant: Restaurant
  onOpen: () => void
  onMarkTried: () => void
  onToggleFavorite: () => void
  animationDelay?: number
  distanceKm?: number | null
}

export function RestaurantCard({ restaurant, onOpen, onMarkTried, onToggleFavorite, animationDelay = 0, distanceKm = null }: RestaurantCardProps) {
  const tried = restaurant.status === 'tried'
  const latestVisit = getLatestVisit(restaurant.visits)
  const pricePerPerson = restaurant.average_spend_per_person ?? null
  const rating = tried ? restaurant.average_rating ?? restaurant.rating : undefined

  const metaParts: string[] = []
  if (distanceKm !== null) metaParts.push(`📍 ${formatDistance(distanceKm)}`)
  if (rating) metaParts.push(`★ ${rating.toFixed(1)}`)
  if (restaurant.avg_price) metaParts.push(restaurant.avg_price)
  if (pricePerPerson !== null) metaParts.push(`${formatEuroAmount(pricePerPerson)} pp`)

  return (
    <article
      className="animate-fade-up card-hover"
      onClick={onOpen}
      style={{
        animationDelay: `${animationDelay}ms`,
        display: 'flex',
        gap: 12,
        padding: 12,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: restaurant.photo_url
              ? `url(${restaurant.photo_url}) center/cover no-repeat`
              : tried
              ? 'linear-gradient(135deg, #2D6A4F26 0%, #2D6A4F0A 100%)'
              : 'linear-gradient(135deg, #C85C3820 0%, #B8860B0A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!restaurant.photo_url && (
            <span
              className="font-display"
              style={{ fontSize: 30, fontWeight: 500, color: tried ? 'var(--accent-secondary)' : 'var(--accent-primary)', opacity: 0.55 }}
            >
              {restaurant.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {/* Status dot */}
        <span
          title={tried ? 'Tried' : 'Want to try'}
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 20,
            height: 20,
            borderRadius: 'var(--radius-full)',
            background: tried ? 'var(--accent-secondary)' : 'var(--accent-primary)',
            border: '2px solid var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
            {tried ? (
              <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <circle cx="4" cy="4" r="2" fill="white" />
            )}
          </svg>
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <h3
            className="font-display"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {restaurant.name}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            aria-label={restaurant.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
            style={{
              width: 30,
              height: 30,
              marginTop: -4,
              marginRight: -4,
              borderRadius: 'var(--radius-full)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: restaurant.is_favorite ? 'var(--accent-gold)' : 'var(--border-strong)',
              transition: 'color 0.15s',
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill={restaurant.is_favorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>

        {metaParts.length > 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{metaParts.join(' · ')}</div>
        )}

        {restaurant.categories?.length > 0 && (
          <div className="no-scrollbar" style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {restaurant.categories.slice(0, 3).map((cat) => (
              <CategoryBadge key={cat.id} category={cat} size="sm" />
            ))}
            {restaurant.categories.length > 3 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center', flexShrink: 0 }}>
                +{restaurant.categories.length - 3}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {latestVisit?.date_visited
              ? `${restaurant.visits.length > 1 ? `${restaurant.visits.length} visits · ` : ''}Last ${new Date(latestVisit.date_visited).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
              : `Added ${new Date(restaurant.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          </span>
          {!tried && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkTried()
              }}
              style={{
                flexShrink: 0,
                padding: '4px 11px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-secondary-light)',
                border: '1px solid var(--accent-secondary)',
                color: 'var(--accent-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}
            >
              Tried it ✓
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
