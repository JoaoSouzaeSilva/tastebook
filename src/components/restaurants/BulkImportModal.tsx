'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Category, CreateRestaurantInput } from '@/types'

type ImportResult = {
  input: string
  status: 'imported' | 'skipped' | 'failed'
  name?: string
  message: string
}

type ImportCategoryMode = 'replace' | 'add'

interface BulkImportModalProps {
  categories: Category[]
  existingRestaurants: { name: string; google_maps_link?: string }[]
  onImport: (restaurants: CreateRestaurantInput[]) => Promise<void>
  onClose: () => void
}

const googleMapsUrlPattern = /^https?:\/\/(?:www\.)?(?:google\.[^/\s]+|maps\.app\.goo\.gl|goo\.gl)\/\S+/i

export function BulkImportModal({ categories, existingRestaurants, onImport, onClose }: BulkImportModalProps) {
  const [rawInput, setRawInput] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<ImportResult[]>([])
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [categoryMode, setCategoryMode] = useState<ImportCategoryMode>('replace')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isImporting) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isImporting, onClose])

  const parsedLines = useMemo(
    () =>
      rawInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [rawInput]
  )

  const uniqueCount = useMemo(() => {
    const seen = new Set<string>()
    for (const line of parsedLines) {
      seen.add(line.toLowerCase())
    }
    return seen.size
  }, [parsedLines])

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    )
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (parsedLines.length === 0) {
      setError('Paste at least one restaurant name or Google Maps link')
      return
    }

    setIsImporting(true)
    setError('')
    setResults([])
    setProgress({ completed: 0, total: parsedLines.length })

    const seenInputs = new Set<string>()
    const seenRestaurantKeys = new Set<string>()
    const existingNameKeys = new Set(existingRestaurants.map((item) => normalizeName(item.name)))
    const existingUrlKeys = new Set(
      existingRestaurants
        .map((item) => normalizeUrl(item.google_maps_link))
        .filter((value): value is string => Boolean(value))
    )

    const preparedRestaurants: CreateRestaurantInput[] = []
    const nextResults: ImportResult[] = []

    for (const line of parsedLines) {
      const inputKey = line.toLowerCase()
      if (seenInputs.has(inputKey)) {
        nextResults.push({ input: line, status: 'skipped', message: 'Duplicate line in this import' })
        setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }))
        continue
      }
      seenInputs.add(inputKey)

      const isUrl = googleMapsUrlPattern.test(line)
      const normalizedUrl = isUrl ? normalizeUrl(line) : null

      if (normalizedUrl && existingUrlKeys.has(normalizedUrl)) {
        nextResults.push({ input: line, status: 'skipped', message: 'Already saved in your list' })
        setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }))
        continue
      }

      try {
        const response = await fetch('/api/place-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(isUrl ? { url: line } : { query: line }),
        })

        const data = (await response.json()) as {
          error?: string
          name?: string
          address?: string
          avg_price?: CreateRestaurantInput['avg_price']
          photo_url?: string
          primary_type?: string
          types?: string[]
        }

        if (!response.ok || !data.name) {
          nextResults.push({
            input: line,
            status: 'failed',
            message: data.error ?? 'Could not find this place on Google Maps',
          })
          continue
        }

        const restaurantKey = normalizeName(data.name)
        if (existingNameKeys.has(restaurantKey) || seenRestaurantKeys.has(restaurantKey)) {
          nextResults.push({
            input: line,
            status: 'skipped',
            name: data.name,
            message: 'Already saved in your list',
          })
          continue
        }

        seenRestaurantKeys.add(restaurantKey)
        const inferredCategoryIds = inferCategoryIdsFromPlaceData(data, categories)

        const finalCategoryIds =
          selectedCategoryIds.length === 0
            ? inferredCategoryIds
            : categoryMode === 'replace'
              ? selectedCategoryIds
              : Array.from(new Set([...inferredCategoryIds, ...selectedCategoryIds]))

        preparedRestaurants.push({
          name: data.name,
          google_maps_link: isUrl ? line : undefined,
          address: data.address,
          avg_price: data.avg_price,
          photo_url: data.photo_url,
          status: 'want_to_try',
          category_ids: finalCategoryIds,
        })
        nextResults.push({
          input: line,
          status: 'imported',
          name: data.name,
          message: describeImportResult(inferredCategoryIds.length, finalCategoryIds.length, selectedCategoryIds.length),
        })
      } catch {
        nextResults.push({
          input: line,
          status: 'failed',
          message: 'Could not reach the lookup service',
        })
      } finally {
        setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }))
      }
    }

    try {
      if (preparedRestaurants.length > 0) {
        await onImport(preparedRestaurants)
      }

      setResults(
        nextResults.map((result) =>
          result.status === 'imported'
            ? { ...result, message: 'Imported successfully' }
            : result
        )
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bulk import failed'
      setError(message)
      setResults(nextResults)
    } finally {
      setIsImporting(false)
    }
  }

  const importedCount = results.filter((result) => result.status === 'imported').length
  const skippedCount = results.filter((result) => result.status === 'skipped').length
  const failedCount = results.filter((result) => result.status === 'failed').length

  const inputStyle = {
    width: '100%',
    minHeight: 180,
    padding: '14px 16px',
    border: '1.5px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    fontSize: 15,
    background: 'var(--bg-base)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'var(--font-body)',
    resize: 'vertical' as const,
    lineHeight: 1.5,
  }

  return (
    <div
      className="animate-fade-in"
      onClick={() => {
        if (!isImporting) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          maxHeight: '92svh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-default)' }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <h2 className="font-display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>
              Bulk import
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-subtle)',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontSize: 18,
              lineHeight: 1,
              opacity: isImporting ? 0.5 : 1,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleImport} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Apply categories during import
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {([
                  { value: 'replace', label: 'Use selected only' },
                  { value: 'add', label: 'Add to inferred' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategoryMode(option.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${categoryMode === option.value ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                      background: categoryMode === option.value ? 'var(--accent-primary-light)' : 'transparent',
                      color: categoryMode === option.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map((category) => {
                  const active = selectedCategoryIds.includes(category.id)
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 'var(--radius-full)',
                        border: active ? `1.5px solid ${category.color}` : '1.5px solid var(--border-default)',
                        background: active ? `${category.color}14` : 'transparent',
                        color: active ? category.color : 'var(--text-secondary)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {category.icon && <span>{category.icon}</span>}
                      {category.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Restaurants to import
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => {
                  setRawInput(e.target.value)
                  setError('')
                }}
                placeholder={'Dishoom Covent Garden\nhttps://maps.google.com/...\nCervejaria Ramiro'}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
              />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>{parsedLines.length} lines pasted</span>
                <span>{uniqueCount} unique entries</span>
              </div>
            </div>

            {isImporting && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--accent-primary-light)',
                  border: '1px solid rgba(200,92,56,0.18)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--accent-primary)', marginBottom: 8 }}>
                  <span>Importing restaurants…</span>
                  <span>{progress.completed} / {progress.total}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'rgba(200,92,56,0.14)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progress.total === 0 ? 0 : (progress.completed / progress.total) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-gold) 100%)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', color: '#B91C1C', fontSize: 13 }}>
                {error}
              </div>
            )}

            {results.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={summaryPillStyle('rgba(22,163,74,0.12)', '#166534')}>{importedCount} imported</span>
                  <span style={summaryPillStyle('rgba(180,83,9,0.12)', '#92400E')}>{skippedCount} skipped</span>
                  <span style={summaryPillStyle('rgba(220,38,38,0.12)', '#991B1B')}>{failedCount} failed</span>
                </div>

                <div
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    background: 'var(--bg-base)',
                  }}
                >
                  {results.map((result, index) => (
                    <div
                      key={`${result.input}-${index}`}
                      style={{
                        padding: '12px 14px',
                        borderTop: index === 0 ? 'none' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {result.name ?? result.input}
                        </div>
                        {result.name && result.name !== result.input && (
                          <div style={{ marginTop: 2, fontSize: 12, color: 'var(--text-muted)' }}>{result.input}</div>
                        )}
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>{result.message}</div>
                      </div>
                      <span style={statusPillStyle(result.status)}>
                        {result.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  opacity: isImporting ? 0.5 : 1,
                  fontFamily: 'var(--font-body)',
                }}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isImporting || parsedLines.length === 0}
                style={{
                  flex: 1.4,
                  height: 48,
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark) 100%)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: isImporting || parsedLines.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: parsedLines.length === 0 ? 0.5 : 1,
                  fontFamily: 'var(--font-body)',
                }}
              >
                {isImporting ? 'Importing…' : 'Import restaurants'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function normalizeUrl(value?: string) {
  return value?.trim().toLowerCase().replace(/\/+$/, '') ?? null
}

function summaryPillStyle(background: string, color: string) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 999,
    background,
    color,
    fontSize: 12,
    fontWeight: 600,
  }
}

function statusPillStyle(status: ImportResult['status']) {
  if (status === 'imported') {
    return summaryPillStyle('rgba(22,163,74,0.12)', '#166534')
  }
  if (status === 'skipped') {
    return summaryPillStyle('rgba(180,83,9,0.12)', '#92400E')
  }
  return summaryPillStyle('rgba(220,38,38,0.12)', '#991B1B')
}

function describeImportResult(inferredCount: number, finalCount: number, manualCount: number) {
  if (manualCount > 0 && finalCount > 0) {
    return 'Imported with selected categories'
  }
  if (inferredCount > 0) {
    return 'Imported with inferred category'
  }
  return 'Imported successfully'
}

function inferCategoryIdsFromPlaceData(
  data: { primary_type?: string; types?: string[] },
  categories: Category[]
) {
  const candidateNames = buildTypeCandidates(data.primary_type, data.types ?? [])
  if (candidateNames.length === 0) return []

  return categories
    .filter((category) => {
      const normalizedCategory = normalizeName(category.name)
      return candidateNames.some((candidate) => candidate === normalizedCategory)
    })
    .map((category) => category.id)
}

function buildTypeCandidates(primaryType?: string, types: string[] = []) {
  const rawTypes = [primaryType, ...types].filter((value): value is string => Boolean(value))
  const candidates = new Set<string>()

  for (const type of rawTypes) {
    const phrase = type.replace(/_/g, ' ').trim()
    const simplified = phrase
      .replace(/\brestaurant\b/g, '')
      .replace(/\bfood\b/g, '')
      .replace(/\bpoint of interest\b/g, '')
      .replace(/\bestablishment\b/g, '')
      .replace(/\bshop\b/g, '')
      .replace(/\bhouse\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    candidates.add(normalizeName(phrase))
    if (simplified) {
      candidates.add(normalizeName(simplified))
    }
  }

  return Array.from(candidates).filter(Boolean)
}
