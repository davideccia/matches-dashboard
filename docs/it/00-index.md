# matches-dashboard — Documentazione tecnica

Questa documentazione spiega il codice di **matches-dashboard** a uno sviluppatore competente che però potrebbe essere **nuovo a Nuxt/Vue** e al **dominio dei tornei di sport da combattimento amatoriali**. Alla prima comparsa, ogni termine specifico di un linguaggio o framework riceve una breve spiegazione tra parentesi nella forma `(≈ analogia in parole semplici)`; tutti questi termini sono raccolti nel [Glossario](12-glossary.md).

## Cos'è questo progetto, in una riga

Una **dashboard web** (interfaccia utente che gira nel browser) per organizzare tornei di sport da combattimento amatoriali: un'area amministrativa per gli organizzatori (atleti, tornei, iscrizioni, punteggi degli incontri) e alcune pagine pubbliche per l'iscrizione degli atleti e per il pubblico che segue un tabellone live.

È un **client leggero**: tutta la persistenza dei dati, le regole di business e l'autenticazione vivono in un'**API Laravel** (un framework web in PHP) separata. Questo repository contiene *solo* l'interfaccia utente — disegna le schermate, valida l'input e parla HTTP + WebSocket con il backend.

## Come leggere questa documentazione

Parti da qui, poi prosegui in ordine. Ogni capitolo è autonomo ma poggia sui precedenti.

| #  | Capitolo | Cosa imparerai |
|----|----------|----------------|
| 00 | [Indice](00-index.md) | Questo file |
| 01 | [Panoramica](01-overview.md) | Cosa fa l'app, chi la usa, la divisione client/backend, il dominio in parole semplici |
| 02 | [Stack tecnologico e concetti](02-tech-stack-concepts.md) | Nuxt, Vue, SPA, `ssr: false` e le librerie chiave — ognuna spiegata da zero |
| 03 | [Struttura del progetto](03-project-structure.md) | Visita guidata di `app/` e funzionamento del routing basato sui file |
| 04 | [Build, avvio e configurazione](04-build-run-configure.md) | Comandi, variabili d'ambiente, configurazione a build-time, Docker/nginx |
| 05 | [Autenticazione](05-authentication.md) | Login con token Sanctum, rotte admin vs pubbliche, redirect della root |
| 06 | [Flusso dati e livello API](06-data-flow-api.md) | Come si muovono i dati: `useApi`, risposte paginate, `useLazyAsyncData`, download |
| 07 | [Il pattern CRUD admin](07-admin-crud-pattern.md) | La ricetta `DataTable` + pannello form + `ApiSelectMenu` di ogni pagina admin |
| 08 | [Tabellone incontri e auto-scroll](08-match-board-and-scroll.md) | La griglia degli incontri e il meccanismo di **scroll automatico (seek)** all'incontro attivo |
| 09 | [Tabellone in tempo reale](09-realtime-scoreboard.md) | Echo + Reverb e il pattern *notifica-poi-rilettura* |
| 10 | [Modello di dominio](10-domain-model.md) | Tornei, atleti, iscrizioni, incontri e gli enum che li legano |
| 11 | [i18n e temi](11-i18n-theming.md) | Lingue italiano/inglese, colore del tema a runtime, modalità chiara/scura |
| 12 | [Glossario](12-glossary.md) | Tutti i termini spiegati, in ordine alfabetico |

## Convenzioni di notazione

- `Codice` → identificatori, nomi di file, comandi.
- *corsivo* → concetti di dominio.
- → / ⇆ → direzione del flusso dati (unidirezionale / bidirezionale).
- Gloss in linea alla prima comparsa di un termine: `termine (≈ analogia in parole semplici)`.
- Tutti i percorsi sono **relativi alla radice del repository**.

## Riferimenti già presenti nel repository

Questa documentazione rimanda — invece di duplicarli — ai file già presenti alla radice:

- [`CLAUDE.md`](../../CLAUDE.md) — note di architettura e comandi sintetici.
- [`README.md`](../../README.md) — panoramica, comandi, rotte e deployment. È allineato al backend Laravel attuale.
- [`DB.md`](../../DB.md) — schema del database del backend in DBML. Il frontend rispecchia queste forme; vedi il [Capitolo 10](10-domain-model.md).
