# 03 — Struttura del progetto

Questo capitolo è una visita guidata del repository, così saprai dove cercare per ogni esigenza.

## Layout di primo livello

```
matches-dashboard-laravel/
├── app/                  # TUTTO il codice applicativo sta qui (convenzione Nuxt 4)
├── i18n/locales/         # File di traduzione: it.json (default), en.json
├── public/               # File statici serviti così come sono (favicon, manifest)
├── docs/                 # Questa documentazione (en/ e it/)
├── postman/              # Collezioni Postman per le API (test manuali)
├── nuxt.config.ts        # Configurazione Nuxt — la centralina del progetto
├── app.config.ts         # (dentro app/) configurazione UI modificabile a runtime
├── package.json          # Dipendenze e script
├── Dockerfile            # Build multi-stage → immagine nginx
├── nginx.conf            # Routing SPA per il container
├── Makefile              # Target di comodo (make dev, make setup…)
├── CLAUDE.md / README.md / DB.md   # Documentazione alla radice
```

> [!NOTE]
> In Nuxt 4 il codice applicativo vive sotto `app/` (è la convenzione "srcDir"). I file di configurazione come `nuxt.config.ts` restano alla radice del repository.

## Dentro `app/`

```
app/
├── app.vue               # Componente radice — l'involucro più esterno di ogni pagina
├── app.config.ts         # Token del tema UI (colori) + versione dell'app
├── assets/               # Asset inclusi nel bundle (logo.png, css/main.css)
├── components/           # Componenti riutilizzabili (auto-importati dal nome file)
├── composables/          # Funzioni di logica riutilizzabile (useApi, useAuth, …)
├── layouts/              # Gusci di pagina (default.vue = la cornice con sidebar admin)
├── pages/                # Rotte — il percorso del file diventa il percorso URL
├── plugins/              # Codice eseguito una volta all'avvio dell'app
├── types/                # Interfacce TypeScript (models.ts)
└── utils/                # Funzioni di supporto pure (constants.ts, date.ts)
```

Ogni cartella ha un compito chiaro:

### `pages/` — le rotte (routing basato sui file)

La struttura delle cartelle *è* la struttura degli URL. Alcuni esempi da questo repo:

| File | URL |
|------|-----|
| `app/pages/index.vue` | `/` (reindirizza a `/admin`) |
| `app/pages/login.vue` | `/login` |
| `app/pages/admin/index.vue` | `/admin` |
| `app/pages/admin/settings.vue` | `/admin/settings` |
| `app/pages/admin/configurations/athletes.vue` | `/admin/configurations/athletes` |
| `app/pages/admin/tournaments/index.vue` | `/admin/tournaments` |
| `app/pages/admin/tournaments/match_records/index.vue` | `/admin/tournaments/match_records` |
| `app/pages/admin/tournaments/match_records/board.vue` | `/admin/tournaments/match_records/board` |
| `app/pages/public/athletes/registration.vue` | `/public/athletes/registration` |
| `app/pages/public/tournaments/match_records.vue` | `/public/tournaments/match_records` |

Con i18n, le versioni inglesi ricevono automaticamente un prefisso `/en/` (es. `/en/admin/settings`). L'italiano, lingua di default, non ha prefisso.

Ogni pagina può dichiarare metadati tramite `definePageMeta({...})`. Due pattern contano qui:

- Le pagine admin usano `definePageMeta({ layout: 'default' })` per avvolgersi nel guscio con sidebar.
- Le pagine pubbliche usano `definePageMeta({ layout: false, sanctum: { excluded: true } })` — niente sidebar, ed esenti dall'obbligo di login (vedi il [Capitolo 05](05-authentication.md)).

### `components/` — i pezzi di UI riutilizzabili

I componenti sono auto-importati dal nome file, quindi `<DataTable />` in qualsiasi template fa riferimento a `app/components/DataTable.vue` senza alcuna riga di import. I più importanti:

