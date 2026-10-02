'use client'

import type { Restaurant } from '@/types'
import { formatEuroAmount, getLatestVisit } from '@/lib/reviewStats'
import { formatDistance } from '@/lib/geo'
import { PlacePhoto } from '../ui/PlacePhoto'

interface PlaceCardProps {
  restaurant: Restaurant
  distanceKm: number | null
  priority: boolean
  onOpen: () => void
  onMarkTried: () => void
  onToggleFavorite: () => void
  animationDelay: number
}

/**
 * A magazine card: the photo carries the page, the name is set in the display serif,
 * and the two things you do from the list — star it, tick it off — sit on the card
 * in plain sight instead of behind a swipe.
 */
function PlaceCard({ restaurant, distanceKm, priority, onOpen, onMarkTried, onToggleFavorite, animationDelay }: PlaceCardProps) {
  const tried = restaurant.status === 'tried'
  const rating = tried ? restaurant.average_rating ?? restaurant.rating : undefined
  const perPerson = restaurant.average_spend_per_person
  const latestVisit = getLatestVisit(restaurant.visits)
  const category = restaurant.categories?.[0]

  const meta: string[] = []
  if (tried) {
    if (restaurant.visits.length > 1) meta.push(`${restaurant.visits.length} visits`)
    else if (latestVisit?.date_visited) {
      meta.push(new Date(latestVisit.date_visited).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))
    }
    if (perPerson != null) meta.push(`${formatEuroAmount(perPerson)} pp`)
    else if (restaurant.avg_price) meta.push(restaurant.avg_price)
  } else {
    if (distanceKm != null) meta.push(formatDistance(distanceKm))
    if (restaurant.avg_price) meta.push(restaurant.avg_price)
  }

  return (
    <article className="animate-fade-up" style={{ minWidth: 0, animationDelay: `${animationDelay}ms` }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={onOpen}
          aria-label={`Open ${restaurant.name}`}
          className="pressable"
          style={{ display: 'block', width: '100%', border: 'none', padding: 0, background: 'none', borderRadius: 'var(--radius-lg)' }}
        >
          <PlacePhoto restaurant={restaurant} ratio="4 / 5" priority={priority} style={{ boxShadow: 'var(--shadow-sm)' }}>
            {category && (
              <span
                style={{
                  position: 'absolute',
                  left: 8,
                  bottom: 8,
                  maxWidth: 'calc(100% - 16px)',
                  padding: '4px 9px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(20, 15, 11, 0.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: '#FFF8F0',
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {category.name}
                {restaurant.categories.length > 1 ? ` +${restaurant.categories.length - 1}` : ''}
              </span>
            )}
            {rating != null && (
              <span
                className="tabular"
                style={{
                  position: 'absolute',
                  left: 8,
                  top: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 9px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span style={{ color: 'var(--accent-gold)' }} aria-hidden>
                  ★
                </span>
                {rating.toFixed(1)}
              </span>
            )}
          </PlacePhoto>
        </button>

        <button
          onClick={onToggleFavorite}
          aria-label={restaurant.is_favorite ? `Unstar ${restaurant.name}` : `Star ${restaurant.name}`}
          aria-pressed={restaurant.is_favorite}
          className="pressable"
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            border: 'none',
            background: 'none',
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 'var(--radius-full)',
              background: restaurant.is_favorite ? 'var(--accent-gold)' : 'rgba(20, 15, 11, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#FFF8F0',
              transition: 'background 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={restaurant.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
              <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
            </svg>
          </span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, paddingTop: 9 }}>
        <button
          onClick={onOpen}
          style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 'none', background: 'none', padding: 0 }}
        >
          <h3
            className="font-display"
            style={{
              fontSize: 17.5,
              fontWeight: 500,
              lineHeight: 1.18,
              color: 'var(--text-primary)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textWrap: 'balance',
            }}
          >
            {restaurant.name}
          </h3>
          {meta.length > 0 && (
            <p className="tabular" style={{ marginTop: 4, fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {meta.join(' · ')}
            </p>
          )}
        </button>

        <button
          onClick={onMarkTried}
          aria-label={tried ? `Log another visit to ${restaurant.name}` : `Mark ${restaurant.name} as tried`}
          className="pressable"
          style={{
            flex: 'none',
            width: 44,
            height: 44,
            margin: '-6px -8px 0 0',
            display: 'grid',
            placeItems: 'center',
            border: 'none',
            background: 'none',
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 'var(--radius-full)',
              border: tried ? 'none' : '1.5px solid var(--border-strong)',
              background: tried ? 'var(--accent-secondary-light)' : 'transparent',
              color: tried ? 'var(--accent-secondary)' : 'var(--text-secondary)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {tried ? <path d="M12 5v14M5 12h14" /> : <path d="M4.5 12.5l5 5 10-11" />}
            </svg>
          </span>
        </button>
      </div>
    </article>
  )
}

interface LedgerListProps {
  restaurants: Restaurant[]
  distanceOf: (restaurant: Restaurant) => number | null
  onOpen: (id: string) => void
  onMarkTried: (id: string) => void
  onToggleFavorite: (restaurant: Restaurant) => void
}

export function LedgerList({ restaurants, distanceOf, onOpen, onMarkTried, onToggleFavorite }: LedgerListProps) {
  return (
    <div className="card-grid" style={{ padding: '18px 16px 8px' }}>
      {restaurants.map((restaurant, index) => (
        <PlaceCard
          key={restaurant.id}
          restaurant={restaurant}
          distanceKm={distanceOf(restaurant)}
          priority={index < 4}
          onOpen={() => onOpen(restaurant.id)}
          onMarkTried={() => onMarkTried(restaurant.id)}
          onToggleFavorite={() => onToggleFavorite(restaurant)}
          animationDelay={Math.min(index, 8) * 35}
        />
      ))}
    </div>
  )
}
