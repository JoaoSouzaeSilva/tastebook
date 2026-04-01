export function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <div className="skeleton" style={{ height: 80 }} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 22, width: '65%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 4 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 20 }} />
          <div className="skeleton" style={{ height: 20, width: 50, borderRadius: 20 }} />
        </div>
      </div>
    </div>
  )
}
