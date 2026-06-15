export const GENDERS = ['MALE', 'FEMALE', 'HYBRID'] as const
export type Gender = typeof GENDERS[number]

export const TOURNAMENT_STATUSES = [
  'SCHEDULED',
  'REGISTRATIONS_OPENED',
  'REGISTRATIONS_CLOSED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const
export type TournamentStatus = typeof TOURNAMENT_STATUSES[number]

export const MATCH_STATUSES = [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const
export type MatchStatus = typeof MATCH_STATUSES[number]

export const END_METHODS = [
  'VICTORY_UNANIMOUS_DECISION',
  'VICTORY_SPLIT_DECISION',
  'VICTORY_KO',
  'VICTORY_TKO',
  'VICTORY_DISQUALIFICATION',
  'DRAW',
  'NO_CONTEST',
] as const
export type EndMethod = typeof END_METHODS[number]

export const CLIENT_TYPES = ['DESKTOP', 'MOBILE'] as const
export type ClientType = typeof CLIENT_TYPES[number]

export const PAGE_SIZES = [10, 20, 50, 100] as const

export const COLOR_PALETTE = [
  { name: 'sky', bgClass: 'bg-sky-500' },
  { name: 'blue', bgClass: 'bg-blue-500' },
  { name: 'violet', bgClass: 'bg-violet-500' },
  { name: 'pink', bgClass: 'bg-pink-500' },
  { name: 'rose', bgClass: 'bg-rose-500' },
  { name: 'orange', bgClass: 'bg-orange-500' },
  { name: 'emerald', bgClass: 'bg-emerald-500' },
  { name: 'teal', bgClass: 'bg-teal-500' },
] as const
export type ColorName = typeof COLOR_PALETTE[number]['name']

export const COLOR_SECONDARY_MAP: Record<string, string> = {
  sky: 'blue',
  blue: 'indigo',
  violet: 'purple',
  pink: 'rose',
  rose: 'red',
  orange: 'amber',
  emerald: 'teal',
  teal: 'cyan',
}
