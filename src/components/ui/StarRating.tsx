'use client'

import { useId, useState } from 'react'

interface StarRatingProps {
  value?: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 14, md: 20, lg: 28 }

export function StarRating({ value = 0, onChange, readonly, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const ratingId = useId().replace(/:/g, '')
  const px = sizes[size]
  const active = hovered || value

  function getStepValue(event: React.MouseEvent<HTMLButtonElement>, star: number) {
    const { left, width } = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - left
    return clickX < width / 2 ? star - 0.5 : star
  }

  return (
    <div
      style={{ display: 'flex', gap: 2 }}
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        (() => {
          const fillRatio = Math.max(0, Math.min(1, active - (star - 1)))
          const clipId = `star-fill-${ratingId}-${size}-${star}`

          return (
            <button
              key={star}
              type="button"
              onClick={(event) => !readonly && onChange?.(getStepValue(event, star))}
              onMouseMove={(event) => !readonly && setHovered(getStepValue(event, star))}
              style={{
                background: 'none',
                border: 'none',
                padding: 1,
                cursor: readonly ? 'default' : 'pointer',
                lineHeight: 1,
              }}
            >
              <svg width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="var(--border-default)"
                  stroke="var(--border-default)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: 'fill 0.15s, stroke 0.15s' }}
                />
                {fillRatio > 0 && (
                  <>
                    <defs>
                      <clipPath id={clipId}>
                        <rect x="0" y="0" width={24 * fillRatio} height="24" />
                      </clipPath>
                    </defs>
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill="var(--accent-gold)"
                      stroke="var(--accent-gold)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      clipPath={`url(#${clipId})`}
                      style={{ transition: 'fill 0.15s, stroke 0.15s' }}
                    />
                  </>
                )}
              </svg>
            </button>
          )
        })()
      ))}
    </div>
  )
}
