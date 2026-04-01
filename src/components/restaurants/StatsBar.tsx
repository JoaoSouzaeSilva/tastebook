'use client'

interface StatsBarProps {
  total: number
  tried: number
  wantToTry: number
  favorites: number
}

export function StatsBar({ total, tried, wantToTry, favorites }: StatsBarProps) {
  const pct = total > 0 ? Math.round((tried / total) * 100) : 0

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10, padding: '0 16px 4px',
    }}>
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
  )
}
