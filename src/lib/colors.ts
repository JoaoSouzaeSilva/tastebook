/**
 * Category colours are user-chosen and stored as literal hex, so tints were built by
 * string concatenation (`${color}18`). That silently produces invalid CSS for any
 * value that isn't 6-digit hex, so go through here instead.
 */
export function withAlpha(color: string, alpha: number): string {
  const clamped = Math.min(1, Math.max(0, alpha))
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim())

  if (!hex) {
    return `color-mix(in srgb, ${color} ${Math.round(clamped * 100)}%, transparent)`
  }

  const suffix = Math.round(clamped * 255).toString(16).padStart(2, '0')
  return `#${hex[1]}${suffix}`
}
