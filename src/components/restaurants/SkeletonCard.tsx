export function SkeletonCard() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: 12,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div className="skeleton" style={{ width: 84, height: 84, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
        <div className="skeleton" style={{ height: 18, width: '60%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 13, width: '40%', borderRadius: 4 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="skeleton" style={{ height: 18, width: 56, borderRadius: 20 }} />
          <div className="skeleton" style={{ height: 18, width: 48, borderRadius: 20 }} />
        </div>
      </div>
    </div>
  )
}
