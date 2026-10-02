'use client'

import { useEffect, useRef, useState } from 'react'
import type { Category, FilterState, SortKey } from '@/types'
import { withAlpha } from '@/lib/colors'

const SORT_LABELS: Record<SortKey, string> = {
  nearest: 'Nearest',
  newest: 'Newest',
  rating: 'Top rated',
}

interface LedgerHeaderProps {
  filters: FilterState
  categories: Category[]
  counts: { wantToTry: number; tried: number }
  onChange: (patch: Partial<FilterState>) => void
  onManage: () => void
  onOpenStats: () => void
  onOpenFilters: () => void
}

/**
 * Masthead, section switch, then the filters as a row of chips. Everything that used
 * to hide behind the wordmark or a stamp line now has a labelled button of its own.
 */
export function LedgerHeader({ filters, categories, counts, onChange, onManage, onOpenStats, onOpenFilters }: LedgerHeaderProps) {
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searching) searchRef.current?.focus()
  }, [searching])

  function closeSearch() {
    setSearching(false)
    onChange({ search: '' })
  }

  return (
    <header
      className="glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        paddingTop: 'env(safe-area-inset-top)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px 0 18px', minHeight: 52 }}>
        <span className="wordmark" style={{ fontSize: 28, lineHeight: 1, flex: 1 }}>
          Tastebook
        </span>

        <IconButton label="Search" active={searching} onClick={() => (searching ? closeSearch() : setSearching(true))}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.8-3.8" />
        </IconButton>
        <IconButton
          label="Only favourites"
          active={filters.favoritesOnly}
          fill={filters.favoritesOnly}
          onClick={() => onChange({ favoritesOnly: !filters.favoritesOnly })}
        >
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
        </IconButton>
        <IconButton label="Stats" onClick={onOpenStats}>
          <path d="M5 20V11M12 20V4M19 20v-6" />
        </IconButton>
        <IconButton label="Settings" onClick={onManage}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </IconButton>
      </div>

      {searching ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px 12px 16px' }}>
          <input
            ref={searchRef}
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search places and notes"
            aria-label="Search places and notes"
            enterKeyHint="search"
            style={{
              flex: 1,
              minWidth: 0,
              height: 44,
              padding: '0 16px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
              fontSize: 16,
              outline: 'none',
            }}
          />
          <button
            onClick={closeSearch}
            style={{ height: 44, padding: '0 10px', border: 'none', background: 'none', fontSize: 15, fontWeight: 500, color: 'var(--accent-primary)' }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Status" style={{ display: 'flex', gap: 22, padding: '4px 18px 0' }}>
            {(
              [
                { value: 'want_to_try', label: 'To try', count: counts.wantToTry },
                { value: 'tried', label: 'Been', count: counts.tried },
              ] as const
            ).map((tab) => {
              const active = filters.status === tab.value
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChange({ status: tab.value })}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    minHeight: 44,
                    padding: '6px 0 8px',
                    border: 'none',
                    background: 'none',
                    borderBottom: `2px solid ${active ? 'var(--text-primary)' : 'transparent'}`,
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                >
                  <span className="font-display" style={{ fontSize: 24, fontWeight: active ? 560 : 420, lineHeight: 1 }}>
                    {tab.label}
                  </span>
                  <span className="tabular" style={{ fontSize: 13, fontWeight: 500 }}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="chip-row" style={{ padding: '10px 16px 12px' }}>
            <button onClick={onOpenFilters} aria-label={`Sort: ${SORT_LABELS[filters.sort]}`} className="pressable" style={chipStyle(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M4 7h16M7 12h10M10 17h4" />
              </svg>
              {SORT_LABELS[filters.sort]}
            </button>
            {categories.map((category) => {
              const active = filters.category_id === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => onChange({ category_id: active ? null : category.id })}
                  aria-pressed={active}
                  className="pressable"
                  style={chipStyle(active, category.color)}
                >
                  {category.name}
                  {active && (
                    <span aria-hidden style={{ fontSize: 15, lineHeight: 1, marginLeft: 2 }}>
                      ×
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </header>
  )
}

function chipStyle(active: boolean, color?: string): React.CSSProperties {
  return {
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 36,
    padding: '0 14px',
    borderRadius: 'var(--radius-full)',
    border: `1px solid ${active && color ? color : 'var(--border-default)'}`,
    background: active && color ? withAlpha(color, 0.14) : 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    whiteSpace: 'nowrap',
  }
}

function IconButton({
  label,
  onClick,
  active = false,
  fill = false,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  fill?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className="pressable"
      style={{
        width: 44,
        height: 44,
        display: 'grid',
        placeItems: 'center',
        border: 'none',
        background: 'none',
        borderRadius: 'var(--radius-full)',
        color: active ? (fill ? 'var(--accent-gold)' : 'var(--accent-primary)') : 'var(--text-secondary)',
      }}
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  )
}
