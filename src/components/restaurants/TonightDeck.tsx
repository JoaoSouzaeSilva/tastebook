'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Pen, Restaurant } from '@/types'
import { formatDistance } from '@/lib/geo'
import { penColor } from '@/lib/pens'
import type { PenInitials } from '@/lib/people'
import { getGoogleMapsUrl } from '@/lib/maps'
import {
  castVote,
  closeRound,
  findMatches,
  getVotes,
  joinOrCreateRound,
  subscribeToRounds,
  subscribeToVotes,
  votedRestaurantIds,
  voterIds,
  type TonightRound,
  type TonightVote,
} from '@/lib/tonight'

const FLICK_THRESHOLD = 92
const DECK_SIZE = 5

interface TonightDeckProps {
  restaurants: Restaurant[]
  penOf: (restaurant: Restaurant) => Pen
  distanceOf: (restaurant: Restaurant) => number | null
  myUserId: string | null
  initials: PenInitials
  initialOf: (userId: string | null | undefined) => string | null
  onClose: () => void
  onOpenRestaurant: (id: string) => void
}

/**
 * A live round: whoever taps first deals five places, the other phone joins the same
 * five, and a place you both keep becomes a match the instant the second vote lands.
 *
 * The five are pinned on the round row rather than recomputed locally — two phones in
 * the same room still have different GPS fixes, and swiping different cards would make
 * "you both kept it" meaningless.
 */
