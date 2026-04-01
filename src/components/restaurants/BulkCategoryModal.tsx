'use client'

import { useEffect, useMemo, useState } from 'react'
import { CategoryBadge } from '../ui/CategoryBadge'
import type { Category, Restaurant } from '@/types'

type BulkCategoryMode = 'replace' | 'add'

interface BulkCategoryModalProps {
  restaurants: Restaurant[]
  categories: Category[]
  onApply: (restaurantIds: string[], categoryIds: string[], mode: BulkCategoryMode) => Promise<void>
  onClose: () => void
}

export function BulkCategoryModal({ restaurants, categories, onApply, onClose }: BulkCategoryModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(restaurants.map((restaurant) => restaurant.id))
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [mode, setMode] = useState<BulkCategoryMode>('replace')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, saving])

  const selectedCount = selectedIds.length

  const selectedRestaurants = useMemo(
    () => restaurants.filter((restaurant) => selectedIds.includes(restaurant.id)),
    [restaurants, selectedIds]
  )

  function toggleRestaurant(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.length === 0) {
      setError('Select at least one restaurant')
      return
    }

    if (selectedCategoryIds.length === 0 && mode === 'add') {
      setError('Choose at least one category to add')
      return
    }

    setSaving(true)
    setError('')

    try {
      await onApply(selectedIds, selectedCategoryIds, mode)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk category update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="animate-fade-in"
      onClick={() => {
        if (!saving) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(0,0,0,0.5)',
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
          maxWidth: 560,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          maxHeight: '92svh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-default)' }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <h2 className="font-display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>
              Bulk categories
            </h2>
            <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
              Apply categories to the restaurants currently on screen.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-subtle)',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontSize: 18,
              lineHeight: 1,
              opacity: saving ? 0.5 : 1,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleApply} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {selectedCount} of {restaurants.length} selected
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setSelectedIds(restaurants.map((restaurant) => restaurant.id))} style={linkButtonStyle}>
                  Select all
                </button>
                <button type="button" onClick={() => setSelectedIds([])} style={linkButtonStyle}>
                  Clear
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { value: 'replace', label: 'Replace categories' },
                { value: 'add', label: 'Add to existing' },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${mode === option.value ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                    background: mode === option.value ? 'var(--accent-primary-light)' : 'transparent',
                    color: mode === option.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Categories to apply
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map((category) => {
                  const active = selectedCategoryIds.includes(category.id)
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      style={{
                        border: active ? `1.5px solid ${category.color}` : '1.5px solid var(--border-default)',
                        background: active ? `${category.color}14` : 'transparent',
                        borderRadius: 'var(--radius-full)',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      <CategoryBadge category={category} size="md" />
                    </button>
                  )
                })}
              </div>
              {mode === 'replace' && selectedCategoryIds.length === 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Leaving this empty will clear categories for the selected restaurants.
                </div>
              )}
            </div>

            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: 'var(--bg-base)',
              }}
            >
              {selectedRestaurants.map((restaurant, index) => (
                <label
                  key={restaurant.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderTop: index === 0 ? 'none' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(restaurant.id)}
                    onChange={() => toggleRestaurant(restaurant.id)}
                    style={{ width: 16, height: 16 }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{restaurant.name}</div>
                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {restaurant.categories.length > 0 ? (
                        restaurant.categories.map((category) => (
                          <CategoryBadge key={category.id} category={category} size="sm" />
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No categories</span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', color: '#B91C1C', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={onClose} disabled={saving} style={secondaryActionStyle(saving)}>
                Cancel
              </button>
              <button type="submit" disabled={saving || restaurants.length === 0} style={primaryActionStyle(saving || restaurants.length === 0)}>
                {saving ? 'Saving…' : `Apply to ${selectedCount || 0} restaurant${selectedCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const linkButtonStyle = {
  border: 'none',
  background: 'transparent',
  color: 'var(--accent-primary)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

function secondaryActionStyle(disabled: boolean) {
  return {
    flex: 1,
    height: 48,
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-default)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 15,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontFamily: 'var(--font-body)',
  }
}

function primaryActionStyle(disabled: boolean) {
  return {
    flex: 1.4,
    height: 48,
    borderRadius: 'var(--radius-lg)',
    border: 'none',
    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark) 100%)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontFamily: 'var(--font-body)',
  }
}
