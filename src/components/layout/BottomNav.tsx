'use client'

export type AppTab = 'list' | 'map'

interface BottomNavProps {
  tab: AppTab
  onTabChange: (tab: AppTab) => void
  onAdd: () => void
}

const iconStroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/**
 * Three items, down from five. Stats became the header's stamp line, and Manage was
 * never navigation — it lives behind the wordmark now.
 */
export function BottomNav({ tab, onTabChange, onAdd }: BottomNavProps) {
  return (
    <nav
      className="glass"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 640,
        zIndex: 60,
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 30px' }}>
        <NavButton active={tab === 'list'} label="List" onClick={() => onTabChange('list')}>
          <path d="M4 6h16M4 12h16M4 18h11" />
        </NavButton>

        <button
          onClick={onAdd}
          aria-label="Add a place"
          style={{
            flex: 'none',
            width: 50,
            height: 50,
            marginTop: -14,
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: 'var(--accent-primary)',
            color: '#fff',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <NavButton active={tab === 'map'} label="Map" onClick={() => onTabChange('map')}>
          <path d="M20.5 10c0 6.6-8.5 12-8.5 12S3.5 16.6 3.5 10a8.5 8.5 0 0 1 17 0z" />
          <circle cx="12" cy="10" r="2.8" />
        </NavButton>
      </div>
    </nav>
  )
}

function NavButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className="label-caps"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        padding: '11px 0 10px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 9.5,
        color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
        transition: 'color 0.15s',
      }}
    >
      <svg width="21" height="21" viewBox="0 0 24 24" {...iconStroke} aria-hidden>
        {children}
      </svg>
      {label}
    </button>
  )
}
