'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRestaurants } from '@/hooks/useRestaurants'
import { ManageSheet } from '@/components/layout/ManageSheet'
import { useTheme } from '@/components/layout/ThemeProvider'
import { BottomNav, type AppTab } from '@/components/layout/BottomNav'
import { RestaurantCard } from '@/components/restaurants/RestaurantCard'
import { RestaurantModal } from '@/components/restaurants/RestaurantModal'
import { RestaurantDetailModal } from '@/components/restaurants/RestaurantDetailModal'
import { CategoryManagerModal } from '@/components/restaurants/CategoryManagerModal'
import { BulkCategoryModal } from '@/components/restaurants/BulkCategoryModal'
import { BulkImportModal } from '@/components/restaurants/BulkImportModal'
import { MarkTriedModal } from '@/components/restaurants/MarkTriedModal'
import { FilterBar } from '@/components/restaurants/FilterBar'
import { StatsView } from '@/components/restaurants/StatsView'
import { EmptyState } from '@/components/restaurants/EmptyState'
import { SkeletonCard } from '@/components/restaurants/SkeletonCard'
import { restaurantDistanceKm } from '@/lib/geo'
import type { RestaurantVisit } from '@/types'

// Leaflet touches `window` at module load — client-only
const MapView = dynamic(() => import('@/components/restaurants/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => <SkeletonCard />,
})

export default function HomePage() {
  const { theme, toggle } = useTheme()
  const {
    allRestaurants, restaurants, categories, filters, loading, stats, overviewStats,
    addRestaurant, addRestaurantsBulk, bulkUpdateRestaurantCategories, addCategory, editCategory, removeCategory, editRestaurant, removeRestaurant, tryRestaurant, editVisit, removeVisit, favoriteRestaurant, updateFilters,
    userLocation, locationError, requestLocation,
  } = useRestaurants()

  const [tab, setTab] = useState<AppTab>('places')
  // `switched: true` swaps the sheet content in place with no re-entrance animation
  const [addSheet, setAddSheet] = useState<{ mode: 'single' | 'bulk'; switched: boolean } | null>(null)
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

  useEffect(() => {
    if (tab === 'map' && !userLocation) requestLocation()
  }, [tab, userLocation, requestLocation])

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
      <header
        className="glass"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: 'max(env(safe-area-inset-top), 0px) 16px 0',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(200,92,56,0.25)',
                flexShrink: 0,
                background: 'var(--bg-subtle)',
                border: '1px solid rgba(200,92,56,0.12)',
              }}
            >
              <Image
                src="/tastebook.png"
                alt="Tastebook"
                width={36}
                height={36}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                preload
              />
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: 19, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {tab === 'places' ? 'Tastebook' : tab === 'map' ? 'Map' : 'Stats'}
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.2 }}>
                {userEmail ? userEmail.split('@')[0] : 'Our list'}
              </p>
            </div>
          </div>
        </div>
        {tab !== 'stats' && (
          <div style={{ paddingBottom: 10 }}>
            <FilterBar filters={filters} categories={categories} onChange={updateFilters} counts={allCounts} />
          </div>
        )}
      </header>

      <main style={{ padding: '14px 16px', paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
        {tab === 'stats' ? (
          <StatsView
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
        ) : tab === 'map' ? (
          <MapView
            restaurants={restaurants}
            userLocation={userLocation}
            locationError={locationError}
            onRequestLocation={requestLocation}
            onOpenRestaurant={setDetailTargetId}
          />
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <EmptyState status={filters.status} searching={Boolean(filters.search || filters.category_id)} onAdd={() => setAddSheet({ mode: 'single', switched: false })} />
        ) : (
          <>
            {filters.sort === 'nearest' && locationError && (
              <p style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13 }}>
                {locationError}
              </p>
            )}
            <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {restaurants.map((r, i) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  animationDelay={Math.min(i, 8) * 40}
                  distanceKm={restaurantDistanceKm(r, userLocation)}
                  onOpen={() => setDetailTargetId(r.id)}
                  onMarkTried={() => setTriedTargetId(r.id)}
                  onToggleFavorite={() => favoriteRestaurant(r.id, !r.is_favorite)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav tab={tab} onTabChange={setTab} onAdd={() => setAddSheet({ mode: 'single', switched: false })} onManage={() => setManageSheetOpen(true)} />

      {manageSheetOpen && <ManageSheet actions={manageActions} onClose={() => setManageSheetOpen(false)} />}
      {addSheet?.mode === 'single' && (
        <RestaurantModal
          categories={categories}
          onSave={addRestaurant}
          onClose={() => setAddSheet(null)}
          onSwitchToBulk={() => setAddSheet({ mode: 'bulk', switched: true })}
          animated={!addSheet.switched}
        />
      )}
      {addSheet?.mode === 'bulk' && (
        <BulkImportModal
          categories={categories}
          existingRestaurants={allRestaurants}
          onImport={addRestaurantsBulk}
          onClose={() => setAddSheet(null)}
          onSwitchToSingle={() => setAddSheet({ mode: 'single', switched: true })}
          animated={!addSheet.switched}
        />
      )}
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
          onEdit={() => {
            setDetailTargetId(null)
            setEditTargetId(detailTarget.id)
          }}
          onDelete={async () => {
            if (!confirm(`Delete "${detailTarget.name}"?`)) return
            setDetailTargetId(null)
            await removeRestaurant(detailTarget.id)
          }}
          onEditVisit={(visit) => {
            setDetailTargetId(null)
            setEditingVisitTarget({ restaurantId: detailTarget.id, visit })
          }}
          onDeleteVisit={async (visit) => {
            if (!confirm('Delete this visit?')) return
            await removeVisit(detailTarget.id, visit.id)
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
