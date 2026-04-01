import { createClient } from './supabase/client'
import type { CreateRestaurantInput, UpdateRestaurantInput, FilterState } from '@/types'

export async function getRestaurants(filters: Partial<FilterState> = {}) {
  const supabase = createClient()

  let query = supabase
    .from('restaurants')
    .select(`
      *,
      restaurant_categories (
        category:categories (*)
      )
    `)
    .order('created_at', { ascending: false })

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  if (filters.status === 'favorites') {
    query = query.gte('rating', 4)
  } else if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.sort === 'rating') {
    query = query.order('rating', { ascending: false, nullsFirst: false })
  } else if (filters.sort === 'name') {
    query = query.order('name', { ascending: true })
  } else if (filters.sort === 'oldest') {
    query = query.order('created_at', { ascending: true })
  }

  const { data, error } = await query

  if (error) throw error

  let restaurants = (data || []).map((r) => ({
    ...r,
    categories: r.restaurant_categories?.map((rc: any) => rc.category) ?? [],
  }))

  if (filters.category_id) {
    restaurants = restaurants.filter((r) =>
      r.categories.some((c: any) => c.id === filters.category_id)
    )
  }

  return restaurants
}

export async function createRestaurant(input: CreateRestaurantInput) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { category_ids, ...rest } = input

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .insert({ ...rest, user_id: user.id, status: rest.status ?? 'want_to_try' })
    .select()
    .single()

  if (error) throw error

  if (category_ids?.length) {
    await supabase.from('restaurant_categories').insert(
      category_ids.map((cid) => ({ restaurant_id: restaurant.id, category_id: cid }))
    )
  }

  return restaurant
}

export async function updateRestaurant(id: string, input: UpdateRestaurantInput) {
  const supabase = createClient()
  const { category_ids, ...rest } = input

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (category_ids !== undefined) {
    await supabase.from('restaurant_categories').delete().eq('restaurant_id', id)
    if (category_ids.length) {
      await supabase.from('restaurant_categories').insert(
        category_ids.map((cid) => ({ restaurant_id: id, category_id: cid }))
      )
    }
  }

  return restaurant
}

export async function deleteRestaurant(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('restaurants').delete().eq('id', id)
  if (error) throw error
}

export async function markAsTried(id: string, rating?: number, notes?: string) {
  return updateRestaurant(id, {
    status: 'tried',
    date_visited: new Date().toISOString().split('T')[0],
    ...(rating !== undefined && { rating }),
    ...(notes !== undefined && { notes }),
  })
}

export async function getCategories() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createCategory(name: string, color: string, icon?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, color, icon, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}
