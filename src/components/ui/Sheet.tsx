'use client'

import { useEffect, useRef, useState } from 'react'

interface SheetProps {
  children: React.ReactNode
  onClose: () => void
  maxWidth?: number
  /** Disable Esc/backdrop dismissal while a save is in flight */
  dismissable?: boolean
  /** Extra styles for the sheet panel (e.g. flex column for sticky footers) */
  panelStyle?: React.CSSProperties
  /** Skip entrance animations — used when swapping content between two sheets in place */
  animated?: boolean
  /** Show the grab handle; off when the content draws its own over a hero image */
  handle?: boolean
}

export function Sheet({ children, onClose, maxWidth = 560, dismissable = true, panelStyle, animated = true, handle = true }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const touchStartYRef = useRef<number | null>(null)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, dismissable])

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    const panel = panelRef.current
    if (!panel) return
    // Only start a dismiss drag when the sheet content is scrolled to the top
    const scroller = panel.querySelector('[data-sheet-scroll]') ?? panel
    if (scroller.scrollTop > 0) return
    touchStartYRef.current = e.touches[0].clientY
    setIsDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!isDragging || touchStartYRef.current === null) return
    const nextDragY = e.touches[0].clientY - touchStartYRef.current
    setDragY(Math.max(0, nextDragY))
  }

  function handleTouchEnd() {
    if (!isDragging) return
    if (dragY > 120 && dismissable) {
      onClose()
      return
    }
    setIsDragging(false)
    setDragY(0)
    touchStartYRef.current = null
  }

  return (
    <div
      className={animated ? 'animate-fade-in' : undefined}
      onClick={() => dismissable && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(24, 16, 10, 0.48)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className={animated ? 'animate-fade-up' : undefined}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          width: '100%',
          maxWidth,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          maxHeight: '92svh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s var(--ease-out)',
          ...panelStyle,
        }}
      >
        {handle && (
          <div style={{ padding: '10px 0 6px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 38, height: 5, borderRadius: 3, background: 'var(--border-strong)' }} />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px 12px 22px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      <h2 className="font-display" style={{ fontSize: 24, fontWeight: 520, color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <span style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </span>
      </button>
    </div>
  )
}

/** Scrollable body region of a Sheet. Drag-to-dismiss only engages when this is scrolled to the top. */
export function SheetBody({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      data-sheet-scroll
      style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SheetFooter({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '12px 20px',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: 10,
        flexShrink: 0,
        background: 'var(--bg-surface)',
      }}
    >
      {children}
    </div>
  )
}
