export const GENDERS = ['male', 'female', 'hybrid'] as const
export type Gender = typeof GENDERS[number]

export const TOURNAMENT_STATUSES = [
  'scheduled',
  'registrations_opened',
  'registrations_closed',
  'in_progress',
  'completed',
  'cancelled',
] as const
export type TournamentStatus = typeof TOURNAMENT_STATUSES[number]

export const MATCH_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
] as const
export type MatchStatus = typeof MATCH_STATUSES[number]

export const END_METHODS = [
  'victory_unanimous_decision',
  'victory_split_decision',
  'victory_ko',
  'victory_tko',
  'victory_disqualification',
  'draw',
  'no_contest',
] as const
export type EndMethod = typeof END_METHODS[number]

export const EXPERIENCE_TIERS = ['beginner', 'intermediate', 'advanced'] as const
export type ExperienceTier = typeof EXPERIENCE_TIERS[number]

export const CLIENT_TYPES = ['desktop', 'mobile'] as const
export type ClientType = typeof CLIENT_TYPES[number]

export const PAGE_SIZES = [10, 20, 50, 100] as const

// Primo elemento = produzione (usato per capire se si è su un ambiente diverso).
export const API_ENDPOINTS = [
  'https://api.matches.it',
  'http://localhost:8081',
] as const

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
