'use client'

import type { Restaurant, RestaurantVisit } from '@/types'
import { formatEuroAmount, getAverageRating, getAverageSpendPerPerson, getPricePerPerson } from '@/lib/reviewStats'
import { getGoogleMapsUrl } from '@/lib/maps'
import { StarRating } from '../ui/StarRating'
import { CategoryBadge } from '../ui/CategoryBadge'
import { PlacePhoto } from '../ui/PlacePhoto'
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

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const secondaryButton: React.CSSProperties = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  height: 48,
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  textDecoration: 'none',
  fontSize: 15,
  fontWeight: 500,
}

export function RestaurantDetailModal({ restaurant, onClose, onAddVisit, onEdit, onDelete, onEditVisit, onDeleteVisit }: RestaurantDetailModalProps) {
  const tried = restaurant.status === 'tried'
  const pricePerPerson = restaurant.average_spend_per_person ?? getAverageSpendPerPerson(restaurant.visits)
  const averageRating = restaurant.average_rating ?? getAverageRating(restaurant.visits)
  const visitCount = restaurant.visits.length
  const wouldGoAgainCount = restaurant.visits.filter((visit) => visit.would_go_again === true).length
  const worthMoneyCount = restaurant.visits.filter((visit) => visit.worth_the_money === true).length
  const mapsUrl = getGoogleMapsUrl(restaurant)
  const visits = [...restaurant.visits].sort((a, b) => b.date_visited.localeCompare(a.date_visited))

  const facts: { label: string; value: string }[] = []
  if (pricePerPerson !== null) facts.push({ label: 'Per person', value: formatEuroAmount(pricePerPerson) })
  if (visitCount > 0) {
    facts.push({ label: 'Go again', value: `${wouldGoAgainCount}/${visitCount}` })
    facts.push({ label: 'Worth it', value: `${worthMoneyCount}/${visitCount}` })
  }

  return (
    <Sheet onClose={onClose} maxWidth={620} handle={false}>
      <SheetBody>
        <div style={{ position: 'relative' }}>
          <PlacePhoto restaurant={restaurant} ratio="4 / 3" radius={0} priority />
          <div
            aria-hidden
            style={{ position: 'absolute', inset: '0 0 auto', height: 72, background: 'linear-gradient(rgba(20,15,11,0.35), transparent)' }}
          />
          <div aria-hidden style={{ position: 'absolute', top: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 38, height: 5, borderRadius: 3, background: 'rgba(255,248,240,0.75)' }} />
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="pressable"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 44,
              height: 44,
              display: 'grid',
              placeItems: 'center',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(20, 15, 11, 0.45)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#FFF8F0',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px 22px 0' }}>
          <p className="eyebrow" style={{ color: tried ? 'var(--accent-secondary)' : 'var(--accent-primary)' }}>
            {tried ? `Been · ${visitCount} visit${visitCount === 1 ? '' : 's'}` : 'Want to try'}
            {restaurant.is_favorite ? ' · Starred' : ''}
          </p>
          <h2 className="font-display" style={{ fontSize: 32, fontWeight: 520, lineHeight: 1.08, color: 'var(--text-primary)', margin: '6px 0 10px', textWrap: 'balance' }}>
            {restaurant.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14.5, color: 'var(--text-secondary)' }}>
            {tried && averageRating ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <StarRating value={averageRating} readonly size="sm" />
                <span className="tabular" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {averageRating.toFixed(1)}
                </span>
              </span>
            ) : null}
            <span>
              {[
                restaurant.avg_price ?? null,
                tried && restaurant.date_visited ? `Last visit ${formatDate(restaurant.date_visited)}` : `Added ${formatDate(restaurant.created_at)}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>

          {restaurant.address && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', marginTop: 10, fontSize: 14.5, lineHeight: 1.45, color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              {restaurant.address}
            </a>
          )}

          {restaurant.categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {restaurant.categories.map((category) => (
                <CategoryBadge key={category.id} category={category} size="md" />
              ))}
            </div>
          )}

          <button
            onClick={onAddVisit}
            className="pressable"
            style={{
              width: '100%',
              height: 52,
              marginTop: 22,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: 'none',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-primary)',
              color: 'var(--on-accent)',
              fontSize: 16,
              fontWeight: 600,
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {tried ? <path d="M12 5v14M5 12h14" /> : <path d="M4.5 12.5l5 5 10-11" />}
            </svg>
            {tried ? 'Log another visit' : 'Mark as tried'}
          </button>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="pressable" style={secondaryButton}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20.5 10c0 6.6-8.5 12-8.5 12S3.5 16.6 3.5 10a8.5 8.5 0 0 1 17 0z" />
                <circle cx="12" cy="10" r="2.8" />
              </svg>
              Directions
            </a>
            <button onClick={onEdit} className="pressable" style={secondaryButton}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 20h4L19 9l-4-4L4 16v4z" />
              </svg>
              Edit
            </button>
          </div>

          {facts.length > 0 && (
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))`,
                marginTop: 26,
                padding: '16px 0',
                borderTop: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {facts.map((fact, index) => (
                <div key={fact.label} style={{ paddingLeft: index === 0 ? 0 : 14, borderLeft: index === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
                  <dt style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fact.label}</dt>
                  <dd className="font-display tabular" style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', marginTop: 2 }}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {restaurant.notes && !tried && (
            <section style={{ marginTop: 26 }}>
              <h3 className="font-script" style={{ fontSize: 21, color: 'var(--text-primary)', marginBottom: 8 }}>
                Notes
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxWidth: '62ch' }}>{restaurant.notes}</p>
            </section>
          )}

          {visits.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <h3 className="font-script" style={{ fontSize: 21, color: 'var(--text-primary)', marginBottom: 4 }}>
                Our visits
              </h3>
              <ol style={{ listStyle: 'none' }}>
                {visits.map((visit) => (
                  <VisitEntry key={visit.id} visit={visit} onEdit={() => onEditVisit(visit)} onDelete={() => onDeleteVisit(visit)} />
                ))}
              </ol>
            </section>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 max(28px, env(safe-area-inset-bottom))' }}>
            <button
              onClick={onDelete}
              style={{ minHeight: 44, padding: '0 16px', border: 'none', background: 'none', color: 'var(--danger)', fontSize: 15, fontWeight: 500 }}
            >
              Delete this place
            </button>
          </div>
        </div>
      </SheetBody>
    </Sheet>
  )
}

function VisitEntry({ visit, onEdit, onDelete }: { visit: RestaurantVisit; onEdit: () => void; onDelete: () => void }) {
  const spendPerPerson = getPricePerPerson(visit.total_paid, visit.party_size)
  const verdicts: { text: string; good: boolean }[] = []
  if (visit.would_go_again != null) verdicts.push({ text: visit.would_go_again ? 'Would go again' : 'Wouldn’t go again', good: visit.would_go_again })
  if (visit.worth_the_money != null) verdicts.push({ text: visit.worth_the_money ? 'Worth the money' : 'Not worth the money', good: visit.worth_the_money })

  return (
    <li style={{ padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{formatDate(visit.date_visited)}</span>
        {visit.rating != null && <StarRating value={visit.rating} readonly size="sm" />}
        <span style={{ flex: 1 }} />
        <button onClick={onEdit} style={visitAction('var(--text-secondary)')}>
          Edit
        </button>
        <button onClick={onDelete} style={visitAction('var(--danger)')}>
          Delete
        </button>
      </div>

      {(spendPerPerson !== null || verdicts.length > 0) && (
        <p className="tabular" style={{ marginTop: 4, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {[
            spendPerPerson !== null ? `${formatEuroAmount(spendPerPerson)} pp` : null,
            ...verdicts.map((v) => v.text),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      {visit.notes && (
        <p
          className="font-display"
          style={{
            marginTop: 10,
            paddingLeft: 12,
            borderLeft: '2px solid var(--accent-primary-light)',
            fontSize: 16.5,
            fontStyle: 'italic',
            lineHeight: 1.55,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            maxWidth: '62ch',
          }}
        >
          {visit.notes.trim()}
        </p>
      )}

      {visit.review_photos.length > 0 && (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
          {visit.review_photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.image_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open photo"
              style={{
                display: 'block',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                background: `url(${photo.image_url}) center/cover no-repeat, var(--bg-subtle)`,
              }}
            />
          ))}
        </div>
      )}
    </li>
  )
}

function visitAction(color: string): React.CSSProperties {
  return { minHeight: 44, padding: '0 6px', border: 'none', background: 'none', color, fontSize: 14, fontWeight: 500 }
}
