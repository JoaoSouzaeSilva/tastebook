import type { Pen, Restaurant } from '@/types'

/**
 * Two people share one list, so every row is in somebody's handwriting.
 *
 * RLS on every table is `auth.role() = 'authenticated'`, meaning both accounts
 * already read the same rows — and `user_id` is already stamped on insert. So the
 * pen is derivable with no schema change: your rows are blue, the other account's
 * are pink. Rows predating the current schema (`user_id` null) fall back to blue.
 */
export function penFor(restaurant: Pick<Restaurant, 'user_id'>, myUserId: string | null): Pen {
  if (!myUserId || !restaurant.user_id) return 'mine'
  return restaurant.user_id === myUserId ? 'mine' : 'theirs'
}

export function penColor(pen: Pen): string {
  return pen === 'mine' ? 'var(--pen-mine)' : 'var(--pen-theirs)'
}

// People are labelled by initial — see `penInitials` in lib/people.ts.
