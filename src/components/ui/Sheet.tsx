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
}

export function Sheet({ children, onClose, maxWidth = 560, dismissable = true, panelStyle, animated = true }: SheetProps) {
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
        background: 'rgba(0,0,0,0.5)',
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
          transition: isDragging ? 'none' : 'transform 0.22s ease',
          ...panelStyle,
        }}
      >
        <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-default)' }} />
        </div>
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
        padding: '10px 24px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      <h2 className="font-display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-subtle)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ×
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
        padding: '14px 24px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
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
