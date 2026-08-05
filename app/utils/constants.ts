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

export const CLIENT_TYPES = ['desktop', 'mobile'] as const
export type ClientType = typeof CLIENT_TYPES[number]

export const PAGE_SIZES = [10, 20, 50, 100] as const

// Primo elemento = produzione (usato per capire se si è su un ambiente diverso).
export const API_ENDPOINTS = [
  'https://api.matches.it',
  'http://localhost:8081',
] as const

// Tutti i colori cromatici di Tailwind (esclusi i neutri: slate, gray, zinc, neutral, stone, ...).
export const COLOR_PALETTE = [
  { name: 'red', bgClass: 'bg-red-500' },
  { name: 'orange', bgClass: 'bg-orange-500' },
  { name: 'amber', bgClass: 'bg-amber-500' },
  { name: 'yellow', bgClass: 'bg-yellow-500' },
  { name: 'lime', bgClass: 'bg-lime-500' },
  { name: 'green', bgClass: 'bg-green-500' },
  { name: 'emerald', bgClass: 'bg-emerald-500' },
  { name: 'teal', bgClass: 'bg-teal-500' },
  { name: 'cyan', bgClass: 'bg-cyan-500' },
  { name: 'sky', bgClass: 'bg-sky-500' },
  { name: 'blue', bgClass: 'bg-blue-500' },
  { name: 'indigo', bgClass: 'bg-indigo-500' },
  { name: 'violet', bgClass: 'bg-violet-500' },
  { name: 'purple', bgClass: 'bg-purple-500' },
  { name: 'fuchsia', bgClass: 'bg-fuchsia-500' },
  { name: 'pink', bgClass: 'bg-pink-500' },
  { name: 'rose', bgClass: 'bg-rose-500' },
] as const
export type ColorName = typeof COLOR_PALETTE[number]['name']

// Secondario = colore adiacente nella ruota (l'ultimo torna al primo).
export const COLOR_SECONDARY_MAP: Record<string, string> = {
  red: 'orange',
  orange: 'amber',
  amber: 'yellow',
  yellow: 'lime',
  lime: 'green',
  green: 'emerald',
  emerald: 'teal',
  teal: 'cyan',
  cyan: 'sky',
  sky: 'blue',
  blue: 'indigo',
  indigo: 'violet',
  violet: 'purple',
  purple: 'fuchsia',
  fuchsia: 'pink',
  pink: 'rose',
  rose: 'red',
}
