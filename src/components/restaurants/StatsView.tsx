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

  const details = [
    {
      label: 'Average rating',
      value: averageRating !== null ? `${averageRating.toFixed(1)} / 5` : '—',
      note: `${totalVisits} visit${totalVisits === 1 ? '' : 's'} in total`,
    },
    {
      label: 'Average spend',
      value: averageSpendPerPerson !== null ? `${formatEuroAmount(averageSpendPerPerson)} pp` : '—',
      note: `${thisMonthVisits} visit${thisMonthVisits === 1 ? '' : 's'} this month`,
    },
    {
      label: 'Most visited',
      value: topRestaurant?.name ?? 'No visits yet',
      note: topRestaurant ? `${topRestaurant.count} visit${topRestaurant.count === 1 ? '' : 's'}` : `${total} places saved`,
    },
    {
      label: 'Top category',
      value: topCategory?.name ?? 'Uncategorised',
      note: topCategory ? `${topCategory.count} tagged visit${topCategory.count === 1 ? '' : 's'}` : 'Add categories to compare',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {[
          { label: 'To try', value: wantToTry, color: 'var(--accent-primary)' },
          { label: 'Been', value: tried, color: 'var(--accent-secondary)' },
          { label: 'Starred', value: favorites, color: 'var(--accent-gold)' },
        ].map(({ label, value, color }, index) => (
          <div key={label} style={{ paddingLeft: index === 0 ? 0 : 16, borderLeft: index === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
            <dd className="font-display tabular" style={{ fontSize: 44, fontWeight: 480, lineHeight: 1, color }}>
              {value}
            </dd>
            <dt style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>{label}</dt>
          </div>
        ))}
      </dl>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, fontSize: 14 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Through the list</span>
          <span className="tabular" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {tried} of {total} · {triedShare}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={triedShare}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Share of saved places you have been to"
          style={{ height: 8, borderRadius: 4, background: 'var(--bg-subtle)', overflow: 'hidden' }}
        >
          <div style={{ width: `${triedShare}%`, height: '100%', borderRadius: 4, background: 'var(--accent-secondary)', transition: 'width 0.5s var(--ease-out)' }} />
        </div>
      </div>

      <dl style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {details.map(({ label, value, note }) => (
          <div
            key={label}
            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div style={{ minWidth: 0 }}>
              <dt style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</dt>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{note}</div>
            </div>
            <dd className="font-display tabular" style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', overflowWrap: 'anywhere' }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
