/**
 * Logo custom opzionale: se presente un file "sidebar_logo.*" in app/assets/,
 * sostituisce l'icona di default su sidebar, login e pagine pubbliche.
 */
export function useAppLogo() {
  const logoModules = import.meta.glob<string>('~/assets/sidebar_logo.*', {
    eager: true,
    import: 'default',
  })
  const logoUrl = Object.values(logoModules)[0]

  return { logoUrl }
}
