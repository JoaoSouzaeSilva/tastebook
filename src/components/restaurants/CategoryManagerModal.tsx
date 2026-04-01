'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CategoryBadge } from '../ui/CategoryBadge'
import type { Category, CreateCategoryInput } from '@/types'

interface CategoryManagerModalProps {
  categories: Category[]
  onCreate: (input: CreateCategoryInput) => Promise<void>
  onUpdate: (id: string, input: CreateCategoryInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

const QUICK_COLORS = ['#C85C38', '#2D6A4F', '#185FA5', '#B8860B', '#E24B4A', '#7F77DD', '#D97706', '#0F766E']
const QUICK_ICONS = ['🍝', '🍣', '🥞', '🕯️', '🍔', '🍕', '🥢', '🐟', '🦞', '🌮', '🍷', '☕']

const emptyDraft: CreateCategoryInput = {
  name: '',
  color: '#C85C38',
  icon: '',
}

export function CategoryManagerModal({ categories, onCreate, onUpdate, onDelete, onClose }: CategoryManagerModalProps) {
  const [draft, setDraft] = useState<CreateCategoryInput>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

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

  const previewCategory = useMemo(
    () => ({
      id: 'preview',
      name: draft.name || 'New category',
      color: draft.color || '#C85C38',
      icon: draft.icon || undefined,
      user_id: '',
      created_at: '',
    }),
    [draft]
  )

  function startEdit(category: Category) {
    setEditingId(category.id)
    setDraft({
      name: category.name,
      color: category.color,
      icon: category.icon || '',
    })
    setError('')
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  function resetForm() {
    setEditingId(null)
    setDraft(emptyDraft)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim()) {
      setError('Category name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        name: draft.name.trim(),
        color: draft.color,
        icon: draft.icon?.trim() || undefined,
      }

      if (editingId) {
        await onUpdate(editingId, payload)
      } else {
        await onCreate(payload)
      }

      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save category')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Delete "${category.name}"? Restaurants using it will simply lose that category.`)) return

    setSaving(true)
    setError('')

    try {
      await onDelete(category.id)
      if (editingId === category.id) resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete category')
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>
              Manage categories
            </h2>
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

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {editingId ? 'Edit category' : 'New category'}
                </div>
                {editingId && (
                  <button type="button" onClick={resetForm} style={linkButtonStyle}>
                    Cancel edit
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <CategoryBadge category={previewCategory} size="md" />
              </div>

              <label style={fieldLabelStyle}>
                Name
                <input
                  ref={nameInputRef}
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Mexican"
                  style={inputStyle}
                />
              </label>

              <label style={fieldLabelStyle}>
                Icon
                <input
                  value={draft.icon || ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, icon: e.target.value }))}
                  placeholder="Optional emoji"
                  style={inputStyle}
                  maxLength={4}
                />
              </label>

              <div>
                <div style={{ ...fieldLabelStyle, marginBottom: 8 }}>Quick icons</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {QUICK_ICONS.map((icon) => (
                    <button key={icon} type="button" onClick={() => setDraft((prev) => ({ ...prev, icon }))} style={chipButtonStyle(draft.icon === icon)}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <label style={fieldLabelStyle}>
                Color
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => setDraft((prev) => ({ ...prev, color: e.target.value }))}
                  style={{ ...inputStyle, padding: 6, height: 46 }}
                />
              </label>

              <div>
                <div style={{ ...fieldLabelStyle, marginBottom: 8 }}>Quick colors</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {QUICK_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, color }))}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: draft.color === color ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
                        background: color,
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', color: '#B91C1C', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={saving} style={primaryButtonStyle(saving)}>
                {saving ? 'Saving…' : editingId ? 'Save category' : 'Add category'}
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                Existing categories
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-base)',
                    }}
                  >
                    <CategoryBadge category={category} size="md" />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => startEdit(category)} style={secondaryMiniButtonStyle}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(category)} style={dangerMiniButtonStyle}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const fieldLabelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-secondary)',
}

const inputStyle = {
  width: '100%',
  marginTop: 6,
  padding: '11px 14px',
  border: '1.5px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  fontSize: 15,
  background: 'var(--bg-base)',
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'var(--font-body)',
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

function chipButtonStyle(active: boolean) {
  return {
    padding: '7px 10px',
    borderRadius: 'var(--radius-full)',
    border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-default)'}`,
    background: active ? 'var(--accent-primary-light)' : 'transparent',
    cursor: 'pointer',
    fontSize: 16,
  }
}

function primaryButtonStyle(disabled: boolean) {
  return {
    height: 46,
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

const secondaryMiniButtonStyle = {
  padding: '7px 10px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const dangerMiniButtonStyle = {
  ...secondaryMiniButtonStyle,
  color: '#B91C1C',
  border: '1px solid #FCA5A5',
  background: '#FEF2F2',
}
