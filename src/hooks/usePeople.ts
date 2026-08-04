'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchPeople, initialOf, penInitialsFrom, type PenInitials, type Person } from '@/lib/people'
import type { Restaurant } from '@/types'

export interface People {
  /** Initials for the two pen toggles */
  initials: PenInitials
  /** Exact initial for one row's author — use this wherever a specific place is shown */
  initialOf: (userId: string | null | undefined) => string | null
}

/**
 * Who shares this list, and the letter each of them writes in. Fails quietly: an
 * unlabelled pen is still a usable colour, so a hiccup here must not take the header
 * down with it.
 */
export function usePeople(myUserId: string | null, restaurants: Restaurant[]): People {
  const [people, setPeople] = useState<Person[]>([])

  useEffect(() => {
    if (!myUserId) return
    let cancelled = false

    fetchPeople()
      .then((loaded) => {
        if (!cancelled) setPeople(loaded)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [myUserId])

  return useMemo(
    () => ({
      initials: penInitialsFrom(people, myUserId, restaurants),
      initialOf: (userId: string | null | undefined) => initialOf(people, userId),
    }),
    [people, myUserId, restaurants]
  )
}
