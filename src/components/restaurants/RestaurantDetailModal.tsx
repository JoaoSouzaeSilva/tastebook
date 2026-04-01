'use client'

import { useEffect } from 'react'
import type { Restaurant } from '@/types'
import { StarRating } from '../ui/StarRating'
import { PriceIndicator } from '../ui/PriceIndicator'
import { CategoryBadge } from '../ui/CategoryBadge'

interface RestaurantDetailModalProps {
  restaurant: Restaurant
  onClose: () => void
}

export function RestaurantDetailModal({ restaurant, onClose }: RestaurantDetailModalProps) {
  const tried = restaurant.status === 'tried'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          maxHeight: '92svh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-default)' }} />
        </div>

        <div style={{ position: 'relative', padding: '20px 24px 12px' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 24,
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-subtle)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <div style={{ paddingRight: 42 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '5px 10px', borderRadius: 'var(--radius-full)', background: tried ? 'var(--accent-secondary-light)' : 'var(--accent-primary-light)', color: tried ? 'var(--accent-secondary)' : 'var(--accent-primary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {tried ? 'Tried' : 'Want to try'}
            </div>
            <h2 className="font-display" style={{ fontSize: 30, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 10 }}>
              {restaurant.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {tried ? (
                restaurant.rating ? <StarRating value={restaurant.rating} readonly size="sm" /> : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Not rated</span>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Wishlist</span>
              )}
              {restaurant.avg_price && (
                <>
                  <span style={{ color: 'var(--border-default)', fontSize: 12 }}>·</span>
                  <PriceIndicator value={restaurant.avg_price} readonly size="sm" />
                </>
              )}
              {tried && restaurant.date_visited && (
                <>
                  <span style={{ color: 'var(--border-default)', fontSize: 12 }}>·</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Visited {new Date(restaurant.date_visited).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </>
              )}
              {!tried && (
                <>
                  <span style={{ color: 'var(--border-default)', fontSize: 12 }}>·</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Added {new Date(restaurant.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </>
              )}
            </div>
            {restaurant.address && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                {restaurant.address}
              </p>
            )}
            {restaurant.categories.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {restaurant.categories.map((category) => (
                  <CategoryBadge key={category.id} category={category} size="sm" />
                ))}
              </div>
            )}
          </div>
        </div>

        {restaurant.review_photos.length > 0 && (
          <div style={{ padding: '4px 24px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Photos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {restaurant.review_photos.map((photo) => (
                <a
                  key={photo.id}
                  href={photo.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-base)',
                    aspectRatio: '1 / 1',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: `url(${photo.image_url}) center/cover no-repeat`,
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '18px 24px 24px' }}>
          {restaurant.notes && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {tried ? 'Review' : 'Notes'}
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                {restaurant.notes}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {restaurant.google_maps_link && (
              <a
                href={restaurant.google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Open in Maps
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
