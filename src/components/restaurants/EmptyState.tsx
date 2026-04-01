interface EmptyStateProps {
  status: string
  onAdd: () => void
}

export function EmptyState({ status, onAdd }: EmptyStateProps) {
  const messages: Record<string, { emoji: string; title: string; sub: string }> = {
    all:         { emoji: '🍽️', title: 'Your list is empty',      sub: 'Start adding restaurants you want to try together.' },
    want_to_try: { emoji: '🔖', title: 'Nothing on the wishlist', sub: 'Spots you want to visit will appear here.' },
    tried:       { emoji: '✓',  title: 'No visits yet',           sub: 'Mark restaurants as tried after you visit them.' },
    favorites:   { emoji: '★',  title: 'No favourites yet',       sub: 'Rate a restaurant 4 or 5 stars to see it here.' },
  }
  const { emoji, title, sub } = messages[status] ?? messages.all

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '64px 32px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.6 }}>{emoji}</div>
      <h3 className="font-display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6, maxWidth: 260 }}>
        {sub}
      </p>
      {(status === 'all' || status === 'want_to_try') && (
        <button
          onClick={onAdd}
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark) 100%)',
            border: 'none', color: '#fff',
            fontSize: 15, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            boxShadow: '0 4px 12px rgba(200, 92, 56, 0.3)',
          }}
        >
          Add first restaurant
        </button>
      )}
    </div>
  )
}
