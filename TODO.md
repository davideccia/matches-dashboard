# TODO — privacy / GDPR (frontend)

Aperto il 2026-09-12 durante la revisione di `public/privacy.txt` contro il
codice del dashboard e dell'API (`../matches-api`).

`public/privacy.txt` è già stato riallineato al comportamento attuale del
codice. Qui restano i punti che riguardano **questo repository**: decisioni
del Titolare che condizionano il testo dell'informativa, e modifiche di
codice lato frontend. I cambiamenti di codice che riguardano esclusivamente
il backend sono stati spostati in `../matches-api/TODO.md`.

---

## 1. Decisioni del Titolare (bloccano parti dell'informativa) — RISOLTO 2026-09-12

### 1.1 Region di hosting e backup — punto 10 dell'informativa — CONFERMATO

Il Titolare conferma: tutte le risorse di produzione (host del bundle
statico, host API + database, bucket di backup, provider SMTP) risiedono nel
SEE. Il punto 10 dell'informativa resta invariato (già formulato in modo
condizionale — si applica solo "qualora un fornitore comporti un
trasferimento").

Il fix del default fuorviante (`AWS_DEFAULT_REGION=us-east-1` in
`.env`/`.env.example` di `matches-api`) è un cambiamento di codice che
riguarda solo il backend: tracciato in `../matches-api/TODO.md` §1.

### 1.2 Periodi di conservazione — punto 11 dell'informativa — CONFERMATO

Decisione del Titolare:

| Dato                                  | Termine confermato                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Dati atleta e iscrizioni              | durata del rapporto + 5 anni dall'ultima partecipazione                                             |
| Dati sportivi (incontri, esiti)       | durata del rapporto + 5 anni dall'ultima partecipazione (allineato al dato atleta, non più 10 anni) |
| Documentazione contabile/assicurativa | **rimossa dal punto 11** — il software non la gestisce/conserva                                     |
| Account staff                         | incarico + 12 mesi                                                                                  |
| Log applicativi                       | 12 mesi                                                                                             |

`public/privacy.txt` punto 11 è stato aggiornato di conseguenza (righe
atleta e dati sportivi unificate sullo stesso termine; riga contabile/
assicurativa rimossa). La tensione originariamente segnalata (10 anni di
storico agonistico vs pseudonimizzazione a 5 anni) è superata: essendo ora
5 anni per entrambi, il job di retention (implementazione lato backend, vedi
`../matches-api/TODO.md` §2) non deve gestire una pseudonimizzazione
intermedia per `match_records_history` — la cancellazione/anonimizzazione
scatta insieme ai dati identificativi dell'atleta.

### 1.3 Tabellone pubblico — punto 8 dell'informativa — CONFERMATO: opzione A

Il Titolare conferma l'opzione **A) lasciare così**: il tabellone pubblico
continua a esporre senza autenticazione nome e cognome completi, team,
categoria, esito e punteggi dei giudici, anche per i minori
(`PublicAthleteResource`, `PublicMatchRecordResource`). Nessuna modifica di
codice a queste risorse. `public/privacy.txt` punto 8 resta invariato.

Resta da fare, perché la scelta A lo richiede esplicitamente (vedi 2.4):

- un test di bilanciamento scritto (legittimo interesse vs diritti
  dell'interessato, con attenzione ai minori) da conservare come evidenza di
  accountability;
- una procedura interna per ricevere e gestire le opposizioni alla
  pubblicazione (oggi l'informativa dice "può opporsi scrivendo al Titolare"
  ma non esiste un processo definito a valle).

---

## 2. Modifiche di codice (frontend)

### 2.1 Consenso / presa visione non tracciati — CRITICO per l'accountability — RISOLTO 2026-09-12

`app/pages/public/athletes/registration.vue:836` — `privacyConsent` è un `ref`
locale: abilita il pulsante (righe 540, 551) ma non entra nel payload di
`submit()` (righe 886-902).

Chiuso così:

- **persistenza**: confermato dal Titolare che il backend registra
  `privacy_accepted_at` (timestamp corrente) lato server al momento della
  `POST /api/public/registration_form/registrations` — la checkbox lato
  client resta il gate che abilita il pulsante, il server stampa il momento
  dell'iscrizione. Nessuna modifica necessaria al payload del frontend.
- **i18n allineata**: `register.privacyLabel`/`privacyRequired` aggiornate in
  `it.json` **e** `en.json` da framing di consenso ("Ho letto e accetto la" /
  "I have read and accept the") a framing di presa visione ("Ho letto
  l'informativa sulla" / "I have read the").
- **versionamento**: deciso di non aggiungere un campo versione esplicito nel
  payload — la data "Ultimo aggiornamento" già presente in testa a
  `public/privacy.txt`, incrociata con `privacy_accepted_at` e la cronologia
  git del file, è sufficiente a ricostruire quale versione dell'informativa
  era in vigore al momento dell'iscrizione.

### 2.2 Consenso per la fotografia — RISOLTO 2026-09-12: funzionalità inesistente, non solo non tracciata

Il Titolare conferma che il caricamento di file/fotografia **non è
implementato da nessuna parte nell'applicazione** (nessuna UI, nessun campo
nel modello `Athlete` lato dashboard): il codice in
`AthleteController.php:73-74, 99-100` citato in una revisione precedente di
questo TODO è codice morto, mai raggiunto (nota sulla sua eventuale rimozione
tracciata in `../matches-api/TODO.md` §8).

Di conseguenza non serve un `photo_consent_at`: si tratterebbe di tracciare il
consenso per un trattamento che non avviene. `public/privacy.txt` è stato
aggiornato per rimuovere ogni riferimento alla fotografia dell'atleta (§3.1
categorie di dati, §5 base giuridica, §8 dati non pubblicati, §11
conservazione, §16 natura del conferimento) — l'informativa ora descrive solo
trattamenti realmente effettuati. Se in futuro si vorrà reintrodurre l'upload
foto, andranno ripristinati sia il codice sia il relativo paragrafo
dell'informativa con consenso tracciato.

