import { createClient } from './supabase/client'
import type { CreateRestaurantInput, UpdateRestaurantInput, FilterState, CreateCategoryInput, ReviewPhoto, Restaurant } from '@/types'

const REVIEW_PHOTOS_BUCKET = 'restaurant-review-photos'
type RestaurantCategoryJoin = { category: { id: string } }

function createUploadId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function getRestaurants(filters: Partial<FilterState> = {}) {
  const supabase = createClient()

  let query = supabase
    .from('restaurants')
    .select(`
      *,
      restaurant_categories (
        category:categories (*)
      ),
      review_photos:restaurant_review_photos (
        *
      )
    `)
    .order('created_at', { ascending: false })

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  if (filters.status === 'favorites') {
    query = query.eq('is_favorite', true)
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

  let restaurants: Restaurant[] = (data || []).map((r) => ({
    ...r,
    categories: ((r.restaurant_categories as RestaurantCategoryJoin[] | null | undefined) ?? []).map((rc) => rc.category),
    review_photos: r.review_photos ?? [],
  }))

  if (filters.category_id) {
    restaurants = restaurants.filter((r) =>
      r.categories.some((c) => c.id === filters.category_id)
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

export async function toggleFavorite(id: string, value: boolean) {
  return updateRestaurant(id, { is_favorite: value })
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

export async function updateCategory(id: string, input: CreateCategoryInput) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .update({
      name: input.name,
      color: input.color,
      icon: input.icon || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function uploadReviewPhotos(restaurantId: string, files: File[]) {
  if (files.length === 0) return [] as ReviewPhoto[]

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const uploadedPhotos: { image_url: string; storage_path: string }[] = []

  for (const file of files) {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${user.id}/${restaurantId}/${createUploadId()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(REVIEW_PHOTOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from(REVIEW_PHOTOS_BUCKET)
      .getPublicUrl(filePath)

    uploadedPhotos.push({
      image_url: publicUrlData.publicUrl,
      storage_path: filePath,
    })
  }

  const { data, error } = await supabase
    .from('restaurant_review_photos')
    .insert(
      uploadedPhotos.map((photo) => ({
        restaurant_id: restaurantId,
        image_url: photo.image_url,
        storage_path: photo.storage_path,
        user_id: user.id,
      }))
    )
    .select()

  if (error) throw error
  return data ?? []
}
