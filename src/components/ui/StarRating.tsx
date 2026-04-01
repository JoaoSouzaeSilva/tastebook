'use client'

import { useState } from 'react'

interface StarRatingProps {
  value?: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 14, md: 20, lg: 28 }

export function StarRating({ value = 0, onChange, readonly, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const px = sizes[size]
  const active = hovered || value

  return (
    <div
      style={{ display: 'flex', gap: 2 }}
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          style={{
            background: 'none',
            border: 'none',
            padding: 1,
            cursor: readonly ? 'default' : 'pointer',
            lineHeight: 1,
          }}
        >
          <svg width={px} height={px} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={star <= active ? 'var(--accent-gold)' : 'var(--border-default)'}
              stroke={star <= active ? 'var(--accent-gold)' : 'var(--border-default)'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'fill 0.15s, stroke 0.15s' }}
            />
          </svg>
        </button>
      ))}
    </div>
  )
}
