export type RestaurantStatus = 'want_to_try' | 'tried'
export type PriceLevel = '€' | '€€' | '€€€' | '€€€€'

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
  user_id: string
  created_at: string
}

export interface Restaurant {
  id: string
  name: string
  google_maps_link?: string
  address?: string
  status: RestaurantStatus
  rating?: number
  notes?: string
  avg_price?: PriceLevel
  photo_url?: string
  date_visited?: string
  created_at: string
  updated_at: string
  user_id: string
  categories: Category[]
}

export interface RestaurantWithCategories extends Restaurant {
  restaurant_categories: { category: Category }[]
}

export type CreateRestaurantInput = {
  name: string
  google_maps_link?: string
  address?: string
  status?: RestaurantStatus
  rating?: number
  notes?: string
  avg_price?: PriceLevel
  photo_url?: string
  date_visited?: string
  category_ids?: string[]
}

export type UpdateRestaurantInput = Partial<CreateRestaurantInput>

export interface FilterState {
  status: RestaurantStatus | 'all' | 'favorites'
  category_id: string | null
  search: string
  sort: 'newest' | 'oldest' | 'rating' | 'name'
}
