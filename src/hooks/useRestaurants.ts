'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRestaurants, getCategories, createRestaurant, updateRestaurant, deleteRestaurant, markAsTried } from '@/lib/restaurants'
import type { Restaurant, Category, FilterState, CreateRestaurantInput, UpdateRestaurantInput } from '@/types'

const defaultFilters: FilterState = {
  status: 'all',
  category_id: null,
  search: '',
  sort: 'newest',
}

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [rests, cats] = await Promise.all([getRestaurants(filters), getCategories()])
      setRestaurants(rests as Restaurant[])
      setCategories(cats as Category[])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchAll() }, [fetchAll])

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
    setRestaurants((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const tryRestaurant = useCallback(async (id: string, rating?: number, notes?: string) => {
    await markAsTried(id, rating, notes)
    await fetchAll()
  }, [fetchAll])

  const updateFilters = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }, [])

  const stats = {
    total: restaurants.length,
    tried: restaurants.filter((r) => r.status === 'tried').length,
    wantToTry: restaurants.filter((r) => r.status === 'want_to_try').length,
    favorites: restaurants.filter((r) => (r.rating ?? 0) >= 4).length,
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
    updateFilters,
    refetch: fetchAll,
  }
}
