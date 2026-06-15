# 02 — Struttura dei Moduli

> Vedi anche: [04 — UI e Navigazione](04-ui-navigation.md), [10 — Pattern Ricorrenti](10-notable-patterns.md).

Nuxt ha convenzioni forti: alcune cartelle dentro `app/` sono *auto-discovered* — Nuxt le scansiona in fase di build e genera routing, import e tipi a partire dai file trovati. In generale non si scrivono `import` per le cose in `components/`, `composables/`, o `utils/`; Nuxt le rende disponibili a livello globale.

## Layout del repository

```
matches-dashboard/
├── app/                  # tutto il codice dell'applicazione
├── i18n/locales/         # it.json, en.json — stringhe di traduzione
├── public/               # asset statici serviti così come sono
├── postman/              # collection per esplorare l'API (non usate a runtime)
├── docs/                 # questa documentazione
├── nuxt.config.ts        # configurazione del framework
├── package.json          # dipendenze e script
├── Dockerfile            # build multi-stage → nginx:alpine
├── nginx.conf            # routing SPA (try_files … /index.html)
├── eslint.config.mjs     # ESLint flat-config (preset antfu)
└── tsconfig.json         # estende il tsconfig generato da Nuxt
```

## Dentro `app/`

| Path                       | Auto-discovered? | Ruolo                                                                                                                                                |
|----------------------------|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `app.vue`                  | sì (entry)       | Componente radice. Monta `<UApp>` (il provider di `@nuxt/ui`, ≈ un context provider di alto livello) che avvolge `<NuxtLayout>` e `<NuxtPage>`.       |
| `app.config.ts`            | sì               | Config reattiva a runtime (token colore della UI, versione). Distinta da `nuxt.config.ts` — vedi [08](08-configuration-env.md).                       |
| `assets/css/main.css`      | no (importato)   | Config CSS-first di Tailwind v4 e stili globali.                                                                                                     |
| `pages/`                   | sì               | Routing basato sui file — ogni `.vue` diventa una rotta. Vedi [04](04-ui-navigation.md).                                                              |
| `layouts/`                 | sì               | `default.vue` è lo shell della sidebar admin. Le pagine fanno opt-out con `definePageMeta({ layout: false })`.                                        |
| `middleware/`              | sì               | Guard di rotta. `auth.global.ts` viene eseguito prima di ogni navigazione.                                                                            |
| `components/`              | sì               | Componenti `.vue` riusabili — auto-importati globalmente come `<DataTable>`, `<AthleteFormPanel>`, ecc.                                              |
| `composables/`             | sì               | Funzioni che iniziano con `use…` — `useApi`, `useAuth`, `useColorPreference`. Le *composable* di Vue (≈ React hook).                                  |
| `plugins/`                 | sì               | Inizializzatori runtime. `auth.client.ts` viene eseguito all'avvio dell'app per validare il JWT salvato.                                              |
| `utils/`                   | sì               | Funzioni pure e costanti. `constants.ts` contiene i valori degli enum del backend come tuple `as const`.                                              |

## Componenti: un file per ogni responsabilità

`app/components/` è piatta (senza sottocartelle). La nomenclatura rende ovvio il ruolo:

- `DataTable.vue` — tabella paginata generica; riceve `url` e `columns`. Vedi [10](10-notable-patterns.md).
- `*FormPanel.vue` (es. `AthleteFormPanel`, `TournamentFormPanel`, `MatchFormPanel`) — form validati con Zod dentro una `USlideover` (drawer laterale destro). Uno per risorsa.
- `LocaleSwitcher.vue`, `ColorModeSwitcher.vue`, `ApiSelectMenu.vue` — piccoli widget UI.
- `MatchCardReadOnly.vue`, `MatchJudgesPointsTable.vue` — componenti specifici per i match usati dallo scoreboard live e dalla board admin.
- `AppFooter.vue` — footer mostrato nella sidebar.

## Pagine: corrispondenza diretta con gli URL

```
app/pages/
├── index.vue                                # /        → redirect a /admin
├── login.vue                                # /login
├── admin/
│   ├── index.vue                            # /admin
│   ├── settings.vue                         # /admin/settings
│   ├── configurations/{users,athletes,disciplines,weight_categories}.vue
│   └── tournaments/{index,registrations}.vue
│       └── matches/{index,board}.vue        # /admin/tournaments/matches[/board]
└── public/
    ├── athletes/registration.vue            # /public/athletes/registration
    └── tournaments/matches.vue              # /public/tournaments/matches
```

Con i18n in modalità `prefix_except_default`, ogni pagina risponde anche su `/en/…` (l'italiano è il default e non ha prefisso). Vedi [04](04-ui-navigation.md).
