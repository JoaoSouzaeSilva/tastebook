'use client'

import { Sheet, SheetBody } from '../ui/Sheet'

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
  return (
    <Sheet onClose={onClose}>
      <SheetBody style={{ padding: '4px 20px max(20px, env(safe-area-inset-bottom))' }}>
        <h2 className="font-script" style={{ fontSize: 30, color: 'var(--text-primary)', padding: '4px 2px 14px' }}>
          Settings
        </h2>

        <div style={{ borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          {actions.map((action, index) => (
            <button
              key={action.label}
              onClick={() => {
                onClose()
                action.onClick()
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                minHeight: 54,
                padding: '0 16px',
                border: 'none',
                borderTop: index === 0 ? 'none' : '1px solid var(--border-subtle)',
                background: 'transparent',
                color: action.tone === 'danger' ? 'var(--danger)' : action.tone === 'accent' ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {action.label}
              {action.tone !== 'danger' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: 12,
            height: 50,
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-default)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          Close
        </button>
      </SheetBody>
    </Sheet>
  )
}
