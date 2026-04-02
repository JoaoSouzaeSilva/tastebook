'use client'

import { useState, useEffect } from 'react'
import type { RestaurantVisit } from '@/types'
import { StarRating } from '../ui/StarRating'
import { formatEuroAmount, getPricePerPerson } from '@/lib/reviewStats'

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  async function handleSave() {
    const parsedPartySize = partySize ? Number.parseInt(partySize, 10) : undefined
    const parsedTotalPaid = totalPaid ? Number.parseFloat(totalPaid) : undefined

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
        rating || undefined,
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
    border: '1.5px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    fontSize: 15,
    background: 'var(--bg-base)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  }

  const choiceButtonStyle = (selected: boolean, positive: boolean) => ({
    flex: 1,
    minWidth: 0,
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: `1.5px solid ${selected ? (positive ? 'var(--accent-secondary)' : '#B45309') : 'var(--border-default)'}`,
    background: selected ? (positive ? 'var(--accent-secondary-light)' : '#FEF3C7') : 'transparent',
    color: selected ? (positive ? 'var(--accent-secondary)' : '#92400E') : 'var(--text-secondary)',
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
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        className="animate-fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          maxHeight: '92svh',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '20px 24px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-default)' }} />
        </div>

        {/* Celebration header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h2 className="font-display" style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
            {initialVisit ? 'Edit visit' : isRepeatVisit ? 'Log this visit' : 'You tried it!'}
          </h2>
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <StarRating value={rating} onChange={setRating} size="lg" />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {getRatingLabel(rating)}
          </span>
        </div>

        <div style={{ marginBottom: 24, padding: '16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
            Quick Verdict
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
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-secondary)')}
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
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-secondary)')}
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
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-secondary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
          />
        </div>

        {pricePerPerson !== null && (
          <div style={{ marginBottom: 24, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--accent-secondary-light)', color: 'var(--accent-secondary)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
              Average spend
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {formatEuroAmount(pricePerPerson)} per person
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: 24 }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How was it?"
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: 15, background: 'var(--bg-base)',
              color: 'var(--text-primary)',
              outline: 'none', minHeight: 80, resize: 'none',
              fontFamily: 'var(--font-body)', lineHeight: 1.5,
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-secondary)')}
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
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setReviewPhotos(Array.from(e.target.files ?? []))}
            style={{ display: 'block', width: '100%', fontSize: 13, color: 'var(--text-secondary)' }}
          />
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
          <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', color: '#B91C1C', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '13px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-default)',
            background: 'transparent', color: 'var(--text-secondary)',
            fontSize: 15, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>
            {initialVisit ? 'Cancel' : 'Skip'}
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: '13px',
            borderRadius: 'var(--radius-md)',
            background: saving ? 'var(--border-default)' : 'linear-gradient(135deg, var(--accent-secondary) 0%, #1B4332 100%)',
            border: 'none', color: '#fff',
            fontSize: 15, fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            boxShadow: saving ? 'none' : '0 4px 12px rgba(45, 106, 79, 0.3)',
            transition: 'all 0.2s',
          }}>
            {saving ? 'Saving…' : initialVisit ? 'Save visit' : 'Save review'}
          </button>
        </div>
      </div>
    </div>
  )
}
