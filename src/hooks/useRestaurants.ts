'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getRestaurants, getCategories, createRestaurant, updateRestaurant, deleteRestaurant, markAsTried, toggleFavorite } from '@/lib/restaurants'
import type { Restaurant, Category, FilterState, CreateRestaurantInput, UpdateRestaurantInput } from '@/types'

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
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filters.sort])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Client-side filtering — instant tab/search/category switching, no extra DB round-trips
  const restaurants = useMemo(() => {
    let result = allRestaurants

    if (filters.status === 'favorites') {
      result = result.filter((r) => r.is_favorite)
    } else if (filters.status !== 'all') {
      result = result.filter((r) => r.status === filters.status)
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter((r) => r.name.toLowerCase().includes(q))
    }

    if (filters.category_id) {
      result = result.filter((r) =>
        r.categories.some((c) => c.id === filters.category_id)
      )
    }

    return result
  }, [allRestaurants, filters.status, filters.search, filters.category_id])

  const addRestaurant = useCallback(async (input: CreateRestaurantInput) => {
    const r = await createRestaurant(input)
    await fetchAll()
    return r
  }, [fetchAll])

  const editRestaurant = useCallback(async (id: string, input: UpdateRestaurantInput) => {
    await updateRestaurant(id, input)
    await fetchAll()
  }, [fetchAll])

  const removeRestaurant = useCallback(async (id: string) => {
    await deleteRestaurant(id)
    setAllRestaurants((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const tryRestaurant = useCallback(async (id: string, rating?: number, notes?: string) => {
    await markAsTried(id, rating, notes)
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

  // Stats always reflect the full unfiltered list
  const stats = {
    total: allRestaurants.length,
    tried: allRestaurants.filter((r) => r.status === 'tried').length,
    wantToTry: allRestaurants.filter((r) => r.status === 'want_to_try').length,
    favorites: allRestaurants.filter((r) => r.is_favorite).length,
  }

  return {
    restaurants,
    categories,
    filters,
    loading,
    error,
    stats,
    addRestaurant,
    editRestaurant,
    removeRestaurant,
    tryRestaurant,
    favoriteRestaurant,
    updateFilters,
    refetch: fetchAll,
  }
}