export function TonightDeck({
  restaurants,
  penOf,
  distanceOf,
  myUserId,
  initials,
  initialOf,
  onClose,
  onOpenRestaurant,
}: TonightDeckProps) {
  const [round, setRound] = useState<TonightRound | null>(null)
  const [votes, setVotes] = useState<TonightVote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [flick, setFlick] = useState<-1 | 1 | 0>(0)
  const gesture = useRef({ startX: 0, startY: 0, active: false, decided: false })

  const byId = useMemo(() => new Map(restaurants.map((r) => [r.id, r])), [restaurants])

  // The hand this phone would deal, if it gets there first
  const candidateIds = useMemo(
    () =>
      restaurants
        .filter((restaurant) => restaurant.status === 'want_to_try')
        .sort((a, b) => {
          const aDistance = distanceOf(a) ?? Number.POSITIVE_INFINITY
          const bDistance = distanceOf(b) ?? Number.POSITIVE_INFINITY
          if (aDistance !== bDistance) return aDistance - bDistance
          return a.name.localeCompare(b.name)
        })
        .slice(0, DECK_SIZE)
        .map((restaurant) => restaurant.id),
    [restaurants, distanceOf]
  )

  // Dedupe on (restaurant, voter) rather than row id, so the authoritative row arriving
  // over realtime replaces this phone's optimistic placeholder instead of sitting
  // alongside it.
  const mergeVote = useCallback((incoming: TonightVote) => {
    setVotes((previous) => [
      ...previous.filter(
        (vote) => !(vote.restaurant_id === incoming.restaurant_id && vote.user_id === incoming.user_id)
      ),
      incoming,
    ])
  }, [])

  // Join or deal exactly once per opening. Without the ref this re-runs every time the
  // GPS fix moves (candidateIds is recomputed), refetching votes and flickering the deck.
  const joinedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (candidateIds.length === 0 || joinedRef.current) return
    joinedRef.current = true

    joinOrCreateRound(candidateIds)
      .then(async (joined) => {
        if (cancelled) return
        setRound(joined)
        const existing = await getVotes(joined.id)
        if (!cancelled) setVotes(existing)
      })
      .catch((cause: unknown) => {
        joinedRef.current = false
        if (!cancelled) {
          setError(
            cause instanceof Error && /relation .*tonight/i.test(cause.message)
              ? 'Run the tonight_rounds migration in Supabase to enable live rounds.'
              : cause instanceof Error
              ? cause.message
              : 'Could not start a round'
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [candidateIds])

  useEffect(() => {
    if (!round) return
    return subscribeToVotes(round.id, mergeVote)
  }, [round, mergeVote])

  // If the other phone dealt at the same moment, converge on the newer round
  useEffect(() => {
    if (!round) return
    return subscribeToRounds((incoming) => {
      if (incoming.id === round.id) return
      if (new Date(incoming.created_at).getTime() <= new Date(round.created_at).getTime()) return
      setRound(incoming)
      setVotes([])
      getVotes(incoming.id).then(setVotes).catch(() => {})
    })
  }, [round])

  const deck = useMemo(
    () => (round?.restaurant_ids ?? []).map((id) => byId.get(id)).filter((r): r is Restaurant => Boolean(r)),
    [round, byId]
  )

  const myVoted = useMemo(() => votedRestaurantIds(votes, myUserId), [votes, myUserId])
  const pending = deck.filter((restaurant) => !myVoted.has(restaurant.id))
  const matches = useMemo(() => (round ? findMatches(round, votes) : []), [round, votes])
  const matched = matches.map((id) => byId.get(id)).filter((r): r is Restaurant => Boolean(r))

  const others = voterIds(votes).filter((id) => id !== myUserId)
  const theirVoteCount = votes.filter((vote) => vote.user_id !== myUserId && vote.user_id).length
  const theirName = initials.theirs ?? 'they'

  // Looked up from the row's own author rather than collapsed to "mine or theirs", so a
  // place added from a third account is still labelled with the right letter.
  const initialFor = (restaurant: Restaurant) => initialOf(restaurant.user_id)

  function commit(direction: -1 | 1) {
    const current = pending[0]
    if (!current || !round) return

    setFlick(direction)
    // Optimistic: the card leaves under your thumb, the write follows
    castVote(round.id, current.id, direction === 1).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'Vote did not save')
    })

    window.setTimeout(() => {
      mergeVote({
        id: `local:${current.id}`,
        round_id: round.id,
        restaurant_id: current.id,
        user_id: myUserId,
        keep: direction === 1,
        created_at: new Date().toISOString(),
      })
      setDrag(0)
      setFlick(0)
    }, 240)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    gesture.current = { startX: event.clientX, startY: event.clientY, active: true, decided: false }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g.active) return
    const dx = event.clientX - g.startX
    const dy = event.clientY - g.startY
    if (!g.decided) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      if (Math.abs(dy) > Math.abs(dx)) {
        g.active = false
        return
      }
      g.decided = true
      setDragging(true)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
    setDrag(dx)
  }

  function handlePointerEnd() {
    const g = gesture.current
    if (!g.active) return
    g.active = false
    if (!g.decided) return
    setDragging(false)
    if (Math.abs(drag) > FLICK_THRESHOLD) commit(drag > 0 ? 1 : -1)
    else setDrag(0)
  }

  const dealtByThem = Boolean(round?.created_by && round.created_by !== myUserId)

  return (
    <div
      className="paper animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        maxWidth: 640,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 20px 2px' }}>
        <span className="font-script" style={{ fontSize: 31, color: 'var(--text-primary)', lineHeight: 1 }}>
          tonight?
        </span>
        {round && (
          <span
            className="label-caps"
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: 'var(--accent-secondary)' }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-secondary)',
                display: 'inline-block',
              }}
            />
            live
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          className="label-caps"
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 10.5, color: 'var(--text-muted)' }}
        >
          Close
        </button>
      </div>

      {error ? (
        <Centered title="round did not start" hint={error} />
      ) : candidateIds.length === 0 ? (
        <Centered title="nothing left to try" hint="Everything on the list has a tick next to it. Add somewhere new." />
      ) : !round ? (
        <Centered title="dealing…" hint="Finding the five nearest places you have never been." />
      ) : matched.length > 0 ? (
        <Match
          restaurant={matched[0]}
          distance={distanceOf(matched[0])}
          initial={initialFor(matched[0])}
          extraMatches={matched.length - 1}
          onDetails={() => {
            onClose()
            onOpenRestaurant(matched[0].id)
          }}
          onAnother={async () => {
            if (round) await closeRound(round.id)
            onClose()
          }}
        />
      ) : pending.length === 0 ? (
        <Centered
          title={others.length === 0 ? `waiting on ${theirName}` : 'no match yet'}
          hint={
            others.length === 0
              ? `You have swiped all ${deck.length}. Nothing matches until ${theirName} opens tonight? too.`
              : `${theirName} has swiped ${theirVoteCount} of ${deck.length}. A match appears here the moment you both keep the same place.`
          }
        />
      ) : (
        <>
          <div className="font-stamp" style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 20px 12px' }}>
            {dealtByThem ? `${theirName} dealt this round · ` : ''}
            {deck.length - pending.length} of {deck.length} swiped
            {others.length > 0 && ` · ${theirName} is on ${theirVoteCount}`}
          </div>

          <div style={{ position: 'relative', flex: 1, margin: '0 20px' }}>
            {pending.slice(0, 3).map((restaurant, offset) => {
              const isTop = offset === 0
              const dx = isTop ? (flick !== 0 ? flick * 520 : drag) : 0
              const distance = distanceOf(restaurant)

              return (
                <article
                  key={restaurant.id}
                  onPointerDown={isTop ? handlePointerDown : undefined}
                  onPointerMove={isTop ? handlePointerMove : undefined}
                  onPointerUp={isTop ? handlePointerEnd : undefined}
                  onPointerCancel={isTop ? handlePointerEnd : undefined}
                  style={{
                    position: 'absolute',
                    inset: '0 0 auto',
                    height: 336,
                    zIndex: 3 - offset,
                    borderRadius: 'var(--radius-xl)',
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    background: penColor(penOf(restaurant)),
                    color: '#fff',
                    boxShadow: 'var(--shadow-lg)',
                    touchAction: 'pan-y',
                    transform: `translateX(${dx}px) translateY(${offset * 7}px) rotate(${dx / 22}deg) scale(${1 - offset * 0.02})`,
                    opacity: isTop && flick !== 0 ? 0 : 1,
                    transition: dragging && isTop ? 'none' : 'transform 0.26s cubic-bezier(0.32,0.72,0,1), opacity 0.24s',
                  }}
                >
                  <div className="label-caps" style={{ fontSize: 10, opacity: 0.82 }}>
                    {[restaurant.categories[0]?.name ?? 'Unfiled', initialFor(restaurant)].filter(Boolean).join(' · ')}
                  </div>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.07,
                      marginTop: 6,
                      textWrap: 'balance',
                    }}
                  >
                    {restaurant.name}
                  </div>
                  <div className="font-stamp" style={{ marginTop: 'auto', fontSize: 12.5, lineHeight: 1.7, opacity: 0.94 }}>
                    {distance != null && (
                      <>
                        {formatDistance(distance)} from here
                        <br />
                      </>
                    )}
                    {restaurant.address ?? 'No address saved'}
                  </div>

                  {isTop && Math.abs(drag) > 12 && (
                    <div
                      className="label-caps"
                      style={{
                        position: 'absolute',
                        top: 18,
                        right: 18,
                        fontSize: 12,
                        border: '2px solid currentColor',
                        borderRadius: 6,
                        padding: '5px 9px 4px',
                        transform: 'rotate(-8deg)',
                        opacity: Math.min(1, Math.abs(drag) / 80),
                      }}
                    >
                      {drag > 0 ? 'keep' : 'skip'}
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          <div
            className="font-stamp"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              padding: '16px 20px max(22px, env(safe-area-inset-bottom))',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <button onClick={() => commit(-1)} style={footButtonStyle}>
              ← skip
            </button>
            <span aria-hidden>·</span>
            <button onClick={() => commit(1)} style={footButtonStyle}>
              keep →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const footButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: 'inherit',
  font: 'inherit',
}

function Match({
  restaurant,
  distance,
  initial,
  extraMatches,
  onDetails,
  onAnother,
}: {
  restaurant: Restaurant
  distance: number | null
  initial: string | null
  extraMatches: number
  onDetails: () => void
  onAnother: () => void
}) {
  return (
    <div
      className="animate-scale-in"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '0 28px 80px',
        textAlign: 'center',
      }}
    >
      <div className="label-caps" style={{ fontSize: 10, color: 'var(--accent-secondary)' }}>
        you both kept it
      </div>
      <div className="font-script" style={{ fontSize: 44, lineHeight: 1.04, color: 'var(--text-primary)' }}>
        {restaurant.name}
      </div>
      <div className="font-stamp" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
        {[
          distance != null ? `${formatDistance(distance)} away` : null,
          restaurant.categories[0]?.name.toLowerCase(),
          initial ? `${initial} added it` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </div>
      {extraMatches > 0 && (
        <div className="font-stamp" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          +{extraMatches} more you both kept
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          href={getGoogleMapsUrl(restaurant)}
          target="_blank"
          rel="noreferrer"
          className="label-caps"
          style={{
            padding: '12px 20px 11px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-secondary)',
            color: '#fff',
            fontSize: 10.5,
            textDecoration: 'none',
          }}
        >
          Open in Maps
        </a>
        <button onClick={onDetails} className="label-caps" style={secondaryStyle}>
          Details
        </button>
        <button onClick={onAnother} className="label-caps" style={secondaryStyle}>
          New round
        </button>
      </div>
    </div>
  )
}

const secondaryStyle: React.CSSProperties = {
  padding: '12px 20px 11px',
  borderRadius: 'var(--radius-full)',
  border: '1.5px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: 10.5,
}

function Centered({ title, hint }: { title: string; hint: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '0 32px 80px',
        textAlign: 'center',
      }}
    >
      <div className="font-script" style={{ fontSize: 34, color: 'var(--text-secondary)' }}>
        {title}
      </div>
      <div className="font-stamp" style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        {hint}
      </div>
    </div>
  )
}
