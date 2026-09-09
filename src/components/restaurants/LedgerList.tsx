'use client'

import { useRef, useState } from 'react'
import type { Restaurant } from '@/types'
import { formatEuroAmount, getLatestVisit } from '@/lib/reviewStats'
import { formatDistance } from '@/lib/geo'

const ACTION_WIDTH = 132
const OPEN_THRESHOLD = 56

interface LedgerRowProps {
  restaurant: Restaurant
  distanceKm: number | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onOpen: () => void
  onMarkTried: () => void
  onToggleFavorite: () => void
  onDelete: () => void
  animationDelay: number
}

/**
 * One line in the notebook: a checkbox, the name, and a stamped meta line. Everything else — starring, deleting — lives under a leftward swipe,
 * which is where an iPhone user already looks for it.
 */
function LedgerRow({
  restaurant,
  distanceKm,
  isOpen,
  onOpenChange,
  onOpen,
  onMarkTried,
  onToggleFavorite,
  onDelete,
  animationDelay,
}: LedgerRowProps) {
  const tried = restaurant.status === 'tried'
  const [dragX, setDragX] = useState<number | null>(null)
  // Lets the tick finish drawing before the sheet covers it
  const [ticking, setTicking] = useState(false)

  const gesture = useRef({ startX: 0, startY: 0, active: false, decided: false, base: 0, moved: 0 })

  const rating = tried ? restaurant.average_rating ?? restaurant.rating : undefined
  const perPerson = restaurant.average_spend_per_person
  const latestVisit = getLatestVisit(restaurant.visits)
  const firstCategory = restaurant.categories?.[0]

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
  if (firstCategory) {
    meta.push(
      restaurant.categories.length > 1
        ? `${firstCategory.name.toLowerCase()} +${restaurant.categories.length - 1}`
        : firstCategory.name.toLowerCase()
    )
  }

  const translateX = dragX ?? (isOpen ? -ACTION_WIDTH : 0)

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('[data-tick]')) return
    gesture.current = {
      startX: event.clientX,
      startY: event.clientY,
      active: true,
      decided: false,
      base: isOpen ? -ACTION_WIDTH : 0,
      moved: 0,
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g.active) return

    const dx = event.clientX - g.startX
    const dy = event.clientY - g.startY

    if (!g.decided) {
      if (Math.abs(dx) < 9 && Math.abs(dy) < 9) return
      // Vertical wins — let the page scroll and abandon the gesture
      if (Math.abs(dy) > Math.abs(dx)) {
        g.active = false
        return
      }
      g.decided = true
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }

    g.moved = Math.min(0, Math.max(-(ACTION_WIDTH + 28), g.base + dx))
    setDragX(g.moved)
  }

  function handlePointerEnd() {
    const g = gesture.current
    if (!g.active) return
    g.active = false
    if (!g.decided) return
    onOpenChange(g.moved < -OPEN_THRESHOLD)
    setDragX(null)
  }

  function handleRowClick() {
    // A swipe that just closed the tray shouldn't also open the place
    if (gesture.current.decided) return
    if (isOpen) {
      onOpenChange(false)
      return
    }
    onOpen()
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ position: 'absolute', inset: '0 0 0 auto', display: 'flex', width: ACTION_WIDTH }}>
        <button
          onClick={() => {
            onToggleFavorite()
            onOpenChange(false)
          }}
          className="label-caps"
          style={{
            flex: 1,
            border: 'none',
            cursor: 'pointer',
            fontSize: 10,
            background: 'var(--accent-gold-light)',
            color: 'var(--accent-gold)',
          }}
        >
          {restaurant.is_favorite ? 'Unstar' : 'Star'}
        </button>
        <button
          onClick={() => {
            onOpenChange(false)
            onDelete()
          }}
          className="label-caps"
          style={{
            flex: 1,
            border: 'none',
            cursor: 'pointer',
            fontSize: 10,
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
          }}
        >
          Delete
        </button>
      </div>

      <div
        className={`ledger-row paper animate-fade-up${dragX !== null ? ' is-dragging' : ''}`}
        onClick={handleRowClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '11px 16px',
          cursor: 'pointer',
          transform: `translateX(${translateX}px)`,
          animationDelay: `${animationDelay}ms`,
        }}
      >
        <button
          data-tick
          aria-label={tried ? `Log another visit to ${restaurant.name}` : `Mark ${restaurant.name} as tried`}
          onClick={(event) => {
            event.stopPropagation()
            setTicking(true)
            window.setTimeout(() => {
              onMarkTried()
              setTicking(false)
            }, 300)
          }}
          style={{
            flex: 'none',
            width: 23,
            height: 23,
            borderRadius: 4,
            border: `1.8px solid ${tried || ticking ? 'var(--accent-secondary)' : 'var(--text-muted)'}`,
            background: 'transparent',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            transition: 'border-color 0.2s',
          }}
        >
          <svg
            className={`tick${tried || ticking ? ' is-checked' : ''}`}
            width="15"
            height="15"
            viewBox="0 0 16 16"
            style={{ overflow: 'visible' }}
            aria-hidden
          >
            <path d="M2.5 8.5 6 12l7.5-8" />
          </svg>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16.5,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {restaurant.name}
          </div>
          {meta.length > 0 && (
            <div
              className="font-stamp"
              style={{
                fontSize: 10.5,
                color: 'var(--text-muted)',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {meta.join(' · ')}
            </div>
          )}
        </div>

        <div
          className="font-stamp"
          style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)' }}
        >
          {restaurant.is_favorite && <span style={{ color: 'var(--accent-gold)' }}>★</span>}
          {rating != null && <span style={{ color: 'var(--text-primary)' }}>{rating.toFixed(1)}</span>}
        </div>
      </div>
    </div>
  )
}

interface LedgerListProps {
  restaurants: Restaurant[]
  distanceOf: (restaurant: Restaurant) => number | null
  onOpen: (id: string) => void
  onMarkTried: (id: string) => void
  onToggleFavorite: (restaurant: Restaurant) => void
  onDelete: (restaurant: Restaurant) => void
}

export function LedgerList({
  restaurants,
  distanceOf,
  onOpen,
  onMarkTried,
  onToggleFavorite,
  onDelete,
}: LedgerListProps) {
  // Only one tray open at a time, as in Mail
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
      {restaurants.map((restaurant, index) => (
        <LedgerRow
          key={restaurant.id}
          restaurant={restaurant}
          distanceKm={distanceOf(restaurant)}
          isOpen={openId === restaurant.id}
          onOpenChange={(open) => setOpenId(open ? restaurant.id : null)}
          onOpen={() => onOpen(restaurant.id)}
          onMarkTried={() => onMarkTried(restaurant.id)}
          onToggleFavorite={() => onToggleFavorite(restaurant)}
          onDelete={() => onDelete(restaurant)}
          animationDelay={Math.min(index, 8) * 30}
        />
      ))}
    </div>
  )
}
