'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getRestaurants, getCategories, createRestaurant, updateRestaurant, deleteRestaurant, createVisit, updateVisit, deleteVisit, toggleFavorite, createCategory, updateCategory, deleteCategory, uploadReviewPhotos } from '@/lib/restaurants'
import type { Restaurant, Category, FilterState, CreateRestaurantInput, UpdateRestaurantInput, CreateCategoryInput } from '@/types'
import { getAverageRating, getAverageSpendPerPerson } from '@/lib/reviewStats'

const defaultFilters: FilterState = {
  status: 'all',
  category_id: null,
  search: '',
  sort: 'newest',
}

export function useRestaurants() {
  // All restaurants from the DB — never filtered by status/search/category
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Only re-fetch from DB when sort order changes (or on mutations)
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [rests, cats] = await Promise.all([
        getRestaurants({ sort: filters.sort }),
        getCategories(),
      ])
      setAllRestaurants(rests as Restaurant[])
      setCategories(cats as Category[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load restaurants')
    } finally {
      setLoading(false)
    }
  }, [filters.sort])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Client-side filtering — instant tab/search/category switching, no extra DB round-trips
  const restaurants = useMemo(() => {
    let result = [...allRestaurants]

    if (filters.status === 'favorites') {
      result = result.filter((r) => r.is_favorite)
    } else if (filters.status !== 'all') {
      result = result.filter((r) => r.status === filters.status)
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter((restaurant) => {
        const visitNotes = restaurant.visits
          .map((visit) => visit.notes?.toLowerCase() ?? '')
          .join(' ')

        return (
          restaurant.name.toLowerCase().includes(q) ||
          restaurant.address?.toLowerCase().includes(q) ||
          visitNotes.includes(q)
        )
      })
    }

    if (filters.category_id) {
      result = result.filter((r) =>
        r.categories.some((c) => c.id === filters.category_id)
      )
    }

    if (filters.sort === 'rating') {
      result.sort((a, b) => {
        const ratingDiff = (b.average_rating ?? b.rating ?? -1) - (a.average_rating ?? a.rating ?? -1)
        if (ratingDiff !== 0) return ratingDiff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    } else if (filters.sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } else if (filters.sort === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else if (filters.sort === 'best_value') {
      result.sort((a, b) => {
        const spendDiff = (a.average_spend_per_person ?? Number.POSITIVE_INFINITY) - (b.average_spend_per_person ?? Number.POSITIVE_INFINITY)
        if (spendDiff !== 0) return spendDiff
        return (b.average_rating ?? b.rating ?? -1) - (a.average_rating ?? a.rating ?? -1)
      })
    } else if (filters.sort === 'most_revisited') {
      result.sort((a, b) => {
        const visitDiff = b.visits.length - a.visits.length
        if (visitDiff !== 0) return visitDiff
        return (b.average_rating ?? b.rating ?? -1) - (a.average_rating ?? a.rating ?? -1)
      })
    } else if (filters.sort === 'would_go_again') {
      result.sort((a, b) => {
        const aPositive = a.visits.filter((visit) => visit.would_go_again === true).length
        const bPositive = b.visits.filter((visit) => visit.would_go_again === true).length
        const positiveDiff = bPositive - aPositive
        if (positiveDiff !== 0) return positiveDiff
        return b.visits.length - a.visits.length
      })
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  }, [allRestaurants, filters.status, filters.search, filters.category_id, filters.sort])

  const addRestaurant = useCallback(async (input: CreateRestaurantInput) => {
    const r = await createRestaurant(input)
    await fetchAll()
    return r
  }, [fetchAll])

  const addRestaurantsBulk = useCallback(async (inputs: CreateRestaurantInput[]) => {
    await Promise.all(inputs.map((input) => createRestaurant(input)))
    await fetchAll()
  }, [fetchAll])

  const bulkUpdateRestaurantCategories = useCallback(
    async (
      restaurantIds: string[],
      categoryIds: string[],
      mode: 'replace' | 'add'
    ) => {
      const restaurantMap = new Map(allRestaurants.map((restaurant) => [restaurant.id, restaurant]))

      await Promise.all(
        restaurantIds.map(async (restaurantId) => {
          const restaurant = restaurantMap.get(restaurantId)
          if (!restaurant) return

          const nextCategoryIds =
            mode === 'replace'
              ? categoryIds
              : Array.from(new Set([...restaurant.categories.map((category) => category.id), ...categoryIds]))

          await updateRestaurant(restaurantId, { category_ids: nextCategoryIds })
        })
      )

      await fetchAll()
    },
    [allRestaurants, fetchAll]
  )

  const editRestaurant = useCallback(async (id: string, input: UpdateRestaurantInput) => {
    await updateRestaurant(id, input)
    await fetchAll()
  }, [fetchAll])

  const removeRestaurant = useCallback(async (id: string) => {
    await deleteRestaurant(id)
    setAllRestaurants((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const tryRestaurant = useCallback(
    async (
      id: string,
      rating?: number,
      notes?: string,
      partySize?: number,
      totalPaid?: number,
      wouldGoAgain?: boolean,
      worthTheMoney?: boolean,
      dateVisited?: string,
      reviewPhotos: File[] = []
    ) => {
      const visit = await createVisit(id, {
        rating,
        notes,
        party_size: partySize,
        total_paid: totalPaid,
        would_go_again: wouldGoAgain,
        worth_the_money: worthTheMoney,
        date_visited: dateVisited,
      })

      try {
        if (reviewPhotos.length > 0) {
          await uploadReviewPhotos(id, reviewPhotos, visit.id)
        }
      } catch (error) {
        await deleteVisit(visit.id, id)
        throw error
      }

      await fetchAll()
    },
    [fetchAll]
  )

  const editVisit = useCallback(
    async (
      restaurantId: string,
      visitId: string,
      rating?: number,
      notes?: string,
      partySize?: number,
      totalPaid?: number,
      wouldGoAgain?: boolean,
      worthTheMoney?: boolean,
      dateVisited?: string,
      reviewPhotos: File[] = []
    ) => {
      await updateVisit(visitId, restaurantId, {
        rating,
        notes,
        party_size: partySize,
        total_paid: totalPaid,
        would_go_again: wouldGoAgain,
        worth_the_money: worthTheMoney,
        date_visited: dateVisited,
      })
      if (reviewPhotos.length > 0) {
        await uploadReviewPhotos(restaurantId, reviewPhotos, visitId)
      }
      await fetchAll()
    },
    [fetchAll]
  )

  const removeVisit = useCallback(async (restaurantId: string, visitId: string) => {
    await deleteVisit(visitId, restaurantId)
    await fetchAll()
  }, [fetchAll])

  const addCategory = useCallback(async (input: CreateCategoryInput) => {
    await createCategory(input.name, input.color, input.icon)
    await fetchAll()
  }, [fetchAll])

  const editCategory = useCallback(async (id: string, input: CreateCategoryInput) => {
    await updateCategory(id, input)
    await fetchAll()
  }, [fetchAll])

  const removeCategory = useCallback(async (id: string) => {
    await deleteCategory(id)
    await fetchAll()
  }, [fetchAll])

  const favoriteRestaurant = useCallback(async (id: string, value: boolean) => {
    setAllRestaurants((prev) => prev.map((r) => r.id === id ? { ...r, is_favorite: value } : r))
    try {
      await toggleFavorite(id, value)
    } catch {
      setAllRestaurants((prev) => prev.map((r) => r.id === id ? { ...r, is_favorite: !value } : r))
    }
  }, [])

  const updateFilters = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }, [])

  const stats = useMemo(() => {
    const triedRestaurants = allRestaurants.filter((r) => r.status === 'tried')

    return {
      total: allRestaurants.length,
      tried: triedRestaurants.length,
      wantToTry: allRestaurants.filter((r) => r.status === 'want_to_try').length,
      favorites: allRestaurants.filter((r) => r.is_favorite).length,
    }
  }, [allRestaurants])

  const overviewStats = useMemo(() => {
    const statsRestaurants = filters.category_id
      ? allRestaurants.filter((restaurant) =>
          restaurant.categories.some((category) => category.id === filters.category_id)
        )
      : allRestaurants

    const triedRestaurants = statsRestaurants.filter((r) => r.status === 'tried')
    const allVisits = statsRestaurants.flatMap((restaurant) =>
      restaurant.visits.map((visit) => ({ ...visit, restaurant }))
    )

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const thisMonthVisits = allVisits.filter(({ date_visited }) => {
      const visitDate = new Date(date_visited)
      return visitDate.getMonth() === currentMonth && visitDate.getFullYear() === currentYear
    }).length

    const restaurantCounts = new Map<string, { name: string; count: number }>()
    for (const restaurant of statsRestaurants) {
      restaurantCounts.set(restaurant.id, {
        name: restaurant.name,
        count: restaurant.visits.length,
      })
    }

    const topRestaurant = [...restaurantCounts.values()]
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))[0] ?? null

    const categoryCounts = new Map<string, { name: string; count: number }>()
    for (const restaurant of statsRestaurants) {
      if (restaurant.visits.length === 0) continue
      for (const category of restaurant.categories) {
        const current = categoryCounts.get(category.id)
        categoryCounts.set(category.id, {
          name: category.name,
          count: (current?.count ?? 0) + restaurant.visits.length,
        })
      }
    }

    const topCategory = [...categoryCounts.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))[0] ?? null

    return {
      total: statsRestaurants.length,
      tried: triedRestaurants.length,
      wantToTry: statsRestaurants.filter((r) => r.status === 'want_to_try').length,
      favorites: statsRestaurants.filter((r) => r.is_favorite).length,
      totalVisits: allVisits.length,
      averageRating: getAverageRating(allVisits) ?? null,
      averageSpendPerPerson: getAverageSpendPerPerson(allVisits) ?? null,
      topRestaurant,
      topCategory,
      thisMonthVisits,
    }
  }, [allRestaurants, filters.category_id])

  return {
    allRestaurants,
    restaurants,
    categories,
    filters,
    loading,
    error,
    stats,
    overviewStats,
    addRestaurant,
    addRestaurantsBulk,
    bulkUpdateRestaurantCategories,
    addCategory,
    editCategory,
    removeCategory,
    editRestaurant,
    removeRestaurant,
    tryRestaurant,
    editVisit,
    removeVisit,
    favoriteRestaurant,
    updateFilters,
    refetch: fetchAll,
  }
}
