'use client'

import { useState } from 'react'
import type { RestaurantVisit } from '@/types'
import { StarRating } from '../ui/StarRating'
import { formatEuroAmount, getPricePerPerson } from '@/lib/reviewStats'
import { Sheet, SheetBody, SheetFooter } from '../ui/Sheet'

interface MarkTriedModalProps {
  onSave: (
    rating?: number,
    notes?: string,
    partySize?: number,
    totalPaid?: number,
    wouldGoAgain?: boolean,
    worthTheMoney?: boolean,
    dateVisited?: string,
    reviewPhotos?: File[]
  ) => Promise<void>
  onClose: () => void
  isRepeatVisit?: boolean
  initialVisit?: RestaurantVisit | null
}

export function MarkTriedModal({ onSave, onClose, isRepeatVisit = false, initialVisit = null }: MarkTriedModalProps) {
  const [rating, setRating] = useState(initialVisit?.rating ?? 0)
  const [notes, setNotes] = useState(initialVisit?.notes ?? '')
  const [partySize, setPartySize] = useState(initialVisit?.party_size?.toString() ?? '')
  const [totalPaid, setTotalPaid] = useState(initialVisit?.total_paid?.toString() ?? '')
  const [wouldGoAgain, setWouldGoAgain] = useState<boolean | undefined>(initialVisit?.would_go_again)
  const [worthTheMoney, setWorthTheMoney] = useState<boolean | undefined>(initialVisit?.worth_the_money)
  const [dateVisited, setDateVisited] = useState(initialVisit?.date_visited ?? new Date().toISOString().split('T')[0])
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    const parsedPartySize = partySize ? Number.parseInt(partySize, 10) : undefined
    const parsedTotalPaid = totalPaid ? Number.parseFloat(totalPaid) : undefined

    if (rating <= 0) {
      setError('Add some stars before saving your review')
      return
    }

    if (parsedPartySize !== undefined && (!Number.isInteger(parsedPartySize) || parsedPartySize < 1)) {
      setError('Number of people must be at least 1')
      return
    }

    if (parsedTotalPaid !== undefined && (!Number.isFinite(parsedTotalPaid) || parsedTotalPaid < 0)) {
      setError('Amount paid must be a valid number')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onSave(
        rating,
        notes || undefined,
        parsedPartySize,
        parsedTotalPaid,
        wouldGoAgain,
        worthTheMoney,
        dateVisited || undefined,
        reviewPhotos
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save review')
    } finally {
      setSaving(false)
    }
  }

  const pricePerPerson = getPricePerPerson(
    totalPaid ? Number.parseFloat(totalPaid) : undefined,
    partySize ? Number.parseInt(partySize, 10) : undefined
  )

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    fontSize: 16,
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  }

  const choiceButtonStyle = (selected: boolean, positive: boolean) => ({
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    padding: '10px 12px',
    borderRadius: 'var(--radius-full)',
    border: `1.5px solid ${selected ? (positive ? 'var(--accent-secondary)' : 'var(--warn)') : 'var(--border-default)'}`,
    background: selected ? (positive ? 'var(--accent-secondary-light)' : 'var(--warn-bg)') : 'var(--bg-elevated)',
    color: selected ? (positive ? 'var(--accent-secondary)' : 'var(--warn)') : 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    textAlign: 'center' as const,
  })

  function getRatingLabel(currentRating: number) {
    if (currentRating === 0) return 'Tap left or right side of a star'
    if (Number.isInteger(currentRating)) {
      return ['', 'Not great', 'It was okay', 'Pretty good', 'Really liked it', 'Absolutely loved it'][currentRating]
    }

    return `${currentRating.toFixed(1)} stars`
  }

  return (
    <Sheet onClose={onClose} maxWidth={480} dismissable={!saving}>
      <SheetBody style={{ padding: '12px 24px 24px' }}>
        <div style={{ textAlign: 'center', margin: '4px 0 22px' }}>
          <h2 className="font-display" style={{ fontSize: 30, fontWeight: 520, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {initialVisit ? 'Edit visit' : isRepeatVisit ? 'Another visit' : 'How was it?'}
          </h2>
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <StarRating value={rating} onChange={setRating} size="lg" />
          <span className="font-script" style={{ fontSize: 17, color: rating ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {getRatingLabel(rating)}
          </span>
        </div>

        <div style={{ marginBottom: 24, padding: '16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-base)' }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Quick verdict
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Would go again?
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setWouldGoAgain(true)} style={choiceButtonStyle(wouldGoAgain === true, true)}>Yes, gladly</button>
                <button type="button" onClick={() => setWouldGoAgain(false)} style={choiceButtonStyle(wouldGoAgain === false, false)}>Probably not</button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Worth the money?
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setWorthTheMoney(true)} style={choiceButtonStyle(worthTheMoney === true, true)}>Yes, worth it</button>
                <button type="button" onClick={() => setWorthTheMoney(false)} style={choiceButtonStyle(worthTheMoney === false, false)}>Too expensive</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Number of people
            </label>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              placeholder="2"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Total paid
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={totalPaid}
              onChange={(e) => setTotalPaid(e.target.value)}
              placeholder="48.00"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Visit date
          </label>
          <input
            type="date"
            value={dateVisited}
            onChange={(e) => setDateVisited(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
          />
        </div>

        {pricePerPerson !== null && (
          <p style={{ margin: '-6px 0 22px', fontSize: 15, color: 'var(--text-secondary)' }}>
            That&rsquo;s <strong className="tabular" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatEuroAmount(pricePerPerson)}</strong> per person
          </p>
        )}

        <div style={{ marginBottom: 24 }}>
          <label htmlFor="visit-notes" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Notes
          </label>
          <textarea
            id="visit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you order? Anything to remember?"
            style={{
              width: '100%', padding: '12px 14px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: 16, background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              outline: 'none', minHeight: 80, resize: 'none',
              fontFamily: 'var(--font-body)', lineHeight: 1.5,
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Photos from the visit
          </label>
          {initialVisit && initialVisit.review_photos.length > 0 && (
            <div style={{ marginBottom: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {initialVisit.review_photos.map((photo) => (
                <a
                  key={photo.id}
                  href={photo.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: 'var(--radius-md)',
                    background: `url(${photo.image_url}) center/cover no-repeat`,
                    border: '1px solid var(--border-subtle)',
                  }}
                />
              ))}
            </div>
          )}
          <label
            className="pressable"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 52,
              borderRadius: 'var(--radius-md)',
              border: '1.5px dashed var(--border-strong)',
              color: 'var(--text-secondary)',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            {reviewPhotos.length > 0 ? `${reviewPhotos.length} photo${reviewPhotos.length === 1 ? '' : 's'} chosen` : 'Add photos'}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setReviewPhotos(Array.from(e.target.files ?? []))}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
            />
          </label>
          {reviewPhotos.length > 0 && (
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {reviewPhotos.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                  }}
                >
                  {file.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}
      </SheetBody>

      <SheetFooter>
          <button onClick={onClose} style={{
            flex: 1, height: 50,
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-default)',
            background: 'transparent', color: 'var(--text-secondary)',
            fontSize: 15, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>
            {initialVisit ? 'Cancel' : 'Skip'}
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, height: 50,
            borderRadius: 'var(--radius-full)',
            background: saving ? 'var(--border-default)' : 'var(--accent-primary)',
            border: 'none', color: 'var(--on-accent)',
            fontSize: 16, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            boxShadow: saving ? 'none' : 'var(--shadow-accent)',
            transition: 'all 0.2s',
          }}>
            {saving ? 'Saving…' : 'Save visit'}
          </button>
      </SheetFooter>
    </Sheet>
  )
}
