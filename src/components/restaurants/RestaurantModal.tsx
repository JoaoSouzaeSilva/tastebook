'use client'

import { useState } from 'react'
import type { Restaurant, Category, CreateRestaurantInput, PriceLevel } from '@/types'
import { StarRating } from '../ui/StarRating'
import { PriceIndicator } from '../ui/PriceIndicator'
import { CategoryBadge } from '../ui/CategoryBadge'
import { Sheet, SheetHeader, SheetBody, SheetFooter } from '../ui/Sheet'
import { AddModeToggle } from './AddModeToggle'

interface RestaurantModalProps {
  restaurant?: Restaurant | null
  categories: Category[]
  onSave: (data: CreateRestaurantInput) => Promise<void>
  onClose: () => void
  initialStatus?: 'want_to_try' | 'tried'
  onSwitchToBulk?: () => void
  animated?: boolean
}

export function RestaurantModal({ restaurant, categories, onSave, onClose, initialStatus, onSwitchToBulk, animated = true }: RestaurantModalProps) {
  const isEdit = !!restaurant

  const [name, setName] = useState(restaurant?.name ?? '')
  const [mapsLink, setMapsLink] = useState(restaurant?.google_maps_link ?? '')
  const [placeId, setPlaceId] = useState(restaurant?.google_place_id ?? '')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    restaurant?.latitude != null && restaurant?.longitude != null
      ? { lat: restaurant.latitude, lng: restaurant.longitude }
      : null
  )
  const [address, setAddress] = useState(restaurant?.address ?? '')
  const [status, setStatus] = useState<'want_to_try' | 'tried'>(restaurant?.status ?? initialStatus ?? 'want_to_try')
  const [rating, setRating] = useState(restaurant?.rating ?? 0)
  const [notes, setNotes] = useState(restaurant?.notes ?? '')
  const [price, setPrice] = useState<PriceLevel | undefined>(restaurant?.avg_price)
  const [partySize, setPartySize] = useState(restaurant?.party_size?.toString() ?? '')
  const [totalPaid, setTotalPaid] = useState(restaurant?.total_paid?.toString() ?? '')
  const [photoUrl, setPhotoUrl] = useState(restaurant?.photo_url ?? '')
  const [dateVisited, setDateVisited] = useState(restaurant?.date_visited ?? '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(restaurant?.categories?.map((c) => c.id) ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fetchingPlace, setFetchingPlace] = useState(false)
  const [placeError, setPlaceError] = useState('')

  async function fetchPlaceDetails() {
    if (!mapsLink.trim()) return
    setFetchingPlace(true)
    setPlaceError('')
    try {
      const res = await fetch('/api/place-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mapsLink }),
      })
      const data = await res.json()
      if (!res.ok) { setPlaceError(data.error ?? 'Lookup failed'); return }
      if (data.name && !name) setName(data.name)
      if (data.address) setAddress(data.address)
      if (data.photo_url) setPhotoUrl(data.photo_url)
      if (data.avg_price) setPrice(data.avg_price)
      if (data.place_id) setPlaceId(data.place_id)
      if (data.google_maps_link) setMapsLink(data.google_maps_link)
      if (data.latitude != null && data.longitude != null) setCoords({ lat: data.latitude, lng: data.longitude })
    } catch {
      setPlaceError('Could not reach the lookup service')
    } finally {
      setFetchingPlace(false)
    }
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }

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

    if (status === 'tried' && rating <= 0) {
      setError('Add some stars before saving your review')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        google_maps_link: mapsLink.trim() || null,
        google_place_id: placeId || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        address: address || undefined,
        status,
        rating: status === 'tried' ? rating : undefined,
        notes: notes || undefined,
        avg_price: price,
        party_size: parsedPartySize,
        total_paid: parsedTotalPaid,
        photo_url: photoUrl || undefined,
        date_visited: dateVisited || undefined,
        category_ids: selectedCategories,
      })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save restaurant')
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
    <Sheet onClose={onClose} dismissable={!saving} animated={animated}>
      <SheetHeader title={isEdit ? 'Edit restaurant' : 'Add restaurant'} onClose={onClose} />

      <SheetBody>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {!isEdit && onSwitchToBulk && (
              <AddModeToggle mode="single" onChange={(mode) => { if (mode === 'bulk') onSwitchToBulk() }} />
            )}

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
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={mapsLink}
                  onChange={(e) => { setMapsLink(e.target.value); setPlaceId(''); setCoords(null); setPlaceError('') }}
                  placeholder="https://maps.google.com/..."
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                />
                <button
                  type="button"
                  onClick={fetchPlaceDetails}
                  disabled={!mapsLink.trim() || fetchingPlace}
                  title="Fill fields from Google Maps"
                  style={{
                    flexShrink: 0,
                    padding: '0 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--accent-primary)',
                    background: fetchingPlace ? 'var(--bg-subtle)' : 'var(--accent-primary-light)',
                    color: 'var(--accent-primary)',
                    fontSize: 13, fontWeight: 500,
                    cursor: (!mapsLink.trim() || fetchingPlace) ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)',
                    opacity: !mapsLink.trim() ? 0.4 : 1,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {fetchingPlace ? '…' : '✦ Fill'}
                </button>
              </div>
              {placeError && (
                <p style={{ marginTop: 6, fontSize: 12, color: '#DC2626' }}>{placeError}</p>
              )}
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
              {selectedCategories.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {categories
                    .filter((cat) => selectedCategories.includes(cat.id))
                    .map((cat) => (
                      <CategoryBadge key={cat.id} category={cat} size="sm" onRemove={() => toggleCategory(cat.id)} />
                    ))}
                </div>
              )}
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

            {status === 'tried' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Number of people</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    style={inputStyle}
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                    placeholder="2"
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Total paid</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    style={inputStyle}
                    value={totalPaid}
                    onChange={(e) => setTotalPaid(e.target.value)}
                    placeholder="48.00"
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label style={labelStyle}>Notes {status === 'tried' ? '/ review' : ''}</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder=""
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
      </SheetBody>

      <SheetFooter>
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
      </SheetFooter>
    </Sheet>
  )
}
