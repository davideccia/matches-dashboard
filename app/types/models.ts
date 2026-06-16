import type { EndMethod, Gender, MatchStatus, TournamentStatus } from '~/utils/constants'

// ─── Models ──────────────────────────────────────────────────────────────────

export interface Discipline {
  id: string
  label: string
  created_at: string
  updated_at: string
}

export interface WeightCategory {
  id: string
  label: string
  value: number
  created_at: string
  updated_at: string
}

export interface Athlete {
  id: string
  first_name: string
  last_name: string
  full_name: string
  birth_date: string // "YYYY-MM-DD"
  gender: Gender
  tax_number: string | null
  team_name: string | null
  default_weight_category_id: string | null
  default_discipline_id: string | null
  created_at: string
  updated_at: string
  // relazioni opzionali (se caricate con with())
  default_weight_category?: WeightCategory
  default_discipline?: Discipline
  registrations?: Registration[]
}

export interface Tournament {
  id: string
  name: string
  location_name: string
  location_address: string
  location_city: string
  date: string // "YYYY-MM-DD"
  status: TournamentStatus
  created_at: string
  updated_at: string
  // relazioni opzionali
  registrations?: Registration[]
  match_records?: MatchRecord[]
}

export interface Registration {
  id: string
  athlete_id: string
  tournament_id: string
  discipline_id: string
  weight_category_id: string
  paid_at: string | null // ISO 8601 datetime
  arrived: boolean
  weight_in: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // relazioni opzionali
  athlete?: Athlete
  tournament?: Tournament
  discipline?: Discipline
  weight_category?: WeightCategory
}

export interface MatchRecord {
  id: string
  tournament_id: string
  red_corner_id: string | null
  blue_corner_id: string | null
  weight_category_id: string | null
  discipline_id: string | null
  gender: Gender
  forced: boolean
  red_corner_team: string | null
  blue_corner_team: string | null
  sort: number
  scheduled_time: string | null // "HH:MM:SS"
  winner_id: string | null
  end_round: string | null
  end_method: EndMethod | null
  status: MatchStatus
  rounds: number
  minutes_per_round: number
  judges_points: Array<Record<string, unknown>> | null
  created_at: string
  updated_at: string
  // relazioni opzionali
  tournament?: Tournament
  red_corner?: Athlete
  blue_corner?: Athlete
  winner?: Athlete
  weight_category?: WeightCategory
  discipline?: Discipline
  // campi appended dall'API
  tournament_name?: string
  red_corner_full_name?: string | null
  blue_corner_full_name?: string | null
  winner_full_name?: string | null
  weight_category_label?: string
  discipline_label?: string
}

export interface User {
  id: string
  username: string
  email: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
  // password e remember_token sono $hidden — non compaiono mai nella risposta
}

// ─── Risposta paginata Laravel ────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
    path: string
    links: Array<{ url: string | null, label: string, active: boolean }>
  }
}
