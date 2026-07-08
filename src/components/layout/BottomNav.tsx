'use client'

export type AppTab = 'places' | 'map' | 'stats'

interface BottomNavProps {
  tab: AppTab
  onTabChange: (tab: AppTab) => void
  onAdd: () => void
  onManage: () => void
}

const iconStroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function NavButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        padding: '10px 0 8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
        transition: 'color 0.15s',
      }}
    >
      {icon}
      <span style={{ fontSize: 11, fontWeight: active ? 600 : 500, letterSpacing: '0.01em' }}>{label}</span>
    </button>
  )
}

export function BottomNav({ tab, onTabChange, onAdd, onManage }: BottomNavProps) {
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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <NavButton
          active={tab === 'places'}
          label="Places"
          onClick={() => onTabChange('places')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" {...iconStroke}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
        />

        <NavButton
          active={tab === 'map'}
          label="Map"
          onClick={() => onTabChange('map')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" {...iconStroke}>
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
          }
        />

        <button
          onClick={onAdd}
          aria-label="Add restaurant"
          style={{
            width: 54,
            height: 54,
            marginTop: -18,
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark) 100%)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(200,92,56,0.38)',
            flexShrink: 0,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <NavButton
          active={tab === 'stats'}
          label="Stats"
          onClick={() => onTabChange('stats')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" {...iconStroke}>
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          }
        />

        <NavButton
          active={false}
          label="Manage"
          onClick={onManage}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" {...iconStroke}>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
              <circle cx="9" cy="7" r="1.8" fill="var(--bg-surface)" />
              <circle cx="15" cy="12" r="1.8" fill="var(--bg-surface)" />
              <circle cx="7" cy="17" r="1.8" fill="var(--bg-surface)" />
            </svg>
          }
        />
      </div>
    </nav>
  )
}
