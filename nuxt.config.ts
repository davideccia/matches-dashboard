// https://nuxt.com/docs/api/configuration/nuxt-config
/// <reference types="node" />
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
    'nuxt-auth-sanctum',

    /**
     * /architecture (mappa dell'architettura) è uno strumento di sviluppo:
     * fuori da `nuxt dev` la rotta viene rimossa, così né l'URL né il contenuto
     * di docs/architecture.html finiscono nel bundle statico pubblicato.
     */
    (_options, nuxt) => {
      if (nuxt.options.dev) { return }
      nuxt.hook('pages:extend', (pages) => {
        // Per file, non per path: i18n può già aver aggiunto le varianti /en/.
        for (let i = pages.length - 1; i >= 0; i--) {
          if (pages[i]?.file?.endsWith('pages/architecture.vue')) { pages.splice(i, 1) }
        }
      })
    },
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
  // Stanno qui e non solo sul reverse proxy così sono versionati e rivedibili:
  // vedi docs/security-issues/README.md #3. Su Amplify (build statica, nessun
  // server Nitro) vanno replicati nella console — vedi docker/production/README.md.
  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy': 'default-src \'self\'; base-uri \'self\'; object-src \'none\'; frame-ancestors \'none\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; font-src \'self\' data:; connect-src \'self\' https: wss:',
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
