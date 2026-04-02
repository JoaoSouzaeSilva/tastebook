'use client'

import { useEffect, useRef, useState } from 'react'
import type { Restaurant, RestaurantVisit } from '@/types'
import { formatEuroAmount, getAverageRating, getAverageSpendPerPerson, getPricePerPerson } from '@/lib/reviewStats'
import { StarRating } from '../ui/StarRating'
import { PriceIndicator } from '../ui/PriceIndicator'
import { CategoryBadge } from '../ui/CategoryBadge'

interface RestaurantDetailModalProps {
  restaurant: Restaurant
  onClose: () => void
  onAddVisit: () => void
  onEditVisit: (visit: RestaurantVisit) => void
  onDeleteVisit: (visit: RestaurantVisit) => void
}

export function RestaurantDetailModal({ restaurant, onClose, onAddVisit, onEditVisit, onDeleteVisit }: RestaurantDetailModalProps) {
  const tried = restaurant.status === 'tried'
  const pricePerPerson = restaurant.average_spend_per_person ?? getAverageSpendPerPerson(restaurant.visits)
  const averageRating = restaurant.average_rating ?? getAverageRating(restaurant.visits)
  const wouldGoAgainCount = restaurant.visits.filter((visit) => visit.would_go_again === true).length
  const worthMoneyCount = restaurant.visits.filter((visit) => visit.worth_the_money === true).length
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartYRef = useRef<number | null>(null)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

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

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    const sheet = sheetRef.current
    if (!sheet) return
    if (sheet.scrollTop > 0) return

    touchStartYRef.current = e.touches[0].clientY
    setIsDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!isDragging || touchStartYRef.current === null) return

    const nextDragY = e.touches[0].clientY - touchStartYRef.current
    if (nextDragY <= 0) {
      setDragY(0)
      return
    }

    setDragY(nextDragY)
  }

  function handleTouchEnd() {
    if (!isDragging) return

    if (dragY > 120) {
      onClose()
      return
    }

    setIsDragging(false)
    setDragY(0)
    touchStartYRef.current = null
  }

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
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          maxHeight: '92svh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.22s ease',
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
                averageRating ? <StarRating value={averageRating} readonly size="sm" /> : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Not rated</span>
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

        <div style={{ padding: '18px 24px 24px' }}>
          {pricePerPerson !== null && (
            <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Average spend
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                  {formatEuroAmount(pricePerPerson)} per person
                </span>
                <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                  Across {restaurant.visits.length} visit{restaurant.visits.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          )}

          {restaurant.visits.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 18 }}>
              <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Would Go Again
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {wouldGoAgainCount}/{restaurant.visits.length}
                </div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Worth The Money
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {worthMoneyCount}/{restaurant.visits.length}
                </div>
              </div>
            </div>
          )}

          {restaurant.notes && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Latest review
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                {restaurant.notes}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={onAddVisit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '11px 14px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: 'var(--accent-secondary)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {tried ? 'Add another visit' : 'Mark as tried'}
            </button>
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

          {restaurant.visits.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Visit history
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {restaurant.visits.map((visit) => {
                  const spendPerPerson = getPricePerPerson(visit.total_paid, visit.party_size)

                  return (
                    <div
                      key={visit.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {new Date(visit.date_visited).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {visit.rating !== undefined && <StarRating value={visit.rating} readonly size="sm" />}
                        {spendPerPerson !== null && (
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {formatEuroAmount(spendPerPerson)} pp
                          </span>
                        )}
                        {visit.review_photos.length > 0 && (
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {visit.review_photos.length} photo{visit.review_photos.length === 1 ? '' : 's'}
                          </span>
                        )}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                          <button
                            onClick={() => onEditVisit(visit)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--accent-secondary)',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteVisit(visit)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#B91C1C',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {(visit.would_go_again !== undefined || visit.worth_the_money !== undefined) && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: visit.notes ? 8 : 0 }}>
                          {visit.would_go_again !== undefined && (
                            <span style={{
                              display: 'inline-flex',
                              padding: '5px 9px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 12,
                              fontWeight: 600,
                              background: visit.would_go_again ? 'var(--accent-secondary-light)' : '#FEF3C7',
                              color: visit.would_go_again ? 'var(--accent-secondary)' : '#92400E',
                            }}>
                              {visit.would_go_again ? 'Would go again' : 'Would not go again'}
                            </span>
                          )}
                          {visit.worth_the_money !== undefined && (
                            <span style={{
                              display: 'inline-flex',
                              padding: '5px 9px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 12,
                              fontWeight: 600,
                              background: visit.worth_the_money ? 'var(--accent-gold-light)' : '#FEE2E2',
                              color: visit.worth_the_money ? '#9A6700' : '#B91C1C',
                            }}>
                              {visit.worth_the_money ? 'Worth the money' : 'Not worth the money'}
                            </span>
                          )}
                        </div>
                      )}
                      {visit.notes && (
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                          {visit.notes}
                        </p>
                      )}
                      {visit.review_photos.length > 0 && (
                        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                          {visit.review_photos.map((photo) => (
                            <a
                              key={photo.id}
                              href={photo.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'block',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                border: '1px solid var(--border-subtle)',
                                aspectRatio: '1 / 1',
                                background: `url(${photo.image_url}) center/cover no-repeat`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
