'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRestaurants } from '@/hooks/useRestaurants'
import { ManageSheet } from '@/components/layout/ManageSheet'
import { LedgerHeader } from '@/components/layout/LedgerHeader'
import { useTheme } from '@/components/layout/ThemeProvider'
import { BottomNav, type AppTab } from '@/components/layout/BottomNav'
import { LedgerList } from '@/components/restaurants/LedgerList'
import { FilterSheet } from '@/components/restaurants/FilterSheet'
import { RestaurantModal } from '@/components/restaurants/RestaurantModal'
import { RestaurantDetailModal } from '@/components/restaurants/RestaurantDetailModal'
import { CategoryManagerModal } from '@/components/restaurants/CategoryManagerModal'
import { BulkCategoryModal } from '@/components/restaurants/BulkCategoryModal'
import { BulkImportModal } from '@/components/restaurants/BulkImportModal'
import { MarkTriedModal } from '@/components/restaurants/MarkTriedModal'
import { StatsView } from '@/components/restaurants/StatsView'
import { EmptyState } from '@/components/restaurants/EmptyState'
import { SkeletonCard } from '@/components/restaurants/SkeletonCard'
import { Sheet, SheetBody } from '@/components/ui/Sheet'
import { restaurantDistanceKm } from '@/lib/geo'
import type { Restaurant, RestaurantVisit } from '@/types'

// Leaflet touches `window` at module load — client-only
const MapView = dynamic(() => import('@/components/restaurants/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: '62svh', borderRadius: 'var(--radius-lg)' }} />,
})

export default function HomePage() {
  const { theme, toggle } = useTheme()
  const {
    allRestaurants, restaurants, categories, filters, loading, stats, overviewStats,
    addRestaurant, addRestaurantsBulk, bulkUpdateRestaurantCategories, addCategory, editCategory, removeCategory, editRestaurant, removeRestaurant, tryRestaurant, editVisit, removeVisit, favoriteRestaurant, updateFilters,
    userLocation, locationError, requestLocation,
  } = useRestaurants()

  const [tab, setTab] = useState<AppTab>('list')
  const [addOpen, setAddOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false)
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)
  const [manageSheetOpen, setManageSheetOpen] = useState(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [triedTargetId, setTriedTargetId] = useState<string | null>(null)
  const [editingVisitTarget, setEditingVisitTarget] = useState<{ restaurantId: string; visit: RestaurantVisit } | null>(null)

  useEffect(() => {
    if (tab === 'map' && !userLocation) requestLocation()
  }, [tab, userLocation, requestLocation])

  async function handleSignOut() {
    await createClient().auth.signOut()
    window.location.href = '/auth'
  }

  const distanceOf = useCallback(
    (restaurant: Restaurant) => restaurantDistanceKm(restaurant, userLocation) ?? null,
    [userLocation]
  )

  const detailTarget = detailTargetId ? allRestaurants.find((r) => r.id === detailTargetId) ?? null : null
  const editTarget = editTargetId ? allRestaurants.find((r) => r.id === editTargetId) ?? null : null
  const triedTarget = triedTargetId ? allRestaurants.find((r) => r.id === triedTargetId) ?? null : null

  const narrowed = Boolean(filters.search || filters.category_id || filters.favoritesOnly)

  const manageActions = [
    { label: 'Manage categories', onClick: () => setManageCategoriesOpen(true) },
    { label: 'Import a batch of places', onClick: () => setBulkImportOpen(true) },
    { label: 'Categorize the visible list', onClick: () => setBulkCategoryOpen(true) },
    { label: theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode', onClick: toggle },
    { label: 'Sign out', onClick: handleSignOut, tone: 'danger' as const },
  ]

  return (
    <div className="paper" style={{ minHeight: '100svh', maxWidth: 720, margin: '0 auto', overflowX: 'hidden', width: '100%' }}>
      <LedgerHeader
        filters={filters}
        categories={categories}
        counts={{ wantToTry: stats.wantToTry, tried: stats.tried }}
        onChange={updateFilters}
        onManage={() => setManageSheetOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenFilters={() => setFilterSheetOpen(true)}
      />

      <main style={{ paddingBottom: 'calc(104px + env(safe-area-inset-bottom))' }}>
        {tab === 'map' ? (
          <div style={{ padding: '14px 16px' }}>
            <MapView
              restaurants={restaurants}
              userLocation={userLocation}
              locationError={locationError}
              onRequestLocation={requestLocation}
              onOpenRestaurant={setDetailTargetId}
            />
          </div>
        ) : loading ? (
          <div className="card-grid" style={{ padding: '18px 16px 8px' }} aria-busy="true" aria-label="Loading places">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <EmptyState status={filters.status} filtered={narrowed} onAdd={() => setAddOpen(true)} />
        ) : (
          <>
            {filters.sort === 'nearest' && locationError && (
              <p
                role="status"
                style={{
                  margin: '14px 16px 0',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--warn-bg)',
                  color: 'var(--warn)',
                  fontSize: 14,
                  lineHeight: 1.4,
                }}
              >
                {locationError}
              </p>
            )}

            <LedgerList
              restaurants={restaurants}
              distanceOf={distanceOf}
              onOpen={setDetailTargetId}
              onMarkTried={setTriedTargetId}
              onToggleFavorite={(restaurant) => favoriteRestaurant(restaurant.id, !restaurant.is_favorite)}
            />
          </>
        )}
      </main>

      <BottomNav tab={tab} onTabChange={setTab} onAdd={() => setAddOpen(true)} />

      {filterSheetOpen && (
        <FilterSheet
          filters={filters}
          categories={categories}
          onChange={updateFilters}
          onClose={() => setFilterSheetOpen(false)}
        />
      )}

      {statsOpen && (
        <Sheet onClose={() => setStatsOpen(false)}>
          <SheetBody style={{ padding: '8px 20px max(24px, env(safe-area-inset-bottom))' }}>
            <h2 className="font-script" style={{ fontSize: 30, color: 'var(--text-primary)', padding: '4px 2px 16px' }}>
              The year so far
            </h2>
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
          </SheetBody>
        </Sheet>
      )}

      {manageSheetOpen && <ManageSheet actions={manageActions} onClose={() => setManageSheetOpen(false)} />}

      {addOpen && (
        <RestaurantModal
          categories={categories}
          onSave={addRestaurant}
          onClose={() => setAddOpen(false)}
          initialStatus={filters.status}
        />
      )}

      {bulkImportOpen && (
        <BulkImportModal
          categories={categories}
          existingRestaurants={allRestaurants}
          onImport={addRestaurantsBulk}
          onClose={() => setBulkImportOpen(false)}
        />
      )}

      {manageCategoriesOpen && (
        <CategoryManagerModal
          categories={categories}
          onCreate={addCategory}
          onUpdate={editCategory}
          onDelete={removeCategory}
          onClose={() => setManageCategoriesOpen(false)}
        />
      )}

      {bulkCategoryOpen && (
        <BulkCategoryModal
          restaurants={restaurants}
          categories={categories}
          onApply={bulkUpdateRestaurantCategories}
          onClose={() => setBulkCategoryOpen(false)}
        />
      )}

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

      {editTarget && (
        <RestaurantModal
          restaurant={editTarget}
          categories={categories}
          onSave={(data) => editRestaurant(editTarget.id, data)}
          onClose={() => setEditTargetId(null)}
        />
      )}

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
