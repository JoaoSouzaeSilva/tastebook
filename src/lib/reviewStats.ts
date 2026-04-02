import type { RestaurantVisit } from '@/types'

export function getPricePerPerson(totalPaid?: number, partySize?: number) {
  if (
    totalPaid === undefined ||
    partySize === undefined ||
    !Number.isFinite(totalPaid) ||
    !Number.isFinite(partySize) ||
    partySize <= 0
  ) {
    return null
  }

  return totalPaid / partySize
}

export function formatEuroAmount(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function getLatestVisit(visits: RestaurantVisit[]) {
  if (visits.length === 0) return null

  return [...visits].sort((a, b) => {
    const dateDiff = new Date(b.date_visited).getTime() - new Date(a.date_visited).getTime()
    if (dateDiff !== 0) return dateDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })[0]
}

export function getAverageRating(visits: RestaurantVisit[]) {
  const ratedVisits = visits.filter((visit) => visit.rating !== undefined)
  if (ratedVisits.length === 0) return null

  const total = ratedVisits.reduce((sum, visit) => sum + (visit.rating ?? 0), 0)
  return Math.round((total / ratedVisits.length) * 10) / 10
}

export function getAverageSpendPerPerson(visits: RestaurantVisit[]) {
  const spendValues = visits
    .map((visit) => getPricePerPerson(visit.total_paid, visit.party_size))
    .filter((value): value is number => value !== null)

  if (spendValues.length === 0) return null

  const total = spendValues.reduce((sum, value) => sum + value, 0)
  return total / spendValues.length
}
