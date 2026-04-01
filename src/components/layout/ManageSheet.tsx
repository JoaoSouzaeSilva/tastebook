'use client'

import { useEffect } from 'react'

type ManageAction = {
  label: string
  onClick: () => void
  tone?: 'default' | 'accent' | 'danger'
}

interface ManageSheetProps {
  actions: ManageAction[]
  onClose: () => void
}

export function ManageSheet({ actions, onClose }: ManageSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          boxShadow: 'var(--shadow-xl)',
          padding: '12px 20px max(20px, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--border-default)' }} />
        </div>

        <div style={{ padding: '4px 4px 14px' }}>
          <h2 className="font-display" style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 4 }}>
            Manage Tastebook
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                onClose()
                action.onClick()
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                border: action.tone === 'accent' ? '1px solid rgba(200,92,56,0.22)' : '1px solid var(--border-subtle)',
                background: action.tone === 'accent' ? 'var(--accent-primary-light)' : 'var(--bg-base)',
                color: action.tone === 'danger' ? '#B91C1C' : action.tone === 'accent' ? 'var(--accent-primary)' : 'var(--text-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600 }}>{action.label}</div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: 14,
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
