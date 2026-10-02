import type { RestaurantStatus } from '@/types'

interface EmptyStateProps {
  status: RestaurantStatus
  /** Any narrowing filter is on — search, favourites or a category */
  filtered?: boolean
  onAdd: () => void
}

export function EmptyState({ status, filtered = false, onAdd }: EmptyStateProps) {
  const copy = filtered
    ? { title: 'Nothing matches', hint: 'Try clearing the search, the star or the category.' }
    : status === 'tried'
    ? { title: 'No visits yet', hint: 'Tick a place off after you go and it lands here.' }
    : { title: 'Nothing to try', hint: 'Add the first place you two want to eat at.' }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '72px 32px',
        textAlign: 'center',
        gap: 8,
      }}
    >
      <h3 className="font-script" style={{ fontSize: 32, color: 'var(--text-primary)', lineHeight: 1.1 }}>
        {copy.title}
      </h3>
      <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '30ch' }}>
        {copy.hint}
      </p>
      {!filtered && status === 'want_to_try' && (
        <button
          onClick={onAdd}
          className="pressable"
          style={{
            marginTop: 16,
            height: 48,
            padding: '0 24px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-primary)',
            border: 'none',
            color: 'var(--on-accent)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          Add a place
        </button>
      )}
    </div>
  )
}
