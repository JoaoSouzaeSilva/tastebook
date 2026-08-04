import type { Pen, Restaurant } from '@/types'

/**
 * Pen labels are the first letter of each account's email address, resolved by
 * `/api/people` — nothing hardcoded, nothing configured. The browser can't read the
 * other account's address, so the derivation happens server-side and only
 * `{ id, initial }` comes back.
 */
export interface Person {
  id: string
  initial: string
}

export interface PenInitials {
  mine: string | null
  theirs: string | null
}

export async function fetchPeople(): Promise<Person[]> {
  const response = await fetch('/api/people')
  if (!response.ok) throw new Error('Could not load who shares this list')
  const body = (await response.json()) as { people?: Person[] }
  return body.people ?? []
}

/** Exact initial for a specific row's author — correct no matter how many accounts exist. */
export function initialOf(people: Person[], userId: string | null | undefined): string | null {
  if (!userId) return null
  return people.find((person) => person.id === userId)?.initial ?? null
}

/**
 * Which account is "the other pen".
 *
 * This project has more than two registered accounts (and more than one whose email
 * starts with the same letter), so "the first user that isn't me" would be a coin
 * flip. Instead it's whoever has actually written the most into the list — the pen
 * you'd recognise. Ties break on id so the answer is stable across reloads.
 */
export function theirUserId(restaurants: Restaurant[], myUserId: string | null): string | null {
  const counts = new Map<string, number>()

  for (const restaurant of restaurants) {
    const author = restaurant.user_id
    if (!author || author === myUserId) continue
    counts.set(author, (counts.get(author) ?? 0) + 1)
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return ranked[0]?.[0] ?? null
}

export function penInitialsFrom(
  people: Person[],
  myUserId: string | null,
  restaurants: Restaurant[]
): PenInitials {
  return {
    mine: initialOf(people, myUserId),
    theirs: initialOf(people, theirUserId(restaurants, myUserId)),
  }
}

export function initialForPen(initials: PenInitials, pen: Pen): string | null {
  return pen === 'mine' ? initials.mine : initials.theirs
}
