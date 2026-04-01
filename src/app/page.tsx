'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRestaurants } from '@/hooks/useRestaurants'
import { useTheme } from '@/components/layout/ThemeProvider'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { RestaurantModal } from '@/components/restaurants/RestaurantModal'
import { MarkTriedModal } from '@/components/restaurants/MarkTriedModal'
import { FilterBar } from '@/components/restaurants/FilterBar'
import { StatsBar } from '@/components/restaurants/StatsBar'
import { EmptyState } from '@/components/restaurants/EmptyState'
import { SkeletonCard } from '@/components/restaurants/SkeletonCard'
import type { Restaurant } from '@/types'

export default function HomePage() {
  const { theme, toggle } = useTheme()
  const {
    restaurants, categories, filters, loading, stats,
    addRestaurant, editRestaurant, removeRestaurant, tryRestaurant, updateFilters,
  } = useRestaurants()

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Restaurant | null>(null)
  const [triedTarget, setTriedTarget] = useState<Restaurant | null>(null)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '')
    })
  }, [])

  async function handleSignOut() {
    await createClient().auth.signOut()
    window.location.href = '/auth'
  }

  const allCounts = {
    all: stats.total,
    want_to_try: stats.wantToTry,
    tried: stats.tried,
    favorites: stats.favorites,
  }

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg-base)', maxWidth: 640, margin: '0 auto' }}>
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 40, padding: 'max(env(safe-area-inset-top), 0px) 16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-gold) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(200,92,56,0.25)', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><path d="M8 6C8 6 7 14 12 16C12 16 10 18 10 22H22C22 18 20 16 20 16C25 14 24 6 24 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 22V26M20 22V26M10 26H22" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.1 }}>Tastebook</h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1 }}>{userEmail ? userEmail.split('@')[0] : 'Our list'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button onClick={handleSignOut} style={{ padding: '7px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Sign out
            </button>
          </div>
        </div>
        <div style={{ paddingBottom: 12 }}>
          <FilterBar filters={filters} categories={categories} onChange={updateFilters} counts={allCounts} />
        </div>
      </header>

      {!loading && stats.total > 0 && (
        <div style={{ padding: '16px 0 8px' }}>
          <StatsBar total={stats.total} tried={stats.tried} wantToTry={stats.wantToTry} favorites={stats.favorites} />
        </div>
      )}

      <main style={{ padding: '12px 16px', paddingBottom: 100 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : restaurants.length === 0 ? (
          <EmptyState status={filters.status} onAdd={() => setAddOpen(true)} />
        ) : (
          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {restaurants.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} animationDelay={i * 60} onEdit={() => setEditTarget(r)} onMarkTried={() => setTriedTarget(r)} onDelete={async () => { if (confirm(`Delete "${r.name}"?`)) await removeRestaurant(r.id) }} />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={() => setAddOpen(true)}
        style={{ position: 'fixed', bottom: 'max(24px, env(safe-area-inset-bottom))', right: 20, width: 58, height: 58, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark) 100%)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(200,92,56,0.45)', zIndex: 30, transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        aria-label="Add restaurant"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>

      {addOpen && <RestaurantModal categories={categories} onSave={addRestaurant} onClose={() => setAddOpen(false)} />}
      {editTarget && <RestaurantModal restaurant={editTarget} categories={categories} onSave={(data) => editRestaurant(editTarget.id, data)} onClose={() => setEditTarget(null)} />}
      {triedTarget && <MarkTriedModal restaurant={triedTarget} onSave={(rating, notes) => tryRestaurant(triedTarget.id, rating, notes)} onClose={() => setTriedTarget(null)} />}
    </div>
  )
}
