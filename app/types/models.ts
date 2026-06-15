import type { EndMethod, Gender, MatchStatus, TournamentStatus } from '~/utils/constants'

export interface User {
  id: string
  email: string
  superadmin: boolean
  createdAt: string
}

export interface WeightCategory {
  id: string
  label: string
  value: number
}

export interface Discipline {
  id: string
  label: string
}

export interface Athlete {
  id: string
  firstName: string
  lastName: string
  birthDate: string
  gender: Gender
  taxNumber: string
  teamName: string | null
  defaultWeightCategoryId: string | null
  defaultDisciplineId: string | null
}

export interface Tournament {
  id: string
  name: string
  locationName: string
  locationAddress: string
  locationCity: string
  date: string
  status: TournamentStatus
}

export interface Registration {
  id: string
  athleteId: string
  tournamentId: string
  disciplineId: string
  weightCategoryId: string
  paidAt: string | null
  arrived: boolean
  weightIn: number | null
  notes: string | null
  athleteFullName?: string
  tournamentName?: string
  disciplineLabel?: string
  weightCategoryLabel?: string
  weightCategoryValue?: number
}

export interface JudgePointsRow {
  round: number
  redCornerJudge1: number | null
  redCornerJudge2: number | null
  redCornerJudge3: number | null
  blueCornerJudge1: number | null
  blueCornerJudge2: number | null
  blueCornerJudge3: number | null
}

export interface Match {
  id: string
  tournamentId: string
  redCornerId: string
  blueCornerId: string
  weightCategoryId: string
  disciplineId: string
  gender: Gender
  forced: boolean
  redCornerTeam: string
  blueCornerTeam: string
  sort: number
  scheduledTime: string | null
  winnerId: string | null
  endRound: string | null
  endMethod: EndMethod | null
  status: MatchStatus
  rounds: number | null
  minutesPerRound: number | null
  judgesPoints: JudgePointsRow[] | null
  tournamentName?: string
  redCornerFullName?: string
  blueCornerFullName?: string
  winnerFullName?: string | null
  weightCategoryLabel?: string
  disciplineLabel?: string
}

export interface PersonalAccessToken {
  id: number
  userId: string
  name: string
  tokenHash: string
  clientType: 'DESKTOP' | 'MOBILE'
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}
