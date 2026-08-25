// ==============================================================================
// PM2 — https://nuxt.com/docs/4.x/getting-started/deployment#pm2
//
// .cjs e non .js: package.json ha "type": "module" e PM2 carica il file con
// require().
//
// Lo script è l'output di `nuxt build` (preset Nitro node-server), non di
// `nuxt generate`: con ssr:false Nitro serve la SPA e fa da solo il fallback su
// index.html per le rotte dinamiche (/admin/tournaments/42).
// ==============================================================================

module.exports = {
  apps: [
    {
      name: 'matches-dashboard',
      script: './.output/server/index.mjs',
      exec_mode: 'cluster',
      // Una sola istanza basta per servire una SPA: il processo non fa altro che
      // rispondere con file già in memoria. Alza a 'max' solo se il proxy davanti
      // misura davvero saturazione CPU.
      instances: 1,
      // HOST/PORT sono le variabili che legge Nitro a runtime (non build-time).
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 3000,
      },
    },
  ],
}
