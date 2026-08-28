import type { MatchRecord } from '~/types/models'

export const MISSING_VALUE = '-'

export interface CornerInfo {
  /** True when the corner has no athlete assigned (half bout). */
  missing: boolean
  /** Athlete full name, null when the corner is missing or not eager-loaded. */
  name: string | null
  /** Team name, or `MISSING_VALUE` when absent. */
  team: string
}

export function cornerInfo(match: MatchRecord, side: 'red' | 'blue'): CornerInfo {
  const isRed = side === 'red'
  return {
    missing: !(isRed ? match.red_corner_id : match.blue_corner_id),
    name: (isRed ? match.red_corner : match.blue_corner)?.full_name ?? null,
    team: (isRed ? match.red_corner_team : match.blue_corner_team) || MISSING_VALUE,
  }
}
