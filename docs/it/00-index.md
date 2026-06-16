# matches-dashboard — Documentazione per sviluppatori

Benvenuto. Questa documentazione spiega il codice di **matches-dashboard** a uno sviluppatore che programma con disinvoltura ma potrebbe essere **nuovo a Nuxt/Vue** e **nuovo al dominio dei tornei di pugilato amatoriale**. I termini specifici di linguaggio o framework ricevono una breve spiegazione tra parentesi `(≈ analogia in parole semplici)` alla prima comparsa, e ogni termine spiegato è raccolto nel [Glossario](11-glossary.md).

## Cos'è questo progetto, in una riga

Una **dashboard web** (l'interfaccia utente lato browser) per gestire tornei di pugilato amatoriale: un'area admin per gli organizzatori che gestiscono atleti, tornei e punteggi degli incontri in tempo reale, più pagine pubbliche per l'iscrizione degli atleti e per il pubblico che segue un tabellone live.

È un **client leggero** (≈ una sala di accoglienza che non conserva dati propri): tutti i dati reali e le regole vivono in un backend **Laravel** (un framework web PHP) separato. Questo repository è *solo* l'interfaccia utente.

> [!IMPORTANT]
> Il `README.md` alla radice descrive un backend Spring Boot con STOMP/JWT. Quella descrizione è **obsoleta**. Il codice di questo repository punta a un backend **Laravel**, si autentica con token **Laravel Sanctum** e riceve aggiornamenti in tempo reale tramite **Laravel Reverb** (un server WebSocket compatibile con il protocollo Echo/Pusher). Questa documentazione riflette il *codice così com'è realmente*. Vedi il [Capitolo 05](05-authentication.md) e il [Capitolo 08](08-realtime-scoreboard.md).

## Come leggerla

Parti da qui, poi leggi in ordine. Ogni capitolo è autonomo ma poggia sui precedenti.

| # | Capitolo | Cosa imparerai |
|---|----------|----------------|
| 01 | [Panoramica](01-overview.md) | Cosa fa l'app, chi la usa, la divisione client/backend, il dominio in parole semplici |
| 02 | [Stack tecnologico e concetti](02-tech-stack-concepts.md) | Nuxt, Vue, SPA e le librerie chiave — ognuna spiegata per chi è alle prime armi |
| 03 | [Struttura del progetto](03-project-structure.md) | Visita guidata della cartella `app/` e funzionamento del routing basato sui file |
| 04 | [Build, avvio e configurazione](04-build-run-configure.md) | Comandi, variabili d'ambiente, configurazione in fase di build, Docker/nginx |
| 05 | [Autenticazione](05-authentication.md) | Login con token Sanctum, rotte admin vs pubbliche, come viene regolato l'accesso |
| 06 | [Il pattern CRUD admin](06-admin-crud-pattern.md) | La ricetta DataTable + pannello form + menu di selezione seguita da ogni pagina admin |
| 07 | [Flusso dati e livello API](07-data-flow-api.md) | Come si muovono i dati: `useApi`, risposte paginate, form validati con Zod |
| 08 | [Tabellone in tempo reale](08-realtime-scoreboard.md) | Il tabellone live: Echo + Reverb, il pattern notifica-poi-rilettura |
| 09 | [Modello di dominio](09-domain-model.md) | Tornei, atleti, iscrizioni, incontri e gli enum che li legano insieme |
| 10 | [i18n e temi](10-i18n-theming.md) | Lingue italiano/inglese, colore del tema a runtime, modalità chiara/scura |
| 11 | [Glossario](11-glossary.md) | Tutti i termini spiegati, in ordine alfabetico |

## Riferimenti già presenti nel repository

Questa documentazione rimanda — invece di duplicarli — ai file già presenti alla radice del repository:

- [`CLAUDE.md`](../../CLAUDE.md) — note di architettura e comandi sintetici (il riepilogo di alto livello più accurato).
- [`DB.md`](../../DB.md) — lo schema del database del backend in DBML. Il frontend rispecchia queste forme; vedi il [Capitolo 09](09-domain-model.md).
- [`README.md`](../../README.md) — utile per comandi e rotte, ma le sue sezioni su *backend/tempo reale/autenticazione* sono obsolete (vedi la nota sopra).
