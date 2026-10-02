/** Conta i filtri valorizzati: `null`, `undefined` e stringa vuota contano come "non attivo". */
export function countActiveFilters(values: readonly unknown[]): number {
  return values.filter(v => v !== null && v !== undefined && v !== '').length
}
