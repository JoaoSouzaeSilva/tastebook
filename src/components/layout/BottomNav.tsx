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
 * Three items: the two views and the one thing you do most. Stats and settings have
 * labelled buttons in the masthead.
 */
export function BottomNav({ tab, onTabChange, onAdd }: BottomNavProps) {
  return (
    <nav
      className="glass glass-solid"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 720,
        zIndex: 60,
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <NavButton active={tab === 'list'} label="List" onClick={() => onTabChange('list')}>
          <path d="M4 6h16M4 12h16M4 18h11" />
        </NavButton>

        <button
          onClick={onAdd}
          aria-label="Add a place"
          className="pressable"
          style={{
            flex: 'none',
            width: 56,
            height: 56,
            marginTop: -18,
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: 'var(--accent-primary)',
            color: 'var(--on-accent)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
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
      className="pressable"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        minHeight: 56,
        padding: '9px 0 8px',
        background: 'none',
        border: 'none',
        fontSize: 11.5,
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        transition: 'color 0.2s',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" {...iconStroke} strokeWidth={active ? 2.2 : 1.9} aria-hidden>
        {children}
      </svg>
      {label}
    </button>
  )
}
