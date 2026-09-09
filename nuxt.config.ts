// https://nuxt.com/docs/api/configuration/nuxt-config
/// <reference types="node" />
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: [
    /**
     * Stampa un alias comodo in console per `nuxt dev` (127.0.0.1 → matches.localhost).
     * Richiede una riga in /etc/hosts: `127.0.0.1 matches.localhost`.
     * Va prima di 'nuxt-auth-sanctum' nell'array e logga in modo sincrono nel setup
     * (non nell'hook `listen`, che spara solo a fine avvio) per uscire prima del suo
     * "Sanctum module initialized...".
     */
    (_options, nuxt) => {
      if (!nuxt.options.dev) { return }
      const port = nuxt.options.devServer.port ?? 3000
      // Stessi colori ANSI usati da Nitro/listhen per le sue righe Local/Network,
      // così l'output resta coerente; i terminali linkificano un URL testuale da soli.
      // eslint-disable-next-line no-console
      console.log(`\n  \x1B[32m➜\x1B[39m  \x1B[2mAlias:   \x1B[22m \x1B[36m\x1B[1mhttp://matches.localhost:${port}/\x1B[22m\x1B[39m\n`)
    },

    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
    'nuxt-auth-sanctum',
  ],

  components: [
    { path: '~/components/panels', pathPrefix: false },
    '~/components',
  ],

  app: {
    head: {
      // L'intera app è fuori dai motori di ricerca: area admin + dati personali di
      // atleti (anche minori) sulle pagine pubbliche. Vedi docs/security-issues #7.
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

  // Header di sicurezza applicati da Nitro a ogni risposta (target Docker).
  // La CSP NON è qui: ha bisogno degli hash degli inline script di Nuxt, che
  // cambiano a ogni build — la calcola `server/plugins/csp.ts`.
  // Stanno qui e non solo sul reverse proxy così sono versionati e rivedibili:
  // vedi docs/security-issues/README.md #3. Su Amplify (build statica, nessun
  // server Nitro) vanno replicati nella console — vedi docker/production/README.md.
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Robots-Tag': 'noindex, nofollow',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        // L'HTML porta il payload di runtimeConfig: metterlo in cache significa
        // SPA vecchia E config vecchia dopo un deploy. Gli asset in /_nuxt/ hanno
        // l'hash nel nome e conservano il loro `immutable` (verificato).
        'Cache-Control': 'no-cache, must-revalidate',
      },
    },
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  runtimeConfig: {
    public: {
      // Password che sblocca lo switcher ambiente da /login.
      // Vuota ⇒ gesto disattivato (fail closed).
      envSwitcherPassword: process.env.NUXT_PUBLIC_ENV_SWITCHER_PASSWORD ?? '',
      reverbAppKey: process.env.NUXT_PUBLIC_REVERB_APP_KEY ?? '',
      reverbHost: process.env.NUXT_PUBLIC_REVERB_HOST ?? 'localhost',
      reverbPort: process.env.NUXT_PUBLIC_REVERB_PORT ?? '8080',
      reverbScheme: process.env.NUXT_PUBLIC_REVERB_SCHEME ?? 'http',
    },
  },
  css: ['~/assets/css/main.css'],

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'laravel-echo',
        'pusher-js',
        'zod',
      ],
    },
  },

  colorMode: {
    preference: 'system',
  },

  i18n: {
    defaultLocale: 'it',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'it', name: 'Italiano', file: 'it.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
  },

  sanctum: {
    // Default di build. A runtime può essere sovrascritto per-browser da useApiConfig().
    baseUrl: process.env.NUXT_BASE_URL ?? 'https://api.matches.it',
    mode: 'token',
    endpoints: {
      login: '/api/admin/auth/login',
      user: '/api/admin/auth/user',
      logout: '/api/admin/auth/logout',
    },
    redirect: {
      onLogin: '/admin',
      onLogout: '/',
      onGuestOnly: '/admin',
    },
    redirectIfUnauthenticated: true,
    globalMiddleware: {
      enabled: true,
      allow404WithoutAuth: true,
    },
  },
})
