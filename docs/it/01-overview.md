# 01 — Panoramica

> Vedi anche: [02 — Stack tecnologico e concetti](02-tech-stack-concepts.md), [05 — Autenticazione](05-authentication.md), [10 — Modello di dominio](10-domain-model.md)

Questo capitolo risponde a tre domande: cosa fa l'applicazione, chi la usa e come si incastra con il resto del sistema.

## Cosa fa l'applicazione

matches-dashboard gestisce **tornei di sport da combattimento amatoriali**. Un organizzatore crea un torneo, apre le iscrizioni, registra gli atleti in una *disciplina* (lo stile di combattimento) e una *categoria di peso*, costruisce la griglia degli incontri e, durante l'evento, aggiorna i punteggi assegnati dai giudici e dichiara il vincitore di ogni incontro. Nel frattempo il pubblico può seguire i risultati su un **tabellone live** che si aggiorna da solo.

## Le due audience

L'app serve due tipi di utenti con due insiemi di rotte (URL) completamente diversi:

| Audience | Prefisso URL | Autenticazione | Scopo |
|----------|--------------|----------------|-------|
| **Admin** | `/admin/**`, `/login` | Token Sanctum (in un cookie) | Gestione completa di tornei e dati |
| **Pubblico** | `/public/**` | Nessuna | Iscrizione atleti e tabellone live |

La root `/` non ha contenuto proprio: reindirizza subito a `/admin` (vedi [`app/pages/index.vue`](../../app/pages/index.vue)). Da lì il middleware di autenticazione decide se mostrare l'area admin o spedire l'utente al `/login`. I dettagli sono nel [Capitolo 05](05-authentication.md).

## La divisione client / backend

```
Browser (SPA Nuxt)  ──REST + token Sanctum──►  API Laravel  ──►  Database
        │                                            ▲
        └──────WebSocket (Echo / Reverb)─────────────┘
```

Il punto chiave da interiorizzare: **questo repository non contiene logica di business né un database**. È un *thin client* (≈ un cliente "magro" che non conserva dati propri). Tutto ciò che è autorevole — utenti, tornei, regole, punteggi — vive nell'API Laravel separata. Questo frontend:

1. Disegna le schermate.
2. Valida l'input dei form prima di inviarlo (con *Zod*, vedi [Capitolo 06](06-data-flow-api.md)).
3. Chiama l'API via HTTP per leggere e scrivere dati.
4. Si mette in ascolto via WebSocket per sapere *quando* rileggere i dati live.

Una conseguenza tecnica importante: l'app gira con `ssr: false` (*Server-Side Rendering* disattivato). Nuxt non produce un server Node, ma un sito **statico** di soli file (HTML/JS/CSS) servito da nginx. Questo ha effetti pratici su build e configurazione spiegati nel [Capitolo 04](04-build-run-configure.md).

## Il dominio in parole semplici

Se non hai familiarità con il mondo dei tornei di combattimento, ecco le entità minime (lo schema completo è nel [Capitolo 10](10-domain-model.md)):

| Entità | In parole semplici |
|--------|--------------------|
| *Torneo* (`Tournament`) | L'evento programmato, con un ciclo di stati: programmato → iscrizioni aperte → iscrizioni chiuse → in corso → concluso (o annullato). |
| *Atleta* (`Athlete`) | Una persona, identificata dal codice fiscale. |
| *Iscrizione* (`Registration`) | L'ingresso di un atleta in un torneo, con disciplina e categoria di peso. |
| *Incontro* (`MatchRecord`) | Un singolo match tra due atleti: angolo rosso vs angolo blu, punteggi dei giudici, metodo di conclusione, vincitore. |
| *Disciplina* (`Discipline`) | Lo stile di combattimento (numero di round, minuti per round). |
| *Categoria di peso* (`WeightCategory`) | Una fascia di peso. |

I termini *angolo rosso* / *angolo blu* (`red_corner` / `blue_corner`) sono la convenzione universale negli sport da ring per indicare i due contendenti.

## Funzionalità principali

- **Pannello admin** — CRUD su atleti, tornei, discipline, categorie di peso e utenti; revisione delle iscrizioni; costruzione della griglia incontri e aggiornamento dei punteggi.
- **Form di iscrizione pubblico** — flusso non autenticato per l'iscrizione degli atleti.
- **Tabellone live** — Echo + Reverb con pattern *notifica-poi-rilettura* ([Capitolo 09](09-realtime-scoreboard.md)).
- **Tabellone incontri (board)** — vista a griglia degli incontri di un torneo con scroll automatico all'incontro attivo ([Capitolo 08](08-match-board-and-scroll.md)).
- **Bilingue** — italiano (default, senza prefisso URL) e inglese sotto `/en/`.
- **Tema a runtime** — l'admin sceglie il colore primario, che persiste in un cookie; più modalità chiara/scura ([Capitolo 11](11-i18n-theming.md)).
