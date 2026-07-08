'use client'

interface AddModeToggleProps {
  mode: 'single' | 'bulk'
  onChange: (mode: 'single' | 'bulk') => void
}

export function AddModeToggle({ mode, onChange }: AddModeToggleProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 4,
        padding: 4,
        background: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {([
        { value: 'single', label: 'One place' },
        { value: 'bulk', label: 'Import list' },
      ] as const).map((option) => {
        const active = mode === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              padding: '8px 4px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: active ? 'var(--bg-surface)' : 'transparent',
              color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
