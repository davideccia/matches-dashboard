// https://nuxt.com/docs/api/configuration/nuxt-config
/// <reference types="node" />
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxt/eslint', 'nuxt-auth-sanctum'],

  components: [
    { path: '~/components/panels', pathPrefix: false },
    '~/components',
  ],

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
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
    baseUrl: process.env.NUXT_PUBLIC_SANCTUM_BASE_URL ?? 'https://api.matches.it',
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
