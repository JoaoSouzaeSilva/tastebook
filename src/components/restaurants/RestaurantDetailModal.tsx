'use client'

import type { Restaurant, RestaurantVisit } from '@/types'
import { formatEuroAmount, getAverageRating, getAverageSpendPerPerson, getPricePerPerson } from '@/lib/reviewStats'
import { getGoogleMapsUrl } from '@/lib/maps'
import { StarRating } from '../ui/StarRating'
import { PriceIndicator } from '../ui/PriceIndicator'
import { CategoryBadge } from '../ui/CategoryBadge'
import { Sheet, SheetBody } from '../ui/Sheet'

interface RestaurantDetailModalProps {
  restaurant: Restaurant
  onClose: () => void
  onAddVisit: () => void
  onEdit: () => void
  onDelete: () => void
  onEditVisit: (visit: RestaurantVisit) => void
  onDeleteVisit: (visit: RestaurantVisit) => void
}

const secondaryActionStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px 14px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-base)',
  color: 'var(--text-primary)',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

export function RestaurantDetailModal({ restaurant, onClose, onAddVisit, onEdit, onDelete, onEditVisit, onDeleteVisit }: RestaurantDetailModalProps) {
  const tried = restaurant.status === 'tried'
  const pricePerPerson = restaurant.average_spend_per_person ?? getAverageSpendPerPerson(restaurant.visits)
  const averageRating = restaurant.average_rating ?? getAverageRating(restaurant.visits)
  const wouldGoAgainCount = restaurant.visits.filter((visit) => visit.would_go_again === true).length
  const worthMoneyCount = restaurant.visits.filter((visit) => visit.worth_the_money === true).length
  const mapsUrl = getGoogleMapsUrl(restaurant)

  return (
    <Sheet onClose={onClose} maxWidth={620}>
      <SheetBody>
        {restaurant.photo_url && (
          <div
            style={{
              height: 170,
              margin: '8px 16px 0',
              borderRadius: 'var(--radius-lg)',
              background: `url(${restaurant.photo_url}) center/cover no-repeat`,
              border: '1px solid var(--border-subtle)',
            }}
          />
        )}

        <div style={{ position: 'relative', padding: '18px 24px 12px' }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
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
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
                padding: '5px 10px',
                borderRadius: 'var(--radius-full)',
                background: tried ? 'var(--accent-secondary-light)' : 'var(--accent-primary-light)',
                color: tried ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {tried ? 'Tried' : 'Want to try'}
            </div>
            <h2 className="font-display" style={{ fontSize: 28, lineHeight: 1.15, color: 'var(--text-primary)', marginBottom: 10 }}>
              {restaurant.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              {tried ? (
                averageRating ? (
                  <StarRating value={averageRating} readonly size="sm" />
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Not rated</span>
                )
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Wishlist</span>
              )}
              {restaurant.avg_price && (
                <>
                  <span style={{ color: 'var(--border-default)', fontSize: 12 }}>·</span>
                  <PriceIndicator value={restaurant.avg_price} readonly size="sm" />
                </>
              )}
              <span style={{ color: 'var(--border-default)', fontSize: 12 }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {tried && restaurant.date_visited
                  ? `Visited ${new Date(restaurant.date_visited).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : `Added ${new Date(restaurant.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </span>
            </div>
            {restaurant.address && (
              <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--text-secondary)', textDecoration: 'underline', textDecorationColor: 'var(--border-strong)', textUnderlineOffset: 3 }}
                >
                  {restaurant.address}
                </a>
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

        <div style={{ padding: '6px 24px 28px' }}>
          {/* Actions */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
            <button
              onClick={onAddVisit}
              style={{
                ...secondaryActionStyle,
                border: 'none',
                background: 'var(--accent-secondary)',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {tried ? '+ Add visit' : '✓ Mark as tried'}
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...secondaryActionStyle, flexShrink: 0 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Maps
            </a>
            <button onClick={onEdit} style={{ ...secondaryActionStyle, flexShrink: 0 }}>
              Edit
            </button>
            <button onClick={onDelete} style={{ ...secondaryActionStyle, color: '#B91C1C', borderColor: '#B91C1C40', flexShrink: 0 }}>
              Delete
            </button>
          </div>

          {(pricePerPerson !== null || restaurant.visits.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
              {pricePerPerson !== null && (
                <div style={{ padding: '13px 15px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Avg spend
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatEuroAmount(pricePerPerson)} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>pp</span>
                  </div>
                </div>
              )}
              {restaurant.visits.length > 0 && (
                <>
                  <div style={{ padding: '13px 15px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                      Would go again
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {wouldGoAgainCount}/{restaurant.visits.length}
                    </div>
                  </div>
                  <div style={{ padding: '13px 15px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                      Worth the money
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {worthMoneyCount}/{restaurant.visits.length}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {restaurant.notes && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Notes
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{restaurant.notes}</p>
            </div>
          )}

          {restaurant.visits.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
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
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatEuroAmount(spendPerPerson)} pp</span>
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
                            <span
                              style={{
                                display: 'inline-flex',
                                padding: '5px 9px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 12,
                                fontWeight: 600,
                                background: visit.would_go_again ? 'var(--accent-secondary-light)' : '#FEF3C7',
                                color: visit.would_go_again ? 'var(--accent-secondary)' : '#92400E',
                              }}
                            >
                              {visit.would_go_again ? 'Would go again' : 'Would not go again'}
                            </span>
                          )}
                          {visit.worth_the_money !== undefined && (
                            <span
                              style={{
                                display: 'inline-flex',
                                padding: '5px 9px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 12,
                                fontWeight: 600,
                                background: visit.worth_the_money ? 'var(--accent-gold-light)' : '#FEE2E2',
                                color: visit.worth_the_money ? '#9A6700' : '#B91C1C',
                              }}
                            >
                              {visit.worth_the_money ? 'Worth the money' : 'Not worth the money'}
                            </span>
                          )}
                        </div>
                      )}
                      {visit.notes && (
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{visit.notes}</p>
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
      </SheetBody>
    </Sheet>
  )
}
