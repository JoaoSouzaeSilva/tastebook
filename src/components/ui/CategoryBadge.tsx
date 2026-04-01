import type { Category } from '@/types'

interface CategoryBadgeProps {
  category: Category
  size?: 'sm' | 'md'
  onRemove?: () => void
}

export function CategoryBadge({ category, size = 'sm', onRemove }: CategoryBadgeProps) {
  const color = category.color || '#C85C38'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: 'var(--radius-full)',
        background: `${color}18`,
        border: `1px solid ${color}35`,
        color: color,
        fontSize: size === 'sm' ? 11 : 13,
        fontWeight: 500,
        fontFamily: 'var(--font-body)',
        whiteSpace: 'nowrap',
      }}
    >
      {category.icon && <span style={{ fontSize: size === 'sm' ? 10 : 12 }}>{category.icon}</span>}
      {category.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', lineHeight: 1, padding: 0, opacity: 0.7 }}
        >
          ×
        </button>
      )}
    </span>
  )
}