| Componente | Scopo |
|------------|-------|
| `DataTable.vue` | Tabella generica, paginata e ricercabile. La spina dorsale di ogni elenco admin. Vedi il [Capitolo 06](06-admin-crud-pattern.md). |
| `*FormPanel.vue` | Uno per risorsa (`AthleteFormPanel`, `TournamentFormPanel`, `MatchRecordFormPanel`, `UserFormPanel`, `DisciplineFormPanel`, `WeightCategoryFormPanel`, `RegistrationFormPanel`). Un form di creazione/modifica a pannello laterale. |
| `ApiSelectMenu.vue` | Un menu a tendina ricercabile che carica le opzioni da un endpoint API (con scroll infinito). |
| `MatchRecordCardReadOnly.vue` | Un singolo incontro mostrato come scheda (usato nel tabellone pubblico). |
| `MatchRecordJudgesPointsTable.vue` | Renderizza la griglia dei punteggi dei giudici round per round. |
| `LocaleSwitcher.vue`, `ColorModeSwitcher.vue` | Selettori di lingua e modalità chiara/scura. |

### `composables/` — logica riutilizzabile

Sono le funzioni `useXxx()` (vedi il [Capitolo 02](02-tech-stack-concepts.md) per cosa sia un composable):

| Composable | Scopo | Capitolo |
|------------|-------|----------|
| `useApi.ts` | Wrapper HTTP (`get/post/put/del/download`) con header di lingua | [07](07-data-flow-api.md) |
| `useAuth.ts` | Login/logout/utente corrente, incapsula Sanctum | [05](05-authentication.md) |
| `useUser.ts` | Piccolo helper che espone `user` e un `clear()` | [05](05-authentication.md) |
| `useEcho.ts` | Restituisce l'istanza realtime di Laravel Echo | [08](08-realtime-scoreboard.md) |
| `useTournamentMatchRecords.ts` | Si sottoscrive agli aggiornamenti live degli incontri di un torneo | [08](08-realtime-scoreboard.md) |
| `useColorPreference.ts` | Legge/scrive il colore del tema dell'utente | [10](10-i18n-theming.md) |

### `plugins/` — codice di avvio

I plugin girano una volta sola all'avvio dell'app. Il suffisso `.client.ts` significa "solo browser" (rilevante perché questa è una SPA, ma documenta l'intento).

| Plugin | Cosa fa |
|--------|---------|
| `echo.client.ts` | Crea la connessione WebSocket Laravel Echo / Reverb e la fornisce come `$echo` |
| `color-preference.client.ts` | Applica il colore del tema salvato all'avvio |
| `auth.ts` | Aggancia `sanctum:logout` per ripulire lo stato utente locale |

### `layouts/` — gusci di pagina

`default.vue` è la cornice admin: una sidebar collassabile (`UDashboardSidebar`) con il menu di navigazione, il badge della versione e un menu utente con logout. Le pagine admin si renderizzano *dentro* il suo `<slot />`. Le pagine pubbliche si tirano fuori con `layout: false`.

### `utils/` — helper puri

- `constants.ts` — tutti gli enum di dominio come array `as const` (`GENDERS`, `TOURNAMENT_STATUSES`, `MATCH_STATUSES`, `END_METHODS`, `CLIENT_TYPES`), le opzioni di dimensione pagina e la palette di colori del tema. **Importa i valori degli enum da qui invece di scrivere stringhe a mano.** Vedi il [Capitolo 09](09-domain-model.md).
- `date.ts` — helper di formattazione date basati su `moment` (conversione server ↔ input, visualizzazione localizzata).

### `types/` — le forme dei dati

`models.ts` dichiara le `interface` TypeScript per ogni entità del backend (`Athlete`, `Tournament`, `Registration`, `MatchRecord`, `User`, `Discipline`, `WeightCategory`) e l'involucro `PaginatedResponse<T>` che Laravel restituisce. Vedi il [Capitolo 09](09-domain-model.md).

Ora che sai *dove* sono le cose, il prossimo capitolo spiega come costruire ed eseguire davvero l'app.
