'use client'

import { formatEuroAmount } from '@/lib/reviewStats'

interface StatsViewProps {
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

export function StatsView({
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
}: StatsViewProps) {
  const triedShare = total > 0 ? Math.round((tried / total) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Headline counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Want to try', value: wantToTry, color: 'var(--accent-primary)', bg: 'var(--accent-primary-light)' },
          { label: 'Tried', value: tried, color: 'var(--accent-secondary)', bg: 'var(--accent-secondary-light)' },
          { label: 'Favourites', value: favorites, color: 'var(--accent-gold)', bg: 'var(--accent-gold-light)' },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            style={{
              background: bg,
              borderRadius: 'var(--radius-lg)',
              padding: '16px 14px',
              border: `1px solid ${color}25`,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 600, color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color, opacity: 0.8, marginTop: 5, fontWeight: 500, letterSpacing: '0.02em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Progress through the list */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            List progress
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
            {tried} of {total} tried · {triedShare}%
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${triedShare}%`,
              height: '100%',
              borderRadius: 4,
              background: 'linear-gradient(90deg, var(--accent-secondary) 0%, var(--accent-gold) 100%)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Detail tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {[
          {
            label: 'Average rating',
            value: averageRating !== null ? `${averageRating.toFixed(1)} / 5` : 'No ratings',
            sublabel: `${totalVisits} total visit${totalVisits === 1 ? '' : 's'}`,
          },
          {
            label: 'Average spend',
            value: averageSpendPerPerson !== null ? `${formatEuroAmount(averageSpendPerPerson)} pp` : 'No spend data',
            sublabel: `${thisMonthVisits} visit${thisMonthVisits === 1 ? '' : 's'} this month`,
          },
          {
            label: 'Top restaurant',
            value: topRestaurant?.name ?? 'No visits yet',
            sublabel: topRestaurant ? `${topRestaurant.count} visit${topRestaurant.count === 1 ? '' : 's'}` : `${total} restaurants saved`,
          },
          {
            label: 'Top category',
            value: topCategory?.name ?? 'Uncategorized',
            sublabel: topCategory ? `${topCategory.count} tagged visits` : 'Add categories to compare',
          },
        ].map(({ label, value, sublabel }) => (
          <div
            key={label}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 15px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              minHeight: 88,
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              {label}
            </div>
            <div style={{ fontSize: 17, lineHeight: 1.25, color: 'var(--text-primary)', fontWeight: 600, overflowWrap: 'break-word' }}>
              {value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{sublabel}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
