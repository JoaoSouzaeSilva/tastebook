'use client'

import { useState, useEffect } from 'react'
import { StarRating } from '../ui/StarRating'

interface MarkTriedModalProps {
  onSave: (rating?: number, notes?: string, reviewPhotos?: File[]) => Promise<void>
  onClose: () => void
}

export function MarkTriedModal({ onSave, onClose }: MarkTriedModalProps) {
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
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
    setSaving(true)
    setError('')
    try {
      await onSave(rating || undefined, notes || undefined, reviewPhotos)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save review')
    } finally {
      setSaving(false)
    }
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
            You tried it!
          </h2>
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <StarRating value={rating} onChange={setRating} size="lg" />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {rating === 0 ? 'Tap to rate' : ['', 'Not great', 'It was okay', 'Pretty good', 'Really liked it', 'Absolutely loved it'][rating]}
          </span>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 24 }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder=""
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
            Skip
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
            {saving ? 'Saving…' : 'Save review'}
          </button>
        </div>
      </div>
    </div>
  )
}
