'use client'

import { useEffect, useRef, useState } from 'react'
import type { Category, FilterState, SortKey } from '@/types'
import { formatEuroAmount } from '@/lib/reviewStats'
import { withAlpha } from '@/lib/colors'

const SORT_LABELS: Record<SortKey, string> = {
  nearest: 'nearest',
  newest: 'newest',
  rating: 'top rated',
}

interface LedgerHeaderProps {
  filters: FilterState
  categories: Category[]
  counts: { wantToTry: number; tried: number }
  summary: {
    averageRating: number | null
    averageSpendPerPerson: number | null
    thisMonthVisits: number
  }
  onChange: (patch: Partial<FilterState>) => void
  onManage: () => void
  onOpenStats: () => void
  onOpenFilters: () => void
}

/**
 * Two rows, not four. Row one is identity and the orthogonal filters (favourites,
 * search); row two is the only mutually-exclusive choice there is.
 * Sort and category live behind one chip, and the old Stats tab is the stamp line.
 */
export function LedgerHeader({
  filters,
  categories,
  counts,
  summary,
  onChange,
  onManage,
  onOpenStats,
  onOpenFilters,
}: LedgerHeaderProps) {
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searching) searchRef.current?.focus()
  }, [searching])

  function closeSearch() {
    setSearching(false)
    onChange({ search: '' })
  }

  const activeCategory = categories.find((category) => category.id === filters.category_id) ?? null

  const stamp = [
    `${counts.wantToTry} to try`,
    `${counts.tried} been`,
    summary.averageRating != null ? `★${summary.averageRating.toFixed(1)}` : null,
    summary.averageSpendPerPerson != null ? `${formatEuroAmount(summary.averageSpendPerPerson)} pp` : null,
    summary.thisMonthVisits > 0 ? `${summary.thisMonthVisits} this month` : null,
  ].filter(Boolean) as string[]

  return (
    <header
      className="glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: 'max(env(safe-area-inset-top), 0px) 0 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 6px' }}>
        <button
          onClick={onManage}
          className="wordmark"
          aria-label="Settings and categories"
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 30,
            lineHeight: 1,
            paddingBottom: 3,
          }}
        >
          Tastebook
        </button>

        <div style={{ flex: 1 }} />

        <IconButton
          label="Search places and notes"
          onClick={() => (searching ? closeSearch() : setSearching(true))}
          active={searching}
        >
          <circle cx="11" cy="11" r="7.5" />
          <path d="m21 21-4.4-4.4" />
        </IconButton>

        <IconButton
          label="Only favourites"
          onClick={() => onChange({ favoritesOnly: !filters.favoritesOnly })}
          active={filters.favoritesOnly}
          fill={filters.favoritesOnly}
        >
          <polygon points="12 3 14.9 9.1 21.5 10 16.7 14.6 17.9 21.1 12 18 6.1 21.1 7.3 14.6 2.5 10 9.1 9.1" />
        </IconButton>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 9px' }}>
        {searching ? (
          <>
            <input
              ref={searchRef}
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Search every place and note…"
              style={{
                flex: 1,
                minWidth: 0,
                height: 34,
                padding: '0 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              onClick={closeSearch}
              className="label-caps"
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 10.5, color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Status"
              style={{
                display: 'flex',
                gap: 2,
                padding: 2,
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {(
                [
                  { value: 'want_to_try', label: 'To try' },
                  { value: 'tried', label: 'Been' },
                ] as const
              ).map((tab) => {
                const active = filters.status === tab.value
                return (
                  <button
                    key={tab.value}
                    role="tab"
                    aria-selected={active}
                    onClick={() => onChange({ status: tab.value })}
                    className="label-caps"
                    style={{
                      padding: '6px 15px 5px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      background: active ? 'var(--bg-surface)' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: active ? 'var(--shadow-sm)' : 'none',
                      transition: 'background 0.16s, color 0.16s',
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div style={{ flex: 1 }} />

            {activeCategory && (
              <button
                onClick={() => onChange({ category_id: null })}
                className="font-stamp"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: `1.5px solid ${activeCategory.color}`,
                  background: withAlpha(activeCategory.color, 0.1),
                  color: activeCategory.color,
                  cursor: 'pointer',
                  fontSize: 11,
                  maxWidth: 130,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeCategory.name}
                </span>
                <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>
                  ×
                </span>
              </button>
            )}

            <button
              onClick={onOpenFilters}
              className="font-stamp"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 11.5,
                color: 'var(--text-muted)',
                padding: '4px 2px',
              }}
            >
              {SORT_LABELS[filters.sort]}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      <button
        onClick={onOpenStats}
        className="font-stamp"
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: '7px 16px 8px',
          border: 'none',
          borderTop: '1px dashed var(--border-default)',
          background: 'none',
          cursor: 'pointer',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        {stamp.join(' · ')}
      </button>
    </header>
  )
}

function IconButton({
  label,
  onClick,
  active,
  fill = false,
  children,
}: {
  label: string
  onClick: () => void
  active: boolean
  fill?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      style={{
        width: 30,
        height: 30,
        display: 'grid',
        placeItems: 'center',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--radius-full)',
        color: active ? 'var(--accent-gold)' : 'var(--text-secondary)',
        transition: 'color 0.15s',
      }}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill={fill ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  )
}
