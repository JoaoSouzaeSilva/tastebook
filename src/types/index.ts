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

export interface ReviewPhoto {
  id: string
  restaurant_id: string
  image_url: string
  storage_path?: string
  caption?: string
  user_id?: string
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
  is_favorite: boolean
  created_at: string
  updated_at: string
  user_id: string
  categories: Category[]
  review_photos: ReviewPhoto[]
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

export type UpdateRestaurantInput = Partial<CreateRestaurantInput & { is_favorite: boolean }>

export type CreateCategoryInput = {
  name: string
  color: string
  icon?: string
}

export interface FilterState {
  status: RestaurantStatus | 'all' | 'favorites'
  category_id: string | null
  search: string
  sort: 'newest' | 'oldest' | 'rating' | 'name'
}
