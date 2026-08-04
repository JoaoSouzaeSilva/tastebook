/** Mirrors a ledger row's geometry so the list doesn't jump when data lands. */
export function SkeletonCard() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '11px 16px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="skeleton" style={{ width: 23, height: 23, borderRadius: 4, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton" style={{ height: 13, width: '58%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 9, width: '34%', borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ width: 26, height: 11, borderRadius: 4, flexShrink: 0 }} />
    </div>
  )
}
