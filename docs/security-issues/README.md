# Revisione di sicurezza — matches_dashboard

**Data:** 2026-08-28 · **Commit:** `ab30600` · **Scope:** solo questo repo (SPA statica Nuxt 4, `ssr: false`).
L'autenticazione, l'autorizzazione e la validazione autorevole vivono nell'**API Laravel** separata
([matches-api-laravel](https://codeberg.org/davideccia/matches-api-laravel)) e **non sono state auditate qui**:
diversi punti sotto sono verificabili solo lato backend e vengono segnalati come tali.

## Sintesi

| # | Titolo | Severità | Dove |
|---|--------|----------|------|
| [1](#1-token-bearer-in-un-cookie-leggibile-da-javascript) | Token Bearer in cookie leggibile da JS | ALTA | `nuxt-auth-sanctum` (`mode: 'token'`) |
| [2](#2-override-api-in-localstorage-senza-allowlist) | Override API in `localStorage` senza allowlist → phishing persistente | ALTA | `app/composables/useApiConfig.ts` |
| [3](#3-nessun-security-header-nessuna-csp-nel-repo) | Nessun security header / CSP nel repo | ALTA | `docker/production/`, console Amplify |
| [4](#4-lookup-pubblico-degli-atleti-oracolo-su-dati-personali) | Lookup pubblico atleti = oracolo su dati personali | ALTA (backend) | `app/pages/public/athletes/registration.vue` |
| [5](#5-nessuna-autorizzazione-lato-client-tutto-o-niente) | Nessuna autorizzazione lato client (tutto-o-niente) | MEDIA | tutta l'area `/admin/**` |
| [6](#6-la-password-dellenv-switcher-non-è-un-controllo-di-accesso) | Password env-switcher non è un controllo d'accesso | MEDIA | `ApiEnvironmentUnlock.vue` |
| [7](#7-dati-personali-su-pagine-pubbliche-non-indicizzabili-ma-non-protette) | Dati personali su pagine pubbliche | MEDIA | `/public/**` |
| [8](#8-token-di-reset-password-nella-query-string) | Token di reset password nella query string | BASSA | `app/pages/reset-password.vue` |
| [9](#9-messaggi-derrore-del-backend-rilanciati-verbatim-in-ui) | Errori backend rilanciati verbatim in UI | BASSA | `getApiErrorMessage`, panel |
| [10](#10-dipendenze-1-advisory-low-solo-dev) | Dipendenze: 1 advisory `low` (solo dev) | BASSA | `esbuild` via `@nuxt/fonts` |
| [11](#11-secret-passati-come---build-arg-in-ci) | Secret passati come `--build-arg` in CI | INFO | `.forgejo/workflows/*.yml` |

**Esiti positivi:** nessun `v-html` / `innerHTML` / `eval` nell'app (nessuna sink XSS diretta);
nessun segreto hardcodato trovato nel working tree né nei 139 commit della history;
`.env*` correttamente in `.gitignore`; tutti gli input passano da schemi Zod; nessun `target="_blank"`
senza `rel`; nessun `console.log` residuo.

---

## 1. Token Bearer in un cookie leggibile da JavaScript

**Severità: ALTA** · `nuxt.config.ts:96` (`sanctum.mode: 'token'`), `app/composables/useApi.ts:35`

`nuxt-auth-sanctum` in modalità token salva il token nel cookie `sanctum.token.cookie` tramite
`useCookie(..., { secure: isSecure })` — quindi **senza `httpOnly`** (obbligatorio: il client JS deve
leggerlo per comporre l'header `Authorization`), **senza `sameSite` esplicito** (default del browser: `Lax`)
e **senza scadenza** (cookie di sessione). `useApi().download()` lo rilegge a mano:

```ts
const token = useCookie('sanctum.token.cookie')
headers: { Authorization: `Bearer ${token.value}` }
```

**Impatto.** Qualunque XSS — nella app, in una dipendenza compromessa o in uno script terzo — esfiltra il
token con una riga di `document.cookie`. Il token è un Bearer valido su tutta l'API admin.
Il rischio CSRF invece **non** si applica: l'autorizzazione viaggia in un header, non nel cookie.

**Rimedio.**
- Non è risolvibile lato frontend restando in `mode: 'token'` (è il trade-off della SPA statica). Le due
  contromisure reali sono: (a) **CSP stretta** (vedi [#3](#3-nessun-security-header-nessuna-csp-nel-repo)),
  che è la vera mitigazione dell'XSS; (b) **TTL breve dei token lato Laravel**
  (`expiration` su Sanctum) + revoca al logout.
- Se in futuro API e dashboard condividono il dominio di secondo livello, valutare il passaggio a
  `mode: 'cookie'` (SPA + `httpOnly` + CSRF token), che elimina la classe di problema.
- Verificare lato backend che `POST /api/admin/auth/logout` **revochi** il token e non si limiti a
  cancellare il cookie.

## 2. Override API in `localStorage` senza allowlist

**Severità: ALTA** · `app/composables/useApiConfig.ts:37-55`

```ts
const override = useState(STORAGE_KEY, () => JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'))
const config = computed(() => ({ ...build.value, ...(override.value ?? {}) }))
```

Il valore letto da `localStorage` viene **fuso nella config senza alcuna validazione**: `baseUrl` può essere
una stringa arbitraria, e da lì passano **tutte** le richieste, `/api/admin/auth/login` compreso
(`app/plugins/api-base-url.ts` riscrive `baseURL` a ogni chiamata).

**Impatto.** Un attaccante che riesca a scrivere una sola chiave in `localStorage` — via XSS, via console su
una postazione condivisa/chiosco, o convincendo un operatore a incollare uno snippet — installa un
**redirect persistente e invisibile** verso un server controllato: la schermata di login resta identica e
le credenziali admin vengono consegnate in chiaro. Sopravvive a reload e riavvii del browser.
`API_ENDPOINTS` esiste già ma è usato solo come default e per la spia "sei in produzione", non come vincolo.

**Rimedio.** Validare l'override contro l'allowlist esistente al momento della lettura *e* della scrittura:

```ts
// useApiConfig.ts — scarta qualunque override fuori allowlist
function sanitize(o: Partial<ApiConfig> | null): Partial<ApiConfig> | null {
  if (!o) { return null }
  if (o.baseUrl && !(API_ENDPOINTS as readonly string[]).includes(o.baseUrl)) { return null }
  return o
}
```

Applicarla sia nell'initializer di `useState` sia in `setOverride()`. Se serve poter puntare host
arbitrari in sviluppo, condizionare l'allowlist a `import.meta.dev`.
Vincolare inoltre `reverbHost` allo stesso criterio.

## 3. Nessun security header, nessuna CSP nel repo

**Severità: ALTA** · `docker/production/Dockerfile:8-10`, deploy Amplify

Il Dockerfile dichiara esplicitamente che header di sicurezza, `Cache-Control` e compressione
«vanno sul reverse proxy». Nel repo **non esiste alcuna configurazione** che li imposti, e per Amplify
la build spec vive nella console: **non è verificabile da qui se siano presenti**. Di fatto la SPA oggi
non ha garanzia di CSP, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`
né HSTS.

**Impatto.** Senza CSP, l'unica mitigazione contro l'esfiltrazione del token ([#1](#1-token-bearer-in-un-cookie-leggibile-da-javascript)) manca. Senza
`frame-ancestors 'none'` la dashboard è incorniciabile (clickjacking sulle azioni admin).

**Rimedio.** Definire gli header **nel repo**, non solo nella infrastruttura, così sono versionati e
rivedibili. Baseline per questa app (nessun inline script proprio; Reverb usa WebSocket):

```
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none';
  frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' data:; font-src 'self' data:;
  connect-src 'self' https://api.matches.it wss://reverb.matches.it
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Note operative: `connect-src` deve elencare gli host di `API_ENDPOINTS` + Reverb (e diventa un secondo
livello di difesa per [#2](#2-override-api-in-localstorage-senza-allowlist)); `style-src 'unsafe-inline'` è
oggi necessario a Nuxt UI/Tailwind — va trattato come debito, non come default.
Documentare la configurazione attesa in `docker/production/README.md` e replicarla nella console Amplify.

## 4. Lookup pubblico degli atleti: oracolo su dati personali

**Severità: ALTA (da verificare/risolvere lato backend)** · `app/pages/public/athletes/registration.vue:65-89`

```ts
await apiPost('/api/public/registration_form/athletes/lookup', { tax_number, email })
// → { data: { first_name, last_name, birth_date, gender, team_name, ... } }
```

Endpoint **non autenticato** che, dati codice fiscale + email, restituisce l'anagrafica completa
dell'atleta. Il codice fiscale italiano è **derivabile** da nome, cognome, data e comune di nascita:
non è un segreto. L'email è quindi l'unico fattore reale.

Il frontend fa la cosa giusta — il catch è deliberatamente indistinguibile fra CF sconosciuto ed email
sbagliata, quindi non c'è oracolo *nel client*. Ma la protezione è tutta lato API:

**Da verificare sull'API Laravel:**
- il 400/404 è **identico** nei due casi (CF assente vs email non corrispondente)? Altrimenti l'endpoint
  è un oracolo di enumerazione email ↔ persona;
- c'è **rate limiting** per IP su `/api/public/**`? Senza, il brute force sull'email di un atleta noto è banale;
- la risposta è **minimizzata**? `birth_date`, `gender` e `team_name` servono solo a precompilare campi
  disabilitati: restituire meno riduce l'impatto di ogni lookup riuscito.

Stessa domanda per gli altri endpoint pubblici (`/tournaments`, `/disciplines`, `/weight_categories`,
`POST /registrations`): tutti raggiungibili senza credenziali e senza throttling visibile dal client.

## 5. Nessuna autorizzazione lato client (tutto-o-niente)

**Severità: MEDIA** · tutta l'area `/admin/**`

Il modello `User` (`app/types/models.ts`) non ha alcun campo `role`/`permission`, e in tutta la app
non esiste un solo controllo di ruolo: `sanctum.globalMiddleware` distingue soltanto fra
**autenticato** e **non autenticato**. Chiunque abbia un token vede — e può azionare — ogni pagina admin,
inclusa la gestione utenti (`/admin/configurations/users`).

**Impatto.** Se l'API prevede ruoli differenziati (es. giudice di gara vs amministratore), la UI
espone comunque tutte le azioni: l'utente meno privilegiato vede pulsanti che generano 403, e — cosa
più rilevante — **la separazione dei privilegi dipende interamente dall'enforcement lato Laravel**.

**Rimedio.** Nell'ordine: (a) confermare che ogni endpoint admin abbia una Policy/Gate lato API
(è lì che il controllo conta); (b) se esistono ruoli, esporli nel payload di `/api/admin/auth/user`,
tiparli in `User` e usarli per nascondere voci di menu e azioni — puro miglioramento di UX e riduzione
della superficie di errore, **mai** come controllo di sicurezza.

## 6. La password dell'env-switcher non è un controllo di accesso

**Severità: MEDIA (informativa)** · `app/components/ApiEnvironmentUnlock.vue:61,91`

```ts
const expectedPassword = String(useRuntimeConfig().public.envSwitcherPassword ?? '')
unlocked.value = state.password === expectedPassword
```

Confronto in chiaro contro un valore `NUXT_PUBLIC_*` **compilato nel payload di `index.html`**: chiunque
apra il sorgente la legge. Ed è comunque aggirabile scrivendo direttamente `matches.api-override` da
console. `CLAUDE.md` lo documenta già onestamente come offuscamento.

Il rilievo non è la password in sé, ma che **il meccanismo che protegge è quello del punto [#2](#2-override-api-in-localstorage-senza-allowlist)**:
finché l'override non è vincolato a un'allowlist, questa "porta" apre su una funzione con impatto reale.
Risolto [#2](#2-override-api-in-localstorage-senza-allowlist), questo punto si declassa a nota di stile.

**Rimedio.** Nessuna modifica al meccanismo; solo igiene: mai riusare una password valida altrove
(oggi transita anche come build-arg CI, vedi [#11](#11-secret-passati-come---build-arg-in-ci)), e non presentarla come controllo d'accesso in
documentazione o formazione.

## 7. Dati personali su pagine pubbliche (non indicizzabili, ma non protette)

**Severità: MEDIA** · `app/pages/public/tournaments/match_records.vue`, `MatchRecordCardReadOnly.vue`

Il tabellone pubblico mostra nome, cognome e società degli atleti a chiunque conosca l'URL, senza
autenticazione. È probabilmente **intenzionale** (è un tabellone di gara), ma va deciso esplicitamente:

- non esiste `robots.txt` né `<meta name="robots" content="noindex">` su `/public/**`: i nomi degli atleti
  — inclusi **minori**, dato che il modello ha `is_adult`/`age` — sono indicizzabili dai motori di ricerca;
- non c'è informativa/base giuridica collegata alla pagina di registrazione, che raccoglie CF, data di
  nascita ed email.

**Rimedio.** Aggiungere `public/robots.txt` con `Disallow: /public/` (e le varianti `/en/public/`), più
`useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })` sulle due pagine pubbliche.
Valutare con chi gestisce il trattamento se il tabellone debba mostrare nomi completi per i minorenni.

## 8. Token di reset password nella query string

**Severità: BASSA** · `app/pages/reset-password.vue:113-114`

```ts
const token = route.query.token as string | undefined
```

Il token finisce nella cronologia del browser e in ogni log/proxy che registri l'URL completo.
È lo schema standard di Laravel e l'esposizione è limitata, ma va compensata lato API:
token **monouso** e con TTL breve (60 min), invalidati al primo uso riuscito.
Nessuna modifica necessaria nel frontend.

## 9. Messaggi d'errore del backend rilanciati verbatim in UI

**Severità: BASSA** · `app/composables/useApi.ts:3-10`, `app/pages/reset-password.vue:146-155`

`getApiErrorMessage()` estrae `error.data.message` e lo mostra in un toast; `extractErrorMessage()`
concatena persino tutti i `data.errors`. Il frontend non aggiunge esposizione propria (nessuno stack
trace, nessun log in console), ma **eredita** qualunque dettaglio l'API decida di includere.

**Rimedio.** Lato API: `APP_DEBUG=false` in produzione e messaggi generici sui 500.
Lato frontend, opzionale: mostrare `t('common.genericError')` per gli status ≥ 500 e riservare il
messaggio del server ai soli 4xx (dove è per definizione destinato all'utente).

## 10. Dipendenze: 1 advisory `low` (solo dev)

**Severità: BASSA** · `pnpm audit --prod`

```
esbuild >=0.27.3 <0.28.1 — arbitrary file read via dev server (Windows)
path: . > @nuxt/ui > @nuxt/fonts > fontless > esbuild   (GHSA-g7r4-m6w7-qqqr)
```

Riguarda il **dev server su Windows**: non tocca il bundle di produzione, e questo team sviluppa su
macOS. Nessun'altra vulnerabilità nota. Si risolve da sé al prossimo bump di `@nuxt/ui`; in alternativa
un `pnpm.overrides` su `esbuild >=0.28.1`.

## 11. Secret passati come `--build-arg` in CI

**Severità: INFO** · `.forgejo/workflows/ghcr-publish.yml`, `docker-publish.yml`

`NUXT_PUBLIC_ENV_SWITCHER_PASSWORD` e `NUXT_PUBLIC_REVERB_APP_KEY` sono `secrets:` Forgejo passati come
`--build-arg`. I build-arg restano nella history dell'immagine — ma qui **solo dello stage `build`**, che
essendo multi-stage non finisce nell'immagine finale pubblicata su GHCR.

Il punto vero è un altro: sono entrambi valori `NUXT_PUBLIC_*`, quindi **compilati in chiaro nel payload
di `index.html`**. Trattarli come segreti in CI dà una falsa sensazione di riservatezza. La app key di
Reverb è per progetto un identificativo pubblico (l'autorizzazione dei canali privati passa dall'API);
la password dell'env-switcher è offuscamento (vedi [#6](#6-la-password-dellenv-switcher-non-è-un-controllo-di-accesso)).

**Rimedio.** Nessuna urgenza. Documentare nei workflow che quei due valori sono pubblici by design,
così nessuno ci ripone fiducia — e non riusarli mai altrove.

---

## Punti da girare al team API

Questo repo non può risolverli, ma sono i controlli su cui poggia la sicurezza dell'intero sistema:

1. **Rate limiting** su `/api/public/**` e su `/api/admin/auth/login` (brute force credenziali).
2. **Risposte uniformi** sul lookup atleti (vedi [#4](#4-lookup-pubblico-degli-atleti-oracolo-su-dati-personali)) e sul forgot-password (nessun oracolo di
   esistenza account).
3. **TTL + revoca** dei token Sanctum; logout che revoca davvero.
4. **Policy/Gate** su ogni endpoint admin (vedi [#5](#5-nessuna-autorizzazione-lato-client-tutto-o-niente)).
5. **CORS allowlist** ristretta ai domini della dashboard e **allowed origins** di Reverb: se sono
   permissivi, l'override del punto [#2](#2-override-api-in-localstorage-senza-allowlist) diventa sfruttabile anche al contrario (un sito terzo che
   parla con l'API).
6. **`APP_DEBUG=false`** in produzione (vedi [#9](#9-messaggi-derrore-del-backend-rilanciati-verbatim-in-ui)).

## Ordine di intervento suggerito

1. **Allowlist sull'override** ([#2](#2-override-api-in-localstorage-senza-allowlist)) — poche righe, chiude l'unico vettore di phishing persistente del client.
2. **Security header + CSP** ([#3](#3-nessun-security-header-nessuna-csp-nel-repo)) — è la mitigazione che rende accettabile [#1](#1-token-bearer-in-un-cookie-leggibile-da-javascript).
3. **`robots.txt` + `noindex`** su `/public/**` ([#7](#7-dati-personali-su-pagine-pubbliche-non-indicizzabili-ma-non-protette)) — due file, tutela dati di minori.
4. **Verifiche lato API** ([#4](#4-lookup-pubblico-degli-atleti-oracolo-su-dati-personali), lista sopra) — richiedono l'altro repo.
5. Il resto è igiene e documentazione.
