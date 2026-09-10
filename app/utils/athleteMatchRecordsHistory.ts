import type { Athlete } from '~/types/models'

export interface HistoryRow {
  id: string | null
  label: string
  manual_total: number
  app_total: number
  useManualLabel: boolean
}

export function blankHistoryRow(): HistoryRow {
  return {
    id: null,
    label: '',
    manual_total: 0,
    app_total: 0,
    useManualLabel: false,
  }
}

export function historyRowsFromAthlete(item: Athlete): HistoryRow[] {
  return (item.match_records_history?.disciplines ?? []).map(d => ({
    id: d.id,
    label: d.label,
    manual_total: d.manual_total,
    app_total: d.app_total,
    useManualLabel: d.id === null,
  }))
}
