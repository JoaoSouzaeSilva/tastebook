'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRestaurants } from '@/hooks/useRestaurants'
import { ManageSheet } from '@/components/layout/ManageSheet'
import { useTheme } from '@/components/layout/ThemeProvider'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { RestaurantModal } from '@/components/restaurants/RestaurantModal'
import { RestaurantDetailModal } from '@/components/restaurants/RestaurantDetailModal'
import { CategoryManagerModal } from '@/components/restaurants/CategoryManagerModal'
import { BulkCategoryModal } from '@/components/restaurants/BulkCategoryModal'
import { BulkImportModal } from '@/components/restaurants/BulkImportModal'
import { MarkTriedModal } from '@/components/restaurants/MarkTriedModal'
import { FilterBar } from '@/components/restaurants/FilterBar'
import { StatsBar } from '@/components/restaurants/StatsBar'
import { EmptyState } from '@/components/restaurants/EmptyState'
import { SkeletonCard } from '@/components/restaurants/SkeletonCard'
import type { RestaurantVisit } from '@/types'

export default function HomePage() {
  const { theme, toggle } = useTheme()
  const {
    allRestaurants, restaurants, categories, filters, loading, stats, overviewStats,
    addRestaurant, addRestaurantsBulk, bulkUpdateRestaurantCategories, addCategory, editCategory, removeCategory, editRestaurant, removeRestaurant, tryRestaurant, editVisit, favoriteRestaurant, updateFilters,
  } = useRestaurants()

  const [addOpen, setAddOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false)
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)
  const [manageSheetOpen, setManageSheetOpen] = useState(false)
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [triedTargetId, setTriedTargetId] = useState<string | null>(null)
  const [editingVisitTarget, setEditingVisitTarget] = useState<{ restaurantId: string; visit: RestaurantVisit } | null>(null)
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

  const detailTarget = detailTargetId ? allRestaurants.find((restaurant) => restaurant.id === detailTargetId) ?? null : null
  const editTarget = editTargetId ? allRestaurants.find((restaurant) => restaurant.id === editTargetId) ?? null : null
  const triedTarget = triedTargetId ? allRestaurants.find((restaurant) => restaurant.id === triedTargetId) ?? null : null
  const manageActions = [
    {
      label: 'Import restaurants',
      onClick: () => setBulkImportOpen(true),
      tone: 'accent' as const,
    },
    {
      label: 'Manage categories',
      onClick: () => setManageCategoriesOpen(true),
    },
    {
      label: 'Bulk categorize visible list',
      onClick: () => setBulkCategoryOpen(true),
    },
    {
      label: theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode',
      onClick: toggle,
    },
    {
      label: 'Sign out',
      onClick: handleSignOut,
      tone: 'danger' as const,
    },
  ]

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg-base)', maxWidth: 640, margin: '0 auto', overflowX: 'hidden', width: '100%' }}>
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 40, padding: 'max(env(safe-area-inset-top), 0px) 16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(200,92,56,0.25)', flexShrink: 0, background: 'var(--bg-subtle)', border: '1px solid rgba(200,92,56,0.12)' }}>
              <Image
                src="/tastebook.png"
                alt="Tastebook"
                width={44}
                height={44}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                priority
              />
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.1 }}>Tastebook</h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1 }}>{userEmail ? userEmail.split('@')[0] : 'Our list'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setManageSheetOpen(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Open manage menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="5" cy="12" r="1.2" fill="currentColor" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                <circle cx="19" cy="12" r="1.2" fill="currentColor" />
              </svg>
            </button>
            <button onClick={() => setAddOpen(true)} style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', border: 'none', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark) 100%)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(200,92,56,0.28)', flexShrink: 0 }} aria-label="Add restaurant">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={{ paddingBottom: 12 }}>
          <FilterBar filters={filters} categories={categories} onChange={updateFilters} counts={allCounts} />
        </div>
      </header>

      {!loading && stats.total > 0 && (
        <div style={{ padding: '16px 0 8px' }}>
          <StatsBar
            total={overviewStats.total}
            tried={overviewStats.tried}
            wantToTry={overviewStats.wantToTry}
            favorites={overviewStats.favorites}
            totalVisits={overviewStats.totalVisits}
            averageRating={overviewStats.averageRating}
            averageSpendPerPerson={overviewStats.averageSpendPerPerson}
            topRestaurant={overviewStats.topRestaurant}
            topCategory={overviewStats.topCategory}
            thisMonthVisits={overviewStats.thisMonthVisits}
          />
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
              <RestaurantCard key={r.id} restaurant={r} animationDelay={i * 60} onOpen={() => setDetailTargetId(r.id)} onEdit={() => setEditTargetId(r.id)} onMarkTried={() => setTriedTargetId(r.id)} onToggleFavorite={() => favoriteRestaurant(r.id, !r.is_favorite)} onDelete={async () => { if (confirm(`Delete "${r.name}"?`)) await removeRestaurant(r.id) }} />
            ))}
          </div>
        )}
      </main>

      {manageSheetOpen && <ManageSheet actions={manageActions} onClose={() => setManageSheetOpen(false)} />}
      {addOpen && <RestaurantModal categories={categories} onSave={addRestaurant} onClose={() => setAddOpen(false)} />}
      {bulkImportOpen && <BulkImportModal categories={categories} existingRestaurants={allRestaurants} onImport={addRestaurantsBulk} onClose={() => setBulkImportOpen(false)} />}
      {manageCategoriesOpen && <CategoryManagerModal categories={categories} onCreate={addCategory} onUpdate={editCategory} onDelete={removeCategory} onClose={() => setManageCategoriesOpen(false)} />}
      {bulkCategoryOpen && <BulkCategoryModal restaurants={restaurants} categories={categories} onApply={bulkUpdateRestaurantCategories} onClose={() => setBulkCategoryOpen(false)} />}
      {detailTarget && (
        <RestaurantDetailModal
          restaurant={detailTarget}
          onClose={() => setDetailTargetId(null)}
          onAddVisit={() => {
            setDetailTargetId(null)
            setTriedTargetId(detailTarget.id)
          }}
          onEditVisit={(visit) => {
            setDetailTargetId(null)
            setEditingVisitTarget({ restaurantId: detailTarget.id, visit })
          }}
        />
      )}
      {editTarget && <RestaurantModal restaurant={editTarget} categories={categories} onSave={(data) => editRestaurant(editTarget.id, data)} onClose={() => setEditTargetId(null)} />}
      {triedTarget && (
        <MarkTriedModal
          onSave={(rating, notes, partySize, totalPaid, wouldGoAgain, worthTheMoney, dateVisited, reviewPhotos) =>
            tryRestaurant(triedTarget.id, rating, notes, partySize, totalPaid, wouldGoAgain, worthTheMoney, dateVisited, reviewPhotos)
          }
          onClose={() => setTriedTargetId(null)}
          isRepeatVisit={triedTarget.status === 'tried'}
        />
      )}
      {editingVisitTarget && (
        <MarkTriedModal
          initialVisit={editingVisitTarget.visit}
          isRepeatVisit
          onSave={(rating, notes, partySize, totalPaid, wouldGoAgain, worthTheMoney, dateVisited, reviewPhotos) =>
            editVisit(
              editingVisitTarget.restaurantId,
              editingVisitTarget.visit.id,
              rating,
              notes,
              partySize,
              totalPaid,
              wouldGoAgain,
              worthTheMoney,
              dateVisited,
              reviewPhotos
            )
          }
          onClose={() => setEditingVisitTarget(null)}
        />
      )}
    </div>
  )
}
