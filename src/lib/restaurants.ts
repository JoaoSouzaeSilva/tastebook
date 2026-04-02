import { createClient } from './supabase/client'
import type { CreateRestaurantInput, UpdateRestaurantInput, FilterState, CreateCategoryInput, ReviewPhoto, Restaurant, RestaurantVisit, CreateVisitInput, Category, UpdateVisitInput } from '@/types'
import { getAverageRating, getAverageSpendPerPerson, getLatestVisit } from './reviewStats'

const REVIEW_PHOTOS_BUCKET = 'restaurant-review-photos'
type RestaurantCategoryJoin = { category: Category }
type VisitRow = RestaurantVisit
type RestaurantRow = Restaurant & {
  restaurant_categories?: RestaurantCategoryJoin[] | null
  review_photos?: ReviewPhoto[] | null
  visits?: VisitRow[] | null
}

function createUploadId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeRestaurant(row: RestaurantRow): Restaurant {
  const visits = [...(row.visits ?? [])]
    .map((visit) => ({
      ...visit,
      review_photos: (row.review_photos ?? []).filter((photo) => photo.visit_id === visit.id),
    }))
    .sort((a, b) => {
      const dateDiff = new Date(b.date_visited).getTime() - new Date(a.date_visited).getTime()
      if (dateDiff !== 0) return dateDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const latestVisit = getLatestVisit(visits)
  const averageRating = getAverageRating(visits)
  const averageSpendPerPerson = getAverageSpendPerPerson(visits)

  return {
    ...row,
    rating: averageRating ?? latestVisit?.rating ?? row.rating,
    notes: latestVisit?.notes ?? row.notes,
    party_size: latestVisit?.party_size ?? row.party_size,
    total_paid: latestVisit?.total_paid ?? row.total_paid,
    date_visited: latestVisit?.date_visited ?? row.date_visited,
    categories: (row.restaurant_categories ?? []).map((rc) => rc.category),
    visits,
    review_photos: row.review_photos ?? [],
    average_rating: averageRating ?? undefined,
    average_spend_per_person: averageSpendPerPerson ?? undefined,
  }
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
      visits:restaurant_visits (
        *
      ),
      review_photos:restaurant_review_photos (
        *
      )
    `)

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  if (filters.status === 'favorites') {
    query = query.eq('is_favorite', true)
  } else if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.sort === 'rating') {
    query = query
      .order('rating', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
  } else if (filters.sort === 'name') {
    query = query
      .order('name', { ascending: true })
      .order('created_at', { ascending: false })
  } else if (filters.sort === 'oldest') {
    query = query.order('created_at', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) throw error

  let restaurants: Restaurant[] = (data || []).map((r) => normalizeRestaurant(r as RestaurantRow))

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

  const { category_ids, rating, notes, party_size, total_paid, date_visited, ...rest } = input

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .insert({
      ...rest,
      user_id: user.id,
      status: rest.status ?? 'want_to_try',
      ...(rest.status === 'tried' && {
        rating,
        notes,
        party_size,
        total_paid,
        date_visited,
      }),
    })
    .select()
    .single()

  if (error) throw error

  if (category_ids?.length) {
    await supabase.from('restaurant_categories').insert(
      category_ids.map((cid) => ({ restaurant_id: restaurant.id, category_id: cid }))
    )
  }

  if (rest.status === 'tried') {
    await createVisit(restaurant.id, {
      rating,
      notes,
      party_size,
      total_paid,
      date_visited,
    })
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

export async function createVisit(id: string, input: CreateVisitInput = {}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const visitPayload = {
    restaurant_id: id,
    user_id: user.id,
    date_visited: input.date_visited ?? new Date().toISOString().split('T')[0],
    ...(input.rating !== undefined && { rating: input.rating }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.party_size !== undefined && { party_size: input.party_size }),
    ...(input.total_paid !== undefined && { total_paid: input.total_paid }),
    ...(input.would_go_again !== undefined && { would_go_again: input.would_go_again }),
    ...(input.worth_the_money !== undefined && { worth_the_money: input.worth_the_money }),
  }

  const { data: visit, error } = await supabase
    .from('restaurant_visits')
    .insert(visitPayload)
    .select()
    .single()

  if (error) throw error

  await updateRestaurant(id, {
    status: 'tried',
    date_visited: visit.date_visited,
    ...(input.rating !== undefined && { rating: input.rating }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.party_size !== undefined && { party_size: input.party_size }),
    ...(input.total_paid !== undefined && { total_paid: input.total_paid }),
  })

  return visit
}

export async function updateVisit(
  visitId: string,
  restaurantId: string,
  input: UpdateVisitInput = {}
) {
  const supabase = createClient()

  const { data: visit, error } = await supabase
    .from('restaurant_visits')
    .update({
      ...(input.rating !== undefined && { rating: input.rating }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.party_size !== undefined && { party_size: input.party_size }),
      ...(input.total_paid !== undefined && { total_paid: input.total_paid }),
      ...(input.would_go_again !== undefined && { would_go_again: input.would_go_again }),
      ...(input.worth_the_money !== undefined && { worth_the_money: input.worth_the_money }),
      ...(input.date_visited !== undefined && { date_visited: input.date_visited }),
    })
    .eq('id', visitId)
    .select()
    .single()

  if (error) throw error

  const { data: visitRows, error: visitsError } = await supabase
    .from('restaurant_visits')
    .select('*')
    .eq('restaurant_id', restaurantId)

  if (visitsError) throw visitsError

  const visits = (visitRows ?? []) as RestaurantVisit[]
  const latestVisit = getLatestVisit(visits)
  const averageRating = getAverageRating(visits)

  await updateRestaurant(restaurantId, {
    status: 'tried',
    date_visited: latestVisit?.date_visited,
    rating: averageRating ?? undefined,
    ...(latestVisit?.notes !== undefined && { notes: latestVisit.notes }),
    ...(latestVisit?.party_size !== undefined && { party_size: latestVisit.party_size }),
    ...(latestVisit?.total_paid !== undefined && { total_paid: latestVisit.total_paid }),
  })

  return visit
}

export async function markAsTried(
  id: string,
  rating?: number,
  notes?: string,
  partySize?: number,
  totalPaid?: number
) {
  return createVisit(id, {
    rating,
    notes,
    party_size: partySize,
    total_paid: totalPaid,
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

export async function uploadReviewPhotos(restaurantId: string, files: File[], visitId?: string) {
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
        ...(visitId ? { visit_id: visitId } : {}),
        image_url: photo.image_url,
        storage_path: photo.storage_path,
        user_id: user.id,
      }))
    )
    .select()

  if (error) throw error
  return data ?? []
}
