'use client'

import { Sheet, SheetBody } from '../ui/Sheet'
import { withAlpha } from '@/lib/colors'
import type { Category, FilterState, SortKey } from '@/types'

const SORTS: { value: SortKey; label: string; hint: string }[] = [
  { value: 'nearest', label: 'Nearest', hint: 'Closest to you right now' },
  { value: 'newest', label: 'Newest', hint: 'Most recently added' },
  { value: 'rating', label: 'Top rated', hint: 'Highest average first' },
]

interface FilterSheetProps {
  filters: FilterState
  categories: Category[]
  onChange: (patch: Partial<FilterState>) => void
  onClose: () => void
}

/**
 * Sort and category share one sheet — both answer "narrow this list", and neither
 * earns permanent space in the header. Three sorts, down from eight: the other five
 * were questions two people never asked.
 */
export function FilterSheet({ filters, categories, onChange, onClose }: FilterSheetProps) {
  return (
    <Sheet onClose={onClose}>
      <SheetBody style={{ padding: '4px 20px max(24px, env(safe-area-inset-bottom))' }}>
        <h2 className="font-script" style={{ fontSize: 30, color: 'var(--text-primary)', padding: '4px 2px 14px' }}>
          Sort &amp; filter
        </h2>

        <div className="eyebrow" style={{ padding: '0 2px 8px' }}>
          Order
        </div>
        <div
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            overflow: 'hidden',
          }}
        >
          {SORTS.map((sort, index) => {
            const active = filters.sort === sort.value
            return (
              <button
                key={sort.value}
                onClick={() => {
                  onChange({ sort: sort.value })
                  onClose()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  minHeight: 60,
                  padding: '10px 16px',
                  border: 'none',
                  borderTop: index === 0 ? 'none' : '1px solid var(--border-subtle)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>{sort.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    {sort.hint}
                  </div>
                </div>
                {active && (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 12.5 9 17.5 20 6.5" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {categories.length > 0 && (
          <>
            <div className="eyebrow" style={{ padding: '24px 2px 8px' }}>
              Category
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <button
                onClick={() => {
                  onChange({ category_id: null })
                  onClose()
                }}
                style={chipStyle(!filters.category_id, 'var(--accent-primary)')}
              >
                Everything
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    onChange({ category_id: filters.category_id === category.id ? null : category.id })
                    onClose()
                  }}
                  style={chipStyle(filters.category_id === category.id, category.color)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </>
        )}
      </SheetBody>
    </Sheet>
  )
}

function chipStyle(active: boolean, color: string): React.CSSProperties {
  return {
    minHeight: 40,
    padding: '0 15px',
    borderRadius: 'var(--radius-full)',
    border: `1.5px solid ${active ? color : 'var(--border-default)'}`,
    background: active ? withAlpha(color, 0.14) : 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: 14.5,
    fontFamily: 'var(--font-body)',
    fontWeight: active ? 600 : 500,
  }
}
