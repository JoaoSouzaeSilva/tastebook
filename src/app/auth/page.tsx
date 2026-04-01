'use client'

import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Check your email for a confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/'
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-base)',
    }}>
      {/* Logo / Hero */}
      <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(200, 92, 56, 0.3)',
          background: 'var(--bg-subtle)',
          border: '1px solid rgba(200,92,56,0.12)',
        }}>
          <Image
            src="/tastebook.png"
            alt="Tastebook"
            width={64}
            height={64}
            priority
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <h1 className="font-display" style={{ fontSize: 36, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
          Tastebook
        </h1>
      </div>

      {/* Card */}
      <div className="animate-fade-up" style={{
        animationDelay: '100ms',
        width: '100%', maxWidth: 400,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 28px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
          marginBottom: 28,
        }}>
          {(['login', 'signup'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '8px 0',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500,
              fontFamily: 'var(--font-body)',
              background: mode === m ? 'var(--bg-surface)' : 'transparent',
              color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s',
            }}>
              {m === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: 15, background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: 15, background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: '#FEF2F2', border: '1px solid #FECACA',
              color: '#DC2626', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-secondary-light)', border: '1px solid var(--accent-secondary)',
              color: 'var(--accent-secondary)', fontSize: 13,
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              borderRadius: 'var(--radius-md)',
              background: loading ? 'var(--border-default)' : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark) 100%)',
              border: 'none', color: '#fff',
              fontSize: 15, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.2s',
              marginTop: 4,
              boxShadow: loading ? 'none' : '0 4px 12px rgba(200, 92, 56, 0.35)',
            }}
          >
            {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

      </div>
    </div>
  )
}
