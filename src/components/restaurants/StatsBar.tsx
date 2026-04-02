'use client'

import { formatEuroAmount } from '@/lib/reviewStats'

interface StatsBarProps {
  total: number
  tried: number
  wantToTry: number
  favorites: number
  totalVisits: number
  averageRating: number | null
  averageSpendPerPerson: number | null
  topRestaurant: { name: string; count: number } | null
  topCategory: { name: string; count: number } | null
  thisMonthVisits: number
}

export function StatsBar({
  total,
  tried,
  wantToTry,
  favorites,
  totalVisits,
  averageRating,
  averageSpendPerPerson,
  topRestaurant,
  topCategory,
  thisMonthVisits,
}: StatsBarProps) {
  return (
    <div style={{ padding: '0 16px 8px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 12,
        }}
      >
        {[
          { label: 'Want to try', value: wantToTry, color: 'var(--accent-primary)', bg: 'var(--accent-primary-light)' },
          { label: 'Tried', value: tried, color: 'var(--accent-secondary)', bg: 'var(--accent-secondary-light)' },
          { label: 'Favourites', value: favorites, color: 'var(--accent-gold)', bg: 'var(--accent-gold-light)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            background: bg,
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            border: `1px solid ${color}25`,
          }}>
            <div style={{ fontSize: 22, fontWeight: 600, color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color, opacity: 0.8, marginTop: 3, fontWeight: 500, letterSpacing: '0.02em' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {[
          {
            label: 'Average Rating',
            value: averageRating !== null ? `${averageRating.toFixed(1)} / 5` : 'No ratings',
            sublabel: `${totalVisits} total visits`,
          },
          {
            label: 'Average Spend',
            value: averageSpendPerPerson !== null ? `${formatEuroAmount(averageSpendPerPerson)} pp` : 'No spend data',
            sublabel: `${thisMonthVisits} visit${thisMonthVisits === 1 ? '' : 's'} this month`,
          },
          {
            label: 'Top Restaurant',
            value: topRestaurant?.name ?? 'No visits yet',
            sublabel: topRestaurant ? `${topRestaurant.count} visit${topRestaurant.count === 1 ? '' : 's'}` : `${total} restaurants saved`,
          },
          {
            label: 'Top Category',
            value: topCategory?.name ?? 'Uncategorized',
            sublabel: topCategory ? `${topCategory.count} tagged visits` : 'Add categories to compare',
          },
        ].map(({ label, value, sublabel }) => (
          <div
            key={label}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 15px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              minHeight: 88,
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              {label}
            </div>
            <div style={{ fontSize: 18, lineHeight: 1.2, color: 'var(--text-primary)', fontWeight: 600 }}>
              {value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
              {sublabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
