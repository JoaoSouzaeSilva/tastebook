/** Mirrors a place card's geometry so the grid doesn't jump when data lands. */
export function SkeletonCard() {
  return (
    <div aria-hidden style={{ minWidth: 0 }}>
      <div className="skeleton" style={{ aspectRatio: '4 / 5', borderRadius: 'var(--radius-lg)' }} />
      <div className="skeleton" style={{ height: 16, width: '72%', borderRadius: 6, marginTop: 11 }} />
      <div className="skeleton" style={{ height: 12, width: '44%', borderRadius: 6, marginTop: 8 }} />
    </div>
  )
}
