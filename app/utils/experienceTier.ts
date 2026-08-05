// ─── Experience tiers ────────────────────────────────────────────────────────

/** `min–max` match-count range, with ∞ when there is no upper bound. */
export function formatTierRange(min: number, max: number | null | undefined): string {
  return `${min}–${max ?? '∞'}`
}
