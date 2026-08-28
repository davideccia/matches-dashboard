import { createHash } from 'node:crypto'

/**
 * Content-Security-Policy con hash degli inline script.
 *
 * Nuxt inietta nell'HTML tre script inline che non possiamo togliere: l'importmap,
 * lo snippet di @nuxtjs/color-mode e `window.__NUXT__.config` (il payload di
 * runtimeConfig). Un `script-src 'self'` secco li blocca e la app non parte.
 *
 * Le alternative sarebbero `'unsafe-inline'` — che vanifica la CSP, e la CSP è
 * l'unica mitigazione del token leggibile da JS (docs/security-issues #1) — oppure
 * hash fissi in configurazione, che si rompono a ogni build perché quegli script
 * contengono il nome hashato dell'entry e i valori di ambiente.
 *
 * Quindi gli hash si calcolano qui, sull'HTML appena reso: passano esattamente
 * quei tre script e nient'altro. Un `<script>` iniettato resta bloccato.
 *
 * In dev la CSP non viene applicata: Vite inietta i suoi script e l'HMR ha bisogno
 * di eval e websocket, e in locale non c'è niente da proteggere.
 */

const POLICY = [
  'default-src \'self\'',
  'base-uri \'self\'',
  'object-src \'none\'',
  'frame-ancestors \'none\'',
  'style-src \'self\' \'unsafe-inline\'', // debito: richiesto da Nuxt UI / Tailwind
  'img-src \'self\' data:',
  'font-src \'self\' data:',
  // Permissivo di proposito: l'app può ripuntare il base URL a runtime su un host
  // qualsiasi (override `matches.api-override`), API e Reverb inclusi — e in test o
  // in LAN quell'host parla http/ws, non solo https/wss. Restringere qui vorrebbe
  // dire rompere quella funzione, che è un requisito operativo: questa direttiva è
  // quindi di fatto decorativa. Il valore della CSP sta in `script-src`.
  'connect-src \'self\' https: wss: http: ws:',
]

const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi

function sha256(body: string): string {
  return `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`
}

function inlineScriptHashes(chunks: string[]): string[] {
  const hashes = new Set<string>()

  for (const chunk of chunks) {
    for (const [, attrs, body] of chunk.matchAll(INLINE_SCRIPT)) {
      // `type="application/json"` non è eseguibile: la CSP non lo riguarda.
      if (/type\s*=\s*["']application\/json["']/i.test(attrs ?? '')) { continue }
      if (body?.trim()) { hashes.add(sha256(body)) }
    }
  }

  return [...hashes]
}

export default defineNitroPlugin((nitro) => {
  if (import.meta.dev) { return }

  nitro.hooks.hook('render:html', (html, { event }) => {
    const chunks = [...html.head, ...html.bodyPrepend, ...html.body, ...html.bodyAppend]
    const scriptSrc = ['script-src \'self\'', ...inlineScriptHashes(chunks)].join(' ')

    event.node.res.setHeader('Content-Security-Policy', [...POLICY, scriptSrc].join('; '))
  })
})