### 2.3 Token Sanctum senza scadenza — commento fuorviante — COMPLETATO

`config/sanctum.php` → `'expiration' => null`: i token **non scadono lato
server**. Il commento in `app/utils/authToken.ts:6` («Allineato
all'`expiration` dei token Sanctum lato API (1 settimana)») è falso: scade
solo il cookie, il token resta valido per sempre.

Da fare qui (frontend): correggere il commento in `authToken.ts:6` per non
dichiarare un allineamento che non esiste. L'impostazione lato server di
`SANCTUM_EXPIRATION` e lo scheduling di `sanctum:prune-expired` sono cambi di
codice backend, tracciati in `../matches-api/TODO.md` §3. L'informativa oggi
parla solo del cookie (7 giorni) proprio per non dichiarare il falso.

### 2.4 Procedura di esercizio dei diritti

L'informativa promette accesso, cancellazione, portabilità, opposizione e
risposta entro un mese. Serve almeno una procedura scritta interna (non è
codice, riguarda l'organizzazione, non un singolo repository) per gestire
queste richieste, incluse le opposizioni alla pubblicazione del tabellone
(vedi 1.3). I comandi artisan di export/cancellazione che la supportano sono
un cambio di codice backend, tracciato in `../matches-api/TODO.md` §4.

### 2.5 Note libere e dati sanitari

`registrations.notes` e `match_records.notes` sono testo libero compilato
dallo staff: canale aperto verso dati dell'art. 9 (infortuni, idoneità
medica). L'informativa ora dichiara che non devono contenere dati sanitari.
Da rendere effettivo qui (frontend): nota nell'interfaccia (dashboard)
accanto al campo note + istruzione scritta allo staff.

Confermato dal Titolare: questi campi note non arrivano dal backend nella
risposta della sezione pubblica del tabellone, coerentemente con quanto
dichiarato in `privacy.txt` §8 (vedi `../matches-api/TODO.md` §9).

### 2.6 Informativa raggiungibile da un solo punto — RISOLTO 2026-09-12

`public/privacy.txt` era referenziato solo da
`app/pages/public/athletes/registration.vue`. Il modale che lo mostra è stato
estratto in `app/components/PrivacyPolicyModal.vue` (fetch memoizzato di
`/privacy.txt` + `UModal`), dietro un bottone in un nuovo componente
`app/components/AppFooter.vue`.

Il footer è ora raggiungibile da tutte le pagine pubbliche e di
autenticazione:

- `app/pages/index.vue` (landing pubblica) e
  `app/pages/public/tournaments/match_records.vue` (la pagina che _diffonde_ i
  dati) sono state unificate su un nuovo layout condiviso
  `app/layouts/public.vue` (`layout: 'public'` invece di `layout: false`),
  che monta `AppFooter` in fondo. Anche `app/pages/public/athletes/
  registration.vue` è stata portata sullo stesso layout, in aggiunta al suo
  link inline già esistente nel checkbox di consenso.
- `app/pages/login.vue`, per gli utenti staff, eredita il footer tramite
  `app/components/AuthSplitLayout.vue` (shell condivisa anche da
  `forgot-password.vue` e `reset-password.vue`, che quindi lo ottengono a
  cascata).

Nuova chiave i18n `common.privacyPolicy` aggiunta sia in `it.json` che
`en.json` (usata come testo del bottone e come titolo del modale).

### 2.7 Traduzione inglese dell'informativa

L'app è bilingue (`it` default, `/en/`) ma `privacy.txt` esiste solo in
italiano e viene caricato con un path fisso (`$fetch('/privacy.txt')`).
Se si vuole l'inglese: `public/privacy.en.txt` + scelta del file in base a
`locale`.

---

## 3. Sicurezza lato backend

Le voci di sicurezza collegate all'informativa che riguardano esclusivamente
il backend (password in chiaro via email, CORS con wildcard e credenziali,
credenziali di default negli strumenti di amministrazione) sono state
spostate in `../matches-api/TODO.md` (§5-7), perché non richiedono alcuna
modifica in questo repository.

---

## 4. Nota

Questa lista nasce da una verifica tecnica codice-vs-documento, non da una
validazione legale. Il testo finale dell'informativa e le scelte di base
giuridica vanno confermate da chi segue la privacy per l'associazione.
