# 01 — Panoramica

## Il prodotto

**matches-dashboard** è il pannello di controllo basato su browser e il sito pubblico di una piattaforma per tornei di pugilato amatoriale (e sport da combattimento affini). Serve due tipi di visitatore completamente diversi da un'unica base di codice:

- **Amministratori** — le persone che gestiscono gli eventi. Effettuano l'accesso e gestiscono i dati sottostanti: atleti, tornei, discipline, categorie di peso, iscrizioni e il punteggio in tempo reale degli incontri (≈ i singoli match).
- **Il pubblico** — atleti che si iscrivono a un evento tramite un form e spettatori che guardano un tabellone live che si aggiorna da solo. Questi visitatori non effettuano mai l'accesso.

## La divisione client / backend

È il fatto architetturale più importante, e plasma tutto il resto.

```
   Browser                          Lato server (repo separato)
 ┌─────────────────────┐           ┌──────────────────────────┐
 │  matches-dashboard  │  HTTPS    │   API Laravel            │
 │  (questo repo)      │ ────────► │   - auth (Sanctum)       │
 │  SPA Nuxt 4         │           │   - regole di business   │
 │  - rende la UI      │ ◄──────── │   - database             │
 │  - valida l'input   │   JSON    │                          │
 │  - parla HTTP + WS  │           │   Reverb (WebSocket)     │
 └─────────────────────┘  WebSocket└──────────────────────────┘
            ▲                                   │
            └──────── push in tempo reale ──────┘
```

Questo repository è un **client leggero** (≈ un telecomando: tanti pulsanti e schermate, ma la macchina vera è altrove). Contiene:

- l'interfaccia visiva (pagine, form, tabelle, il tabellone),
- la validazione dell'input (così i dati palesemente errati vengono intercettati prima dell'invio),
- il codice che effettua le richieste HTTP e apre un WebSocket.

Non contiene **nulla** di: database, autorità su chi può fare cosa, o regole sull'avanzamento di un torneo. Tutto ciò vive nel backend **Laravel**, un progetto separato non incluso qui.

Conseguenza pratica: non puoi eseguire quest'app in modo significativo da sola. Si aspetta un'API Laravel raggiungibile a un URL configurato (default `http://localhost:8081`). Vedi il [Capitolo 04](04-build-run-configure.md).

## Due tipi di utente, due spazi di rotte

Nuxt costruisce le pagine a partire dai file (spiegato nel [Capitolo 03](03-project-structure.md)). Le pagine sono divise in due gruppi per URL:

| Spazio | Prefisso URL | Autenticato? | Scopo |
|--------|--------------|--------------|-------|
| **Admin** | `/admin/**`, `/login` | Sì (token Sanctum) | Gestione completa dei tornei |
| **Pubblico** | `/public/**` | No | Iscrizione atleti + tabellone live |

L'URL radice `/` è una pagina di solo reindirizzamento: manda subito il browser a `/admin` (e se non sei autenticato, il livello di autenticazione ti rimbalza su `/login`). Vedi [`app/pages/index.vue`](../../app/pages/index.vue) e il [Capitolo 05](05-authentication.md).

## Il dominio in parole semplici

Non serve conoscere il pugilato per lavorare su questo codice, ma questi termini compaiono ovunque. I dettagli completi (campi, relazioni, valori ammessi) sono nel [Capitolo 09](09-domain-model.md).

- **Torneo (Tournament)** — un evento programmato in una città in una data. Attraversa una sequenza fissa di stati: `scheduled → registrations_opened → registrations_closed → in_progress → completed` (oppure `cancelled`).
- **Atleta (Athlete)** — una persona che gareggia, identificata univocamente dal codice fiscale italiano.
- **Iscrizione (Registration)** — l'iscrizione di un atleta a un torneo, per una data disciplina e categoria di peso. Gli admin tracciano se l'atleta ha pagato, è arrivato, e il suo valore di pesata.
- **Incontro (Match record)** — un match: un atleta dell'angolo rosso contro uno dell'angolo blu, con round, punti dei giudici, un metodo di conclusione (come è finito — KO, decisione, pari…) e un vincitore.
- **Disciplina (Discipline)** — uno stile di combattimento (es. *light contact*, *full contact*).
- **Categoria di peso (Weight category)** — una fascia di peso (un'etichetta più un valore numerico, es. "60 kg").

## Cosa può fare ogni tipo di utente (mappa delle funzionalità)

**Admin** (dopo il login):

- Home della dashboard in `/admin`.
- Sezioni di configurazione sotto `/admin/configurations/`: atleti, discipline, categorie di peso, utenti.
- Gestione tornei sotto `/admin/tournaments/`: elenco tornei, revisione iscrizioni, elenco incontri e un "tabellone" a schermo intero.
- Impostazioni (`/admin/settings`): colore del tema e lingua.

**Pubblico** (senza login):

- Una pagina di iscrizione in `/public/athletes/registration`.
- Un tabellone live in `/public/tournaments/match_records` che si aggiorna in tempo reale mentre un admin assegna i punteggi altrove.

Il prossimo capitolo introduce le tecnologie che rendono possibile tutto questo.
