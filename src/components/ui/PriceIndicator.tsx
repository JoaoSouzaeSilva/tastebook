import type { PriceLevel } from '@/types'

const levels: PriceLevel[] = ['€', '€€', '€€€', '€€€€']

interface PriceIndicatorProps {
  value?: PriceLevel
  onChange?: (v: PriceLevel) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export function PriceIndicator({ value, onChange, readonly, size = 'md' }: PriceIndicatorProps) {
  if (readonly) {
    return (
      <span style={{ fontFamily: 'var(--font-body)', fontSize: size === 'sm' ? 12 : 14, color: 'var(--accent-secondary)', fontWeight: 500 }}>
        {value ?? '—'}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {levels.map((lvl) => (
        <button
          key={lvl}
          type="button"
          onClick={() => onChange?.(lvl)}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${value === lvl ? 'var(--accent-secondary)' : 'var(--border-default)'}`,
            background: value === lvl ? 'var(--accent-secondary-light)' : 'transparent',
            color: value === lvl ? 'var(--accent-secondary)' : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: value === lvl ? 500 : 400,
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'var(--font-body)',
          }}
        >
          {lvl}
        </button>
      ))}
    </div>
  )
}
