'use client'

import { useState } from 'react'
import type { Restaurant } from '@/types'
import { StarRating } from '../ui/StarRating'
import { CategoryBadge } from '../ui/CategoryBadge'
import { PriceIndicator } from '../ui/PriceIndicator'

interface RestaurantCardProps {
  restaurant: Restaurant
  onOpen: () => void
  onEdit: () => void
  onMarkTried: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  animationDelay?: number
}

export function RestaurantCard({ restaurant, onOpen, onEdit, onMarkTried, onDelete, onToggleFavorite, animationDelay = 0 }: RestaurantCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const tried = restaurant.status === 'tried'
  const menuItems = [
    !tried ? { label: '✓ Mark as tried', action: onMarkTried, color: 'var(--accent-secondary)' } : null,
    restaurant.google_maps_link ? { label: '↗ Open in Maps', action: () => window.open(restaurant.google_maps_link, '_blank'), color: 'var(--text-primary)' } : null,
    { label: '✎ Edit', action: onEdit, color: 'var(--text-primary)' },
    { label: '✕ Delete', action: onDelete, color: '#E24B4A' },
  ].filter((item): item is { label: string; action: () => void; color: string } => Boolean(item))

  return (
    <article
      className="animate-fade-up card-hover"
      onClick={() => {
        if (tried) onOpen()
      }}
      style={{
        animationDelay: `${animationDelay}ms`,
        position: 'relative',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        cursor: tried ? 'pointer' : 'default',
      }}
    >
      {/* Photo or gradient header */}
      <div
        style={{
          height: restaurant.photo_url ? 160 : 80,
          background: restaurant.photo_url
            ? `url(${restaurant.photo_url}) center/cover no-repeat`
            : tried
            ? 'linear-gradient(135deg, #2D6A4F22 0%, #2D6A4F08 100%)'
            : 'linear-gradient(135deg, #C85C3812 0%, #B8860B08 100%)',
          position: 'relative',
        }}
      >
        {/* Status badge */}
        <div style={{ position: 'absolute', top: 10, left: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              background: tried ? 'var(--accent-secondary)' : 'var(--accent-primary)',
              color: '#fff',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              {tried ? (
                <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <circle cx="4" cy="4" r="2.5" fill="white"/>
              )}
            </svg>
            {tried ? 'Tried' : 'Want to try'}
          </span>
        </div>

        {/* Top-right action buttons */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          display: 'flex', gap: 6,
        }}>
          {/* Favourite */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
            title={restaurant.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
            style={{
              width: 32, height: 32,
              borderRadius: 'var(--radius-full)',
              background: restaurant.is_favorite ? 'var(--accent-primary)' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24"
              fill={restaurant.is_favorite ? '#fff' : 'none'}
              stroke={restaurant.is_favorite ? '#fff' : 'rgba(0,0,0,0.55)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>

          {/* Menu */}
          <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            style={{
              width: 32, height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,0,0,0.55)">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              className="animate-scale-in"
              style={{
                position: 'absolute', top: 36, right: 0,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                minWidth: 160,
                zIndex: 50,
                overflow: 'hidden',
              }}
              onMouseLeave={() => setMenuOpen(false)}
            >
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); item.action(); setMenuOpen(false) }}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '10px 14px',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 14,
                    color: item.color,
                    borderBottom: i < menuItems.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    fontFamily: 'var(--font-body)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Name */}
        <h3
          className="font-display"
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--text-primary)',
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          {restaurant.name}
        </h3>

        {/* Rating + Price row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {tried && restaurant.rating ? (
            <StarRating value={restaurant.rating} readonly size="sm" />
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not rated yet</span>
          )}
          {restaurant.avg_price && (
            <>
              <span style={{ color: 'var(--border-default)', fontSize: 12 }}>·</span>
              <PriceIndicator value={restaurant.avg_price} readonly size="sm" />
            </>
          )}
        </div>

        {/* Categories */}
        {restaurant.categories?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {restaurant.categories.map((cat) => (
              <CategoryBadge key={cat.id} category={cat} size="sm" />
            ))}
          </div>
        )}

        {/* Notes preview */}
        {restaurant.notes && (
          <p style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: 12,
            fontStyle: 'italic',
          }}>
            &ldquo;{restaurant.notes}&rdquo;
          </p>
        )}

        {restaurant.review_photos?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
            {restaurant.review_photos.slice(0, 4).map((photo) => (
              <div
                key={photo.id}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-md)',
                  background: `url(${photo.image_url}) center/cover no-repeat`,
                  flexShrink: 0,
                  border: '1px solid var(--border-subtle)',
                }}
              />
            ))}
            {restaurant.review_photos.length > 4 && (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid var(--border-subtle)',
                  flexShrink: 0,
                }}
              >
                +{restaurant.review_photos.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          {restaurant.date_visited ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Visited {new Date(restaurant.date_visited).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Added {new Date(restaurant.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}

          {/* Quick action */}
          {!tried && (
            <button
              onClick={onMarkTried}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-secondary-light)',
                border: '1px solid var(--accent-secondary)',
                color: 'var(--accent-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-secondary)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-secondary-light)'
                e.currentTarget.style.color = 'var(--accent-secondary)'
              }}
            >
              Mark tried ✓
            </button>
          )}

          {restaurant.google_maps_link && (
            <a
              href={restaurant.google_maps_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: 'var(--text-muted)',
                textDecoration: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Maps
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
