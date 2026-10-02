import type { Category } from '@/types'
import { withAlpha } from '@/lib/colors'

interface CategoryBadgeProps {
  category: Category
  size?: 'sm' | 'md'
  onRemove?: () => void
}

export function CategoryBadge({ category, size = 'sm', onRemove }: CategoryBadgeProps) {
  const color = category.color || '#B0432A'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: size === 'sm' ? '3px 9px' : '6px 12px',
        borderRadius: 'var(--radius-full)',
        background: withAlpha(color, 0.1),
        color: 'var(--text-primary)',
        fontSize: size === 'sm' ? 12.5 : 14,
        fontWeight: 500,
        fontFamily: 'var(--font-body)',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: color, flex: 'none' }} />
      {category.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${category.name}`}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', lineHeight: 1, padding: '0 0 0 2px', fontSize: 16, opacity: 0.6 }}
        >
          ×
        </button>
      )}
    </span>
  )
}
