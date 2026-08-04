import { createClient } from '@/lib/supabase/client'

/** A round goes stale rather than being explicitly abandoned — nobody closes a sheet politely. */
export const ROUND_TTL_MINUTES = 90

export interface TonightRound {
  id: string
  created_by: string | null
  restaurant_ids: string[]
  closed_at: string | null
  created_at: string
}

export interface TonightVote {
  id: string
  round_id: string
  restaurant_id: string
  user_id: string | null
  keep: boolean
  created_at: string
}

function staleCutoff(): string {
  return new Date(Date.now() - ROUND_TTL_MINUTES * 60_000).toISOString()
}

/** The round both phones should be looking at, if there is one. */
export async function getActiveRound(): Promise<TonightRound | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tonight_rounds')
    .select('*')
    .is('closed_at', null)
    .gte('created_at', staleCutoff())
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return (data?.[0] as TonightRound) ?? null
}

/**
 * Join whoever dealt first, otherwise deal. Two people tapping simultaneously can
 * still create two rounds; both then converge on the newest one via the realtime
 * round subscription, so the loser's votes are simply discarded rather than lost
 * into a round nobody is watching.
 */
export async function joinOrCreateRound(restaurantIds: string[]): Promise<TonightRound> {
  const existing = await getActiveRound()
  if (existing) return existing

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('tonight_rounds')
    .insert({ created_by: user?.id ?? null, restaurant_ids: restaurantIds })
    .select()
    .single()

  if (error) throw error
  return data as TonightRound
}

export async function getVotes(roundId: string): Promise<TonightVote[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('tonight_votes').select('*').eq('round_id', roundId)
  if (error) throw error
  return (data ?? []) as TonightVote[]
}

export async function castVote(roundId: string, restaurantId: string, keep: boolean): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tonight_votes')
    .upsert(
      { round_id: roundId, restaurant_id: restaurantId, user_id: user.id, keep },
      { onConflict: 'round_id,restaurant_id,user_id' }
    )

  if (error) throw error
}

export async function closeRound(roundId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('tonight_rounds').update({ closed_at: new Date().toISOString() }).eq('id', roundId)
}

/**
 * Live votes for one round. Returns an unsubscribe function.
 *
 * Realtime delivers only the changed row, so the caller merges by id — a full refetch
 * per keystroke of the other person's thumb would be wasteful and racy.
 */
export function subscribeToVotes(roundId: string, onVote: (vote: TonightVote) => void): () => void {
  const supabase = createClient()
  const channel = supabase
    .channel(`tonight_votes:${roundId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tonight_votes', filter: `round_id=eq.${roundId}` },
      (payload) => {
        const vote = payload.new as TonightVote
        if (vote?.id) onVote(vote)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/** New rounds dealt by the other person — this is what makes it "appear" on your phone. */
export function subscribeToRounds(onRound: (round: TonightRound) => void): () => void {
  const supabase = createClient()
  const channel = supabase
    .channel('tonight_rounds')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tonight_rounds' }, (payload) => {
      const round = payload.new as TonightRound
      if (round?.id) onRound(round)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/** A place both of you kept. Order follows the round, so "first match" is deterministic. */
export function findMatches(round: TonightRound, votes: TonightVote[]): string[] {
  const keepersByRestaurant = new Map<string, Set<string>>()

  for (const vote of votes) {
    if (!vote.keep || !vote.user_id) continue
    const keepers = keepersByRestaurant.get(vote.restaurant_id) ?? new Set<string>()
    keepers.add(vote.user_id)
    keepersByRestaurant.set(vote.restaurant_id, keepers)
  }

  return round.restaurant_ids.filter((id) => (keepersByRestaurant.get(id)?.size ?? 0) >= 2)
}

export function votedRestaurantIds(votes: TonightVote[], userId: string | null): Set<string> {
  return new Set(votes.filter((vote) => vote.user_id === userId).map((vote) => vote.restaurant_id))
}

/** Distinct people who have swiped at all — drives the "M is still swiping…" line. */
export function voterIds(votes: TonightVote[]): string[] {
  return [...new Set(votes.map((vote) => vote.user_id).filter((id): id is string => Boolean(id)))]
}
