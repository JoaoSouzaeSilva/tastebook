'use client'

import { useState, useEffect } from 'react'
import type { Restaurant, Category, CreateRestaurantInput, PriceLevel } from '@/types'
import { StarRating } from '../ui/StarRating'
import { PriceIndicator } from '../ui/PriceIndicator'
import { CategoryBadge } from '../ui/CategoryBadge'

interface RestaurantModalProps {
  restaurant?: Restaurant | null
  categories: Category[]
  onSave: (data: CreateRestaurantInput) => Promise<void>
  onClose: () => void
  initialStatus?: 'want_to_try' | 'tried'
}

export function RestaurantModal({ restaurant, categories, onSave, onClose, initialStatus }: RestaurantModalProps) {
  const isEdit = !!restaurant

  const [name, setName] = useState(restaurant?.name ?? '')
  const [mapsLink, setMapsLink] = useState(restaurant?.google_maps_link ?? '')
  const [address, setAddress] = useState(restaurant?.address ?? '')
  const [status, setStatus] = useState<'want_to_try' | 'tried'>(restaurant?.status ?? initialStatus ?? 'want_to_try')
  const [rating, setRating] = useState(restaurant?.rating ?? 0)
  const [notes, setNotes] = useState(restaurant?.notes ?? '')
  const [price, setPrice] = useState<PriceLevel | undefined>(restaurant?.avg_price)
  const [photoUrl, setPhotoUrl] = useState(restaurant?.photo_url ?? '')
  const [dateVisited, setDateVisited] = useState(restaurant?.date_visited ?? '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    restaurant?.categories?.map((c) => c.id) ?? []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Trap focus / close on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        google_maps_link: mapsLink || undefined,
        address: address || undefined,
        status,
        rating: rating || undefined,
        notes: notes || undefined,
        avg_price: price,
        photo_url: photoUrl || undefined,
        date_visited: dateVisited || undefined,
        category_ids: selectedCategories,
      })
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    fontSize: 15, background: 'var(--bg-base)',
    color: 'var(--text-primary)',
    outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'var(--font-body)',
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: 13, fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  }

  return (
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
      }}
    >
      <div
        className="animate-fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          maxHeight: '92svh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Handle */}
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-default)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit restaurant' : 'Add restaurant'}
          </h2>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-default)', background: 'var(--bg-subtle)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1,
          }}>×</button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Name */}
            <div>
              <label style={labelStyle}>Restaurant name *</label>
              <input
                style={inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tasca do Chico"
                required
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>

            {/* Google Maps */}
            <div>
              <label style={labelStyle}>Google Maps link</label>
              <input
                style={inputStyle}
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                placeholder="https://maps.google.com/..."
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>

            {/* Address */}
            <div>
              <label style={labelStyle}>Address / neighbourhood</label>
              <input
                style={inputStyle}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Alfama, Lisbon"
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { value: 'want_to_try', label: '🔖 Want to try' },
                  { value: 'tried', label: '✓ Tried it' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    style={{
                      flex: 1, padding: '10px 0',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${status === value ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                      background: status === value ? 'var(--accent-primary-light)' : 'transparent',
                      color: status === value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: 14, fontWeight: status === value ? 500 : 400,
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label style={labelStyle}>Categories</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categories.map((cat) => {
                  const selected = selectedCategories.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-full)',
                        border: `1.5px solid ${selected ? cat.color : 'var(--border-default)'}`,
                        background: selected ? `${cat.color}18` : 'transparent',
                        color: selected ? cat.color : 'var(--text-muted)',
                        fontSize: 13, fontWeight: selected ? 500 : 400,
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {cat.icon && <span style={{ marginRight: 4 }}>{cat.icon}</span>}
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price */}
            <div>
              <label style={labelStyle}>Price range</label>
              <PriceIndicator value={price} onChange={setPrice} />
            </div>

            {/* Rating — only if tried */}
            {status === 'tried' && (
              <div>
                <label style={labelStyle}>Rating</label>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
            )}

            {/* Date visited */}
            {status === 'tried' && (
              <div>
                <label style={labelStyle}>Date visited</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={dateVisited}
                  onChange={(e) => setDateVisited(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label style={labelStyle}>Notes {status === 'tried' ? '/ review' : ''}</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={status === 'tried' ? 'What did you think? What did you order?' : 'Why you want to go, what to order…'}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>

            {/* Photo URL */}
            <div>
              <label style={labelStyle}>Photo URL (optional)</label>
              <input
                style={inputStyle}
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                background: '#FEF2F2', border: '1px solid #FECACA',
                color: '#DC2626', fontSize: 13,
              }}>{error}</div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: 10,
        }}>
          <button onClick={onClose} type="button" style={{
            flex: 1, padding: '13px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-default)',
            background: 'transparent', color: 'var(--text-secondary)',
            fontSize: 15, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 2, padding: '13px',
              borderRadius: 'var(--radius-md)',
              background: saving ? 'var(--border-default)' : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark) 100%)',
              border: 'none', color: '#fff',
              fontSize: 15, fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              boxShadow: saving ? 'none' : '0 4px 12px rgba(200, 92, 56, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add restaurant'}
          </button>
        </div>
      </div>
    </div>
  )
}
