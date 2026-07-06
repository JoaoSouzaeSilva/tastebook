interface EmptyStateProps {
  status: string
  searching?: boolean
  onAdd: () => void
}

export function EmptyState({ status, searching = false, onAdd }: EmptyStateProps) {
  const messages: Record<string, { emoji: string; title: string; hint: string }> = {
    all: { emoji: '🍽️', title: 'Your list is empty', hint: 'Add the first spot you two want to try.' },
    want_to_try: { emoji: '🔖', title: 'Nothing on the wishlist', hint: 'Save a place for your next date night.' },
    tried: { emoji: '✓', title: 'No visits yet', hint: 'Mark a place as tried after you go.' },
    favorites: { emoji: '★', title: 'No favourites yet', hint: 'Star the places you keep coming back to.' },
  }
  const { emoji, title, hint } = searching
    ? { emoji: '🔍', title: 'No matches', hint: 'Try a different search or clear the filters.' }
    : messages[status] ?? messages.all

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.6 }}>{emoji}</div>
      <h3 className="font-display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>{hint}</p>
      {!searching && (status === 'all' || status === 'want_to_try') && (
        <button
          onClick={onAdd}
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark) 100%)',
            border: 'none',
            color: '#fff',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            boxShadow: '0 4px 12px rgba(200, 92, 56, 0.3)',
            marginTop: 16,
          }}
        >
          Add a restaurant
        </button>
      )}
    </div>
  )
}
