# matches-dashboard — Documentazione Tecnica

Frontend per una piattaforma di gestione di tornei di pugilato amatoriale. Una SPA Nuxt 4 leggera che si occupa solo di renderizzare l'interfaccia, validare l'input e dialogare via HTTP + WebSocket con un'API Spring Boot separata.

Questa documentazione è scritta per uno sviluppatore che ha dimestichezza con la programmazione web in generale ma non conosce Vue, Nuxt e l'ecosistema TypeScript. I termini specifici del framework sono spiegati al primo utilizzo e raccolti nel [Glossario](11-glossary.md).

## Indice

| #  | Capitolo                                                 | Contenuti                                                            |
|----|----------------------------------------------------------|----------------------------------------------------------------------|
| 00 | [Indice](00-index.md)                                    | Questo file                                                          |
| 01 | [Panoramica](01-overview.md)                             | Cosa fa il progetto, chi serve, architettura ad alto livello         |
| 02 | [Struttura dei Moduli](02-module-structure.md)           | Layout delle cartelle in `app/` e ruolo di ogni componente           |
| 03 | [Build, Run, Test](03-build-run-test.md)                 | Sviluppo locale, build di produzione, lint, type-check, Docker       |
| 04 | [UI e Navigazione](04-ui-navigation.md)                  | Routing basato sui file, layout, middleware, URL i18n                |
| 05 | [Flusso dei Dati](05-data-flow.md)                       | Come una pagina ottiene i dati: composable, stato reattivo, refresh  |
| 06 | [Integrazioni Esterne](06-external-integrations.md)      | REST tramite `useApi`, JWT, scoreboard STOMP/WebSocket               |
| 07 | [Modelli di Dominio](07-domain-models.md)                | Enum, schemi Zod, envelope `Page<T>` di Spring                       |
| 08 | [Configurazione e Env](08-configuration-env.md)          | `nuxt.config.ts`, runtime config, preferenze in `localStorage`       |
| 09 | [Dipendenze](09-dependencies.md)                         | Ogni dipendenza in `package.json` e a cosa serve                     |
| 10 | [Pattern Ricorrenti](10-notable-patterns.md)             | Ricetta DataTable + FormPanel, plugin di auth, notify-then-refetch   |
| 11 | [Glossario](11-glossary.md)                              | Termini Vue/Nuxt/TS spiegati in modo semplice                        |

### Capitoli volutamente omessi

- **Ciclo di vita della richiesta** — non c'è SSR (`ssr: false`); l'unico flusso di richiesta è browser → REST/WS, già descritto in [05](05-data-flow.md) e [06](06-external-integrations.md).
- **Controller / view-model** — Vue non ha uno strato controller; l'equivalente (Composition API + composable) è in [05](05-data-flow.md) e [10](10-notable-patterns.md).
- **Persistenza / repository** — non esiste un database lato client; gli unici dati persistiti sono il JWT e qualche preferenza UI in `localStorage`, descritti in [08](08-configuration-env.md).

## Come leggere questa documentazione

- I capitoli possono essere letti in ordine; ognuno contiene riferimenti incrociati.
- Tutti i path sono relativi alla radice del repository.
- I termini specifici dei linguaggi/framework sono spiegati al primo utilizzo e raccolti nel Glossario.

## Convenzioni di notazione

- `Codice` → identificatori, nomi di file, comandi.
- *corsivo* → concetti di dominio.
- → / ⇆ → direzione del flusso dei dati (unidirezionale / bidirezionale).
