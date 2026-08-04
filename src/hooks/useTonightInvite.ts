'use client'

import { useEffect, useState } from 'react'
import { getActiveRound, subscribeToRounds, type TonightRound } from '@/lib/tonight'

/**
 * Watches for a round the *other* person dealt, so it surfaces on this phone without
 * anyone having to say "open the app". Also checks once on mount, since a round dealt
 * while this phone was asleep never arrives as a realtime event.
 *
 * Silent on failure: if the migration hasn't been run, the rest of the app must keep
 * working rather than showing an error for a feature nobody invoked.
 */
export function useTonightInvite(myUserId: string | null) {
  const [invite, setInvite] = useState<TonightRound | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    if (!myUserId) return
    let cancelled = false

    getActiveRound()
      .then((round) => {
        if (cancelled || !round) return
        if (round.created_by && round.created_by !== myUserId) setInvite(round)
      })
      .catch(() => {})

    const unsubscribe = subscribeToRounds((round) => {
      if (round.created_by && round.created_by !== myUserId) setInvite(round)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [myUserId])

  const pending = invite && !dismissed.includes(invite.id) ? invite : null

  return {
    invite: pending,
    dismiss: () => {
      if (invite) setDismissed((previous) => [...previous, invite.id])
    },
  }
}
