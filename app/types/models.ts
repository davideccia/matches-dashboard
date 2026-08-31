import type { EndMethod, Gender, MatchStatus, TournamentStatus } from '~/utils/constants'

// ─── Models ──────────────────────────────────────────────────────────────────

export interface Discipline {
  id: string
  label: string
  rounds: number | null
  minutes_per_round: string | null
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

export interface ExperienceTier {
  id: string
  tournament_id: string | null
  label: string
  min_match_count: number
  max_match_count: number | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface Athlete {
  id: string
  first_name: string
  last_name: string
  full_name: string
  birth_date: string // "YYYY-MM-DD"
  is_adult: boolean
  age: number
  gender: Gender
  tax_number: string | null
  email: string
  phone_number: string | null
  team_name: string | null
  generic_match_records_count?: number | null
  registered_match_records_count?: number | null
  match_records_count?: number | null
  created_at: string
  updated_at: string
  // relazioni opzionali (se caricate con with())
  registrations?: Registration[]
}

export interface MatchmakingIssue {
  registration_id: number
  athlete_id: number
  athlete_name: string
  is_adult: boolean
  discipline_id: number
  discipline_label: string
  weight_category_id: number
  weight_category_label: string
  // Free-form tier label coming from the experience_tiers table; null when the
  // athlete's match count falls outside every enabled tier (reason: 'no_tier').
  experience_tier: string | null
  match_count: number
  reason: 'no_tier' | 'unpaired'
}

export interface Tournament {
  id: string
  name: string
  location_name: string
  location_address: string
  location_city: string
  date: string // "YYYY-MM-DD"
  status: TournamentStatus
  matchmaking_issues: MatchmakingIssue[] | null
  created_at: string
  updated_at: string
  // relazioni opzionali
  registrations?: Registration[]
  match_records?: MatchRecord[]
  experience_tiers?: ExperienceTier[]
  disciplines?: Discipline[]
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

export interface JudgesPointsRow {
  round: number
  judge1_red: number | null
  judge1_blue: number | null
  judge2_red: number | null
  judge2_blue: number | null
  judge3_red: number | null
  judge3_blue: number | null
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
  unpaired: boolean
  rounds: number
  minutes_per_round: string | null
  judges_points: JudgesPointsRow[] | null
  notes: string | null
  created_at: string
  updated_at: string
  // relazioni opzionali
  tournament?: Tournament
  red_corner?: Athlete | null
  blue_corner?: Athlete | null
  winner?: Athlete | null
  weight_category?: WeightCategory
  discipline?: Discipline
}

export interface User {
  id: string
  username: string
  email: string
  email_verified_at: string | null
  superadmin: boolean
  created_at: string
  updated_at: string
  // password e remember_token sono $hidden — non compaiono mai nella risposta
}

export interface TemporaryUpload {
  id: string
  original_name: string
  mime_type: string
  size: string
}

export interface MediaAttachment {
  id: number
  uuid: string
  collection_name: string
  name: string
  file_name: string
  mime_type: string
  size: number
  order_column: number
  created_at: string
  updated_at: string
  temporary_url: string | null
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
