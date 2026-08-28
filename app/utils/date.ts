import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

/** ISO datetime → HTML datetime-local value (`YYYY-MM-DDTHH:mm:ss`). */
export function serverDateToInput(value: string | null | undefined): string {
  if (!value) { return '' }
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

/** ISO date/datetime string → HTML date input value (`YYYY-MM-DD`). */
export function serverDateOnlyToInput(value: string | null | undefined): string {
  if (!value) { return '' }
  return dayjs(value).format('YYYY-MM-DD')
}

/** HTML datetime-local value → ISO datetime string (`YYYY-MM-DDTHH:mm:ss`). */
export function inputDateToServer(value: string | null | undefined): string | null {
  if (!value) { return null }
  return dayjs(value, ['YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DDTHH:mm']).format('YYYY-MM-DDTHH:mm:ss')
}

/**
 * Formats ISO datetime string for localized display (no timezone conversion).
 *  en → `YYYY-MM-DD (HH:mm:ss)`  |  it → `DD/MM/YYYY (HH:mm:ss)`
 */
export function formatServerDate(value: string | null | undefined, locale: string): string {
  if (!value) { return '' }
  const fmt = locale === 'it' ? 'DD/MM/YYYY (HH:mm:ss)' : 'YYYY-MM-DD (HH:mm:ss)'
  return dayjs(value).format(fmt)
}

/**
 * Formats ISO date-only string for localized display.
 *  en → `YYYY-MM-DD`  |  it → `DD/MM/YYYY`
 */
export function formatServerDateOnly(value: string | null | undefined, locale: string): string {
  if (!value) { return '' }
  const fmt = locale === 'it' ? 'DD/MM/YYYY' : 'YYYY-MM-DD'
  return dayjs(value).format(fmt)
}

/**
 * Formats a date-only range for display; collapses to a single date when
 * both ends are the same day.
 */
export function formatServerDateRange(from: string | null | undefined, to: string | null | undefined, locale: string): string {
  const start = formatServerDateOnly(from, locale)
  const end = formatServerDateOnly(to, locale)
  if (!start) { return end }
  if (!end || start === end) { return start }
  return `${start} – ${end}`
}
