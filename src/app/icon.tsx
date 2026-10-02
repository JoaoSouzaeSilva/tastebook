import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          // The app's single accent, terracotta
          background: '#B0432A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
          <path
            d="M8 6C8 6 7 14 12 16C12 16 10 18 10 22H22C22 18 20 16 20 16C25 14 24 6 24 6"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 22V26M20 22V26M10 26H22"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
