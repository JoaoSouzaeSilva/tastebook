'use client'

import { useState } from 'react'
import type { Restaurant } from '@/types'
import { StarRating } from '../ui/StarRating'
import { CategoryBadge } from '../ui/CategoryBadge'
import { PriceIndicator } from '../ui/PriceIndicator'

interface RestaurantCardProps {
  restaurant: Restaurant
  onEdit: () => void
  onMarkTried: () => void
  onDelete: () => void
  animationDelay?: number
}

export function RestaurantCard({ restaurant, onEdit, onMarkTried, onDelete, animationDelay = 0 }: RestaurantCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const tried = restaurant.status === 'tried'

  return (
    <article
      className="animate-fade-up card-hover"
      style={{
        animationDelay: `${animationDelay}ms`,
        position: 'relative',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
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

        {/* Menu button */}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            style={{
              width: 32, height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text-secondary)">
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
              {[
                !tried && { label: '✓ Mark as tried', action: onMarkTried, color: 'var(--accent-secondary)' },
                restaurant.google_maps_link && { label: '↗ Open in Maps', action: () => window.open(restaurant.google_maps_link, '_blank'), color: 'var(--text-primary)' },
                { label: '✎ Edit', action: onEdit, color: 'var(--text-primary)' },
                { label: '✕ Delete', action: onDelete, color: '#E24B4A' },
              ].filter(Boolean).map((item: any, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); item.action(); setMenuOpen(false) }}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '10px 14px',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 14,
                    color: item.color,
                    borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none',
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
            "{restaurant.notes}"
          </p>
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
