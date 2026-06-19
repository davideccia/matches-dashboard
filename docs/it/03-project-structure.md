# 03 — Struttura del progetto

> Vedi anche: [02 — Stack tecnologico e concetti](02-tech-stack-concepts.md), [05 — Autenticazione](05-authentication.md), [07 — Il pattern CRUD admin](07-admin-crud-pattern.md)

Questo capitolo è una mappa del repository: dove vive cosa, e come la struttura di cartelle si traduce in URL.

## Vista d'insieme

```
app/
├── app.config.ts        # token di tema (@nuxt/ui): colori primario/secondario/neutro
├── app.vue              # componente radice (monta layout + pagina)
├── assets/              # logo, CSS globale
├── components/          # componenti riutilizzabili
│   ├── DataTable.vue          # tabella paginata generica
│   ├── ApiSelectMenu.vue      # select che carica opzioni da un endpoint
│   ├── MatchRecordCardReadOnly.vue
│   └── panels/                # pannelli-form (slideover) per il CRUD
│       ├── AthleteFormPanel.vue
│       ├── TournamentFormPanel.vue
│       └── …
├── composables/         # logica riutilizzabile con stato (useXxx)
│   ├── useApi.ts              # client HTTP verso l'API Laravel
│   ├── useAuth.ts             # stato di autenticazione
│   ├── useEcho.ts             # accesso all'istanza Echo
│   ├── useTournamentMatchRecords.ts  # sottoscrizione WebSocket
│   └── useColorPreference.ts  # colore del tema a runtime
├── layouts/
│   └── default.vue            # guscio admin: sidebar collassabile + slot pagina
├── pages/               # routing basato sui file (vedi sotto)
│   ├── index.vue              # `/` → redirect a /admin
│   ├── login.vue              # `/login`
│   ├── admin/                 # pagine autenticate
│   └── public/                # pagine non autenticate
├── plugins/             # codice di avvio
│   ├── echo.client.ts         # inizializza Laravel Echo (solo client)
│   ├── auth.ts                # hook sul logout di Sanctum
│   └── color-preference.client.ts  # applica il colore salvato all'avvio
├── types/
│   └── models.ts              # interfacce TypeScript del dominio
└── utils/
    ├── constants.ts           # enum del dominio + palette colori
    └── date.ts                # helper di formattazione date

i18n/locales/            # it.json (default) + en.json — da tenere allineati
docs/                    # questa documentazione (it + en)
```

## Routing basato sui file

In Nuxt, ogni file `.vue` dentro [`app/pages/`](../../app/pages/) diventa una rotta. Il percorso del file *è* l'URL:

| File | URL |
|------|-----|
| `pages/index.vue` | `/` |
| `pages/login.vue` | `/login` |
| `pages/admin/index.vue` | `/admin` |
| `pages/admin/tournaments/index.vue` | `/admin/tournaments` |
| `pages/admin/tournaments/registrations.vue` | `/admin/tournaments/registrations` |
| `pages/admin/tournaments/match_records/index.vue` | `/admin/tournaments/match_records` |
| `pages/admin/tournaments/match_records/board.vue` | `/admin/tournaments/match_records/board` |
| `pages/admin/configurations/athletes.vue` | `/admin/configurations/athletes` |
| `pages/public/athletes/registration.vue` | `/public/athletes/registration` |
| `pages/public/tournaments/match_records.vue` | `/public/tournaments/match_records` |

(L'elenco completo delle rotte è anche nel [`README.md`](../../README.md).)

Con l'i18n attivo, le stesse pagine sono raggiungibili anche con prefisso `/en/` per l'inglese (es. `/en/admin/tournaments`); l'italiano, essendo default, non ha prefisso. Vedi [Capitolo 11](11-i18n-theming.md).

### admin vs public: due mondi

La separazione tra `pages/admin/` e `pages/public/` non è solo organizzativa: determina l'**autenticazione**. Tutte le rotte sono protette per default dal middleware globale di Sanctum; le pagine pubbliche disattivano la protezione con `definePageMeta({ sanctum: { excluded: true } })`. Dettagli nel [Capitolo 05](05-authentication.md).

## Come si compongono i pezzi

Una tipica pagina admin **non** contiene molta logica: orchestra componenti riutilizzabili.

```
layouts/default.vue          ← sidebar + guscio (vale per tutte le pagine admin)
   └── pages/admin/…/foo.vue ← la pagina: definisce colonne e gestisce gli stati
         ├── <DataTable>      ← tabella paginata generica
         ├── <FooFormPanel>   ← slideover per creare/modificare
         └── <ApiSelectMenu>  ← (dentro il form) select da endpoint
```

Questa ricetta — tabella + pannello-form + select — è descritta in dettaglio nel [Capitolo 07](07-admin-crud-pattern.md). La regola di [`nuxt.config.ts`](../../nuxt.config.ts) (righe 9-12)

```ts
components: [
  { path: '~/components/panels', pathPrefix: false },
  '~/components',
],
```

dice a Nuxt di auto-registrare i pannelli **senza** prefisso di percorso: per questo si scrive `<AthleteFormPanel>` e non `<PanelsAthleteFormPanel>`.

## Convenzione `.client.ts` nei plugin

I plugin con suffisso `.client.ts` (es. [`echo.client.ts`](../../app/plugins/echo.client.ts), [`color-preference.client.ts`](../../app/plugins/color-preference.client.ts)) girano **solo nel browser**, mai in fase di build. Ha senso per il WebSocket e per i cookie, che esistono solo lato client.
