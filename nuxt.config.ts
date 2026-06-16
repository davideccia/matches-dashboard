// https://nuxt.com/docs/api/configuration/nuxt-config
/// <reference types="node" />
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxt/eslint', 'nuxt-auth-sanctum'],

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
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8081',
    },
  },
  css: ['~/assets/css/main.css'],

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@stomp/stompjs',
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
    baseUrl: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8081',
    mode: 'token',
    endpoints: {
      login: '/api/admin/auth/login',
      user: '/api/admin/auth/user',
      logout: '/api/admin/auth/logout',
    },
    redirect: {
      onLogout: '/login',
    },
    redirectIfUnauthenticated: true,
    globalMiddleware: {
      enabled: true,
      allow404WithoutAuth: true,
    },
  },
})
