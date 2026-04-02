'use client'

import { useState } from 'react'
import type { Category, FilterState } from '@/types'

interface FilterBarProps {
  filters: FilterState
  categories: Category[]
  onChange: (patch: Partial<FilterState>) => void
  counts: { all: number; want_to_try: number; tried: number; favorites: number }
}

const TABS = [
  { value: 'all',          label: 'All' },
  { value: 'want_to_try',  label: 'Want to try' },
  { value: 'tried',        label: 'Tried' },
  { value: 'favorites',    label: '★ Faves' },
] as const

const controlHeight = 46

export function FilterBar({ filters, categories, onChange, counts }: FilterBarProps) {
  const [catOpen, setCatOpen] = useState(false)

  const countMap: Record<string, number> = {
    all: counts.all,
    want_to_try: counts.want_to_try,
    tried: counts.tried,
    favorites: counts.favorites,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Status tabs */}
      <div style={{
        display: 'flex',
        gap: 2,
        padding: '0',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
      }}>
        {TABS.map((tab) => {
          const active = filters.status === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => onChange({ status: tab.value })}
              style={{
                flexShrink: 0,
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                border: `1.5px solid ${active ? 'var(--accent-primary)' : 'transparent'}`,
                background: active ? 'var(--accent-primary-light)' : 'transparent',
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 11,
                background: active ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                color: active ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-full)',
                padding: '1px 6px',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}>
                {countMap[tab.value] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search + Category row */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '10px 0 6px',
        minWidth: 0,
      }}>
        {/* Search */}
        <div style={{
          width: '100%', minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '0 14px',
          border: '1.5px solid var(--border-subtle)',
          transition: 'all 0.2s',
          height: controlHeight,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search names, places, reviews…"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 14, color: 'var(--text-primary)', outline: 'none',
              minWidth: 0,
            }}
          />
          {filters.search && (
            <button onClick={() => onChange({ search: '' })} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 0,
            }}>×</button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, minWidth: 0 }}>
          {/* Category filter */}
          <div style={{ position: 'relative', minWidth: 0 }}>
            <button
              onClick={() => setCatOpen((o) => !o)}
              style={{
                width: '100%',
                height: controlHeight,
                padding: '0 16px',
                borderRadius: 'var(--radius-full)',
                border: `1.5px solid ${filters.category_id ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                background: filters.category_id ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
                color: filters.category_id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {filters.category_id
                  ? categories.find((c) => c.id === filters.category_id)?.name ?? 'Category'
                  : 'Category'}
              </span>
            </button>

            {catOpen && (
              <div
                className="animate-scale-in"
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50, overflow: 'hidden',
                }}
                onMouseLeave={() => setCatOpen(false)}
              >
                <button
                  onClick={() => { onChange({ category_id: null }); setCatOpen(false) }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px',
                    background: !filters.category_id ? 'var(--bg-subtle)' : 'none',
                    border: 'none', cursor: 'pointer', fontSize: 14,
                    color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  All categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { onChange({ category_id: cat.id }); setCatOpen(false) }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 14px',
                      background: filters.category_id === cat.id ? `${cat.color}12` : 'none',
                      border: 'none', cursor: 'pointer', fontSize: 14,
                      color: filters.category_id === cat.id ? cat.color : 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = filters.category_id === cat.id ? `${cat.color}12` : 'none')}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as FilterState['sort'] })}
            style={{
              height: controlHeight,
              padding: '0 14px',
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid var(--border-default)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: 13, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              minWidth: 112,
              fontWeight: 500,
            }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="rating">Highest rated</option>
            <option value="best_value">Best value</option>
            <option value="most_revisited">Most revisited</option>
            <option value="would_go_again">Go again</option>
            <option value="name">A–Z</option>
          </select>
        </div>
      </div>
    </div>
  )
}
