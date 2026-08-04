'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRestaurants } from '@/hooks/useRestaurants'
import { useTonightInvite } from '@/hooks/useTonightInvite'
import { usePeople } from '@/hooks/usePeople'
import { ManageSheet } from '@/components/layout/ManageSheet'
import { LedgerHeader } from '@/components/layout/LedgerHeader'
import { useTheme } from '@/components/layout/ThemeProvider'
import { BottomNav, type AppTab } from '@/components/layout/BottomNav'
import { LedgerList } from '@/components/restaurants/LedgerList'
import { TonightDeck } from '@/components/restaurants/TonightDeck'
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
import { penFor } from '@/lib/pens'
import type { Restaurant, RestaurantVisit } from '@/types'

// Leaflet touches `window` at module load — client-only
const MapView = dynamic(() => import('@/components/restaurants/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => <SkeletonCard />,
})

export default function HomePage() {
  const { theme, toggle } = useTheme()
  const {
    me, allRestaurants, restaurants, categories, filters, loading, stats, overviewStats,
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
  const [tonightOpen, setTonightOpen] = useState(false)
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [triedTargetId, setTriedTargetId] = useState<string | null>(null)
  const [editingVisitTarget, setEditingVisitTarget] = useState<{ restaurantId: string; visit: RestaurantVisit } | null>(null)

  const people = usePeople(me?.id ?? null, allRestaurants)
  const { invite, dismiss: dismissInvite } = useTonightInvite(me?.id ?? null)

  useEffect(() => {
    if (tab === 'map' && !userLocation) requestLocation()
  }, [tab, userLocation, requestLocation])

  async function handleSignOut() {
    await createClient().auth.signOut()
    window.location.href = '/auth'
  }

  const penOf = useCallback((restaurant: Restaurant) => penFor(restaurant, me?.id ?? null), [me?.id])
  const distanceOf = useCallback(
    (restaurant: Restaurant) => restaurantDistanceKm(restaurant, userLocation) ?? null,
    [userLocation]
  )

  const detailTarget = detailTargetId ? allRestaurants.find((r) => r.id === detailTargetId) ?? null : null
  const editTarget = editTargetId ? allRestaurants.find((r) => r.id === editTargetId) ?? null : null
  const triedTarget = triedTargetId ? allRestaurants.find((r) => r.id === triedTargetId) ?? null : null

  const narrowed = Boolean(filters.search || filters.category_id || filters.favoritesOnly || filters.pen)

  const manageActions = [
    { label: 'Manage categories', onClick: () => setManageCategoriesOpen(true) },
    { label: 'Import a batch of places', onClick: () => setBulkImportOpen(true) },
    { label: 'Categorize the visible list', onClick: () => setBulkCategoryOpen(true) },
    { label: theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode', onClick: toggle },
    { label: 'Sign out', onClick: handleSignOut, tone: 'danger' as const },
  ]

  return (
    <div className="paper" style={{ minHeight: '100svh', maxWidth: 640, margin: '0 auto', overflowX: 'hidden', width: '100%' }}>
      <LedgerHeader
        filters={filters}
        categories={categories}
        initials={people.initials}
        counts={{ wantToTry: stats.wantToTry, tried: stats.tried }}
        summary={{
          averageRating: overviewStats.averageRating,
          averageSpendPerPerson: overviewStats.averageSpendPerPerson,
          thisMonthVisits: overviewStats.thisMonthVisits,
        }}
        onChange={updateFilters}
        onManage={() => setManageSheetOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenFilters={() => setFilterSheetOpen(true)}
      />

      {invite && !tonightOpen && (
        <button
          onClick={() => {
            dismissInvite()
            setTonightOpen(true)
          }}
          className="animate-fade-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: 'calc(100% - 32px)',
            margin: '12px 16px 0',
            padding: '11px 14px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--accent-secondary)',
            background: 'var(--accent-secondary-light)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-secondary)',
              flexShrink: 0,
            }}
          />
          <span className="font-script" style={{ fontSize: 21, color: 'var(--text-primary)', lineHeight: 1 }}>
            {people.initials.theirs ?? 'They'} started tonight?
          </span>
          <span className="label-caps" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--accent-secondary)' }}>
            Join
          </span>
        </button>
      )}

      <main style={{ paddingBottom: 'calc(92px + env(safe-area-inset-bottom))' }}>
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
          <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <EmptyState status={filters.status} filtered={narrowed} onAdd={() => setAddOpen(true)} />
        ) : (
          <>
            {filters.sort === 'nearest' && locationError && (
              <p
                className="font-stamp"
                style={{
                  margin: '12px 16px 0',
                  padding: '9px 13px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  fontSize: 11.5,
                }}
              >
                {locationError}
              </p>
            )}

            {filters.status === 'want_to_try' && !narrowed && (
              <div style={{ padding: '13px 16px 12px' }}>
                <button
                  onClick={() => setTonightOpen(true)}
                  className="font-script"
                  style={{
                    width: '100%',
                    padding: '11px 16px 12px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px dashed var(--border-strong)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 24,
                    lineHeight: 1,
                  }}
                >
                  where tonight?
                </button>
              </div>
            )}

            <LedgerList
              restaurants={restaurants}
              penOf={penOf}
              distanceOf={distanceOf}
              onOpen={setDetailTargetId}
              onMarkTried={setTriedTargetId}
              onToggleFavorite={(restaurant) => favoriteRestaurant(restaurant.id, !restaurant.is_favorite)}
              onDelete={async (restaurant) => {
                if (!confirm(`Delete "${restaurant.name}"?`)) return
                await removeRestaurant(restaurant.id)
              }}
            />
          </>
        )}
      </main>

      <BottomNav tab={tab} onTabChange={setTab} onAdd={() => setAddOpen(true)} />

      {tonightOpen && (
        <TonightDeck
          restaurants={allRestaurants}
          penOf={penOf}
          distanceOf={distanceOf}
          myUserId={me?.id ?? null}
          initials={people.initials}
          initialOf={people.initialOf}
          onClose={() => setTonightOpen(false)}
          onOpenRestaurant={setDetailTargetId}
        />
      )}

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
            <h2 className="font-script" style={{ fontSize: 27, color: 'var(--text-primary)', padding: '2px 2px 14px' }}>
              the year so far
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
