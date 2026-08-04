import type { RestaurantStatus } from '@/types'

interface EmptyStateProps {
  status: RestaurantStatus
  /** Any narrowing filter is on — search, favourites, a pen or a category */
  filtered?: boolean
  onAdd: () => void
}

export function EmptyState({ status, filtered = false, onAdd }: EmptyStateProps) {
  const copy = filtered
    ? { title: 'nothing matches', hint: 'Clear the search, star or pen filter.' }
    : status === 'tried'
    ? { title: 'no ticks yet', hint: 'Tick a place off after you go and it lands here.' }
    : { title: 'nothing to try', hint: 'Add the first place you two want to eat at.' }

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
      <h3 className="font-script" style={{ fontSize: 34, fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.1 }}>
        {copy.title}
      </h3>
      <p className="font-stamp" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
        {copy.hint}
      </p>
      {!filtered && status === 'want_to_try' && (
        <button
          onClick={onAdd}
          className="label-caps"
          style={{
            marginTop: 14,
            padding: '12px 22px 11px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-primary)',
            border: 'none',
            color: '#fff',
            fontSize: 10.5,
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
