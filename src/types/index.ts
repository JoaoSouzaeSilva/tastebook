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
  visit_id?: string
  image_url: string
  storage_path?: string
  caption?: string
  user_id?: string
  created_at: string
}

export interface RestaurantVisit {
  id: string
  restaurant_id: string
  rating?: number
  notes?: string
  party_size?: number
  total_paid?: number
  would_go_again?: boolean
  worth_the_money?: boolean
  date_visited: string
  user_id?: string
  created_at: string
  review_photos: ReviewPhoto[]
}

export interface Restaurant {
  id: string
  name: string
  google_maps_link?: string
  google_place_id?: string
  latitude?: number
  longitude?: number
  address?: string
  status: RestaurantStatus
  rating?: number
  notes?: string
  avg_price?: PriceLevel
  party_size?: number
  total_paid?: number
  photo_url?: string
  date_visited?: string
  is_favorite: boolean
  created_at: string
  updated_at: string
  user_id: string
  categories: Category[]
  visits: RestaurantVisit[]
  review_photos: ReviewPhoto[]
  average_rating?: number
  average_spend_per_person?: number
}

export interface RestaurantWithCategories extends Restaurant {
  restaurant_categories: { category: Category }[]
}

export type CreateRestaurantInput = {
  name: string
  google_maps_link?: string | null
  google_place_id?: string | null
  latitude?: number | null
  longitude?: number | null
  address?: string
  status?: RestaurantStatus
  rating?: number
  notes?: string
  avg_price?: PriceLevel
  party_size?: number
  total_paid?: number
  photo_url?: string
  date_visited?: string
  category_ids?: string[]
}

export type UpdateRestaurantInput = Partial<CreateRestaurantInput & { is_favorite: boolean }>

export type CreateVisitInput = {
  rating?: number
  notes?: string
  party_size?: number
  total_paid?: number
  would_go_again?: boolean
  worth_the_money?: boolean
  date_visited?: string
}

export type UpdateVisitInput = Partial<CreateVisitInput>

export type CreateCategoryInput = {
  name: string
  color: string
  icon?: string
}

/** Whose handwriting a row is in — derived from `user_id`, not stored. */
export type Pen = 'mine' | 'theirs'

export type SortKey = 'nearest' | 'newest' | 'rating'

export interface FilterState {
  /**
   * Only the two mutually-exclusive states live here. Favourites and pen are
   * orthogonal filters that stack on top, so "favourites we haven't tried yet"
   * is now expressible — it wasn't when favourites was a fourth status.
   */
  status: RestaurantStatus
  category_id: string | null
  search: string
  sort: SortKey
  favoritesOnly: boolean
  pen: Pen | null
}
