'use client'

import type { Category, FilterState } from '@/types'

interface FilterBarProps {
  filters: FilterState
  categories: Category[]
  onChange: (patch: Partial<FilterState>) => void
  counts: { all: number; want_to_try: number; tried: number; favorites: number }
}

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'want_to_try', label: 'To try' },
  { value: 'tried', label: 'Tried' },
  { value: 'favorites', label: 'Faves' },
] as const

export function FilterBar({ filters, categories, onChange, counts }: FilterBarProps) {
  const countMap: Record<string, number> = {
    all: counts.all,
    want_to_try: counts.want_to_try,
    tried: counts.tried,
    favorites: counts.favorites,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Status segmented control */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 4,
          padding: 4,
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {TABS.map((tab) => {
          const active = filters.status === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => onChange({ status: tab.value })}
              style={{
                minWidth: 0,
                padding: '7px 4px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: active ? 'var(--bg-surface)' : 'transparent',
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                boxShadow: active ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tab.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, opacity: active ? 1 : 0.7 }}>{countMap[tab.value] ?? 0}</span>
            </button>
          )
        })}
      </div>

      {/* Search + sort */}
      <div style={{ display: 'flex', gap: 8, minWidth: 0 }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '0 14px',
            border: '1px solid var(--border-subtle)',
            height: 40,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search…"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              color: 'var(--text-primary)',
              outline: 'none',
              minWidth: 0,
            }}
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: '' })}
              aria-label="Clear search"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          )}
        </div>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as FilterState['sort'] })}
          aria-label="Sort restaurants"
          style={{
            height: 40,
            padding: '0 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            fontWeight: 500,
            maxWidth: 130,
          }}
        >
          <option value="nearest">Near me</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rating">Top rated</option>
          <option value="best_value">Best value</option>
          <option value="most_revisited">Most visits</option>
          <option value="would_go_again">Go again</option>
          <option value="name">A–Z</option>
        </select>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            margin: '0 -16px',
            padding: '0 16px 2px',
          }}
        >
          <button
            onClick={() => onChange({ category_id: null })}
            style={{
              flexShrink: 0,
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${!filters.category_id ? 'var(--accent-primary)' : 'var(--border-default)'}`,
              background: !filters.category_id ? 'var(--accent-primary-light)' : 'transparent',
              color: !filters.category_id ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            All
          </button>
          {categories.map((cat) => {
            const active = filters.category_id === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => onChange({ category_id: active ? null : cat.id })}
                style={{
                  flexShrink: 0,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: `1.5px solid ${active ? cat.color : 'var(--border-default)'}`,
                  background: active ? `${cat.color}18` : 'transparent',
                  color: active ? cat.color : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {cat.icon && <span style={{ marginRight: 4 }}>{cat.icon}</span>}
                {cat.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
