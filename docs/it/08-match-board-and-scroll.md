# 08 — Tabellone incontri e auto-scroll (seek)

> Vedi anche: [07 — Il pattern CRUD admin](07-admin-crud-pattern.md), [09 — Tabellone in tempo reale](09-realtime-scoreboard.md)

Il *tabellone incontri* (board) è una vista a griglia degli incontri di un torneo, pensata per essere tenuta aperta durante l'evento. Esiste in due varianti che condividono la stessa idea di **scroll automatico all'incontro attivo** (il "seek"):

- **Admin** — [`app/pages/admin/tournaments/match_records/board.vue`](../../app/pages/admin/tournaments/match_records/board.vue): card cliccabili che aprono il pannello di modifica.
- **Pubblico** — [`app/pages/public/tournaments/match_records.vue`](../../app/pages/public/tournaments/match_records.vue): sola lettura, con aggiornamenti live via WebSocket ([Capitolo 09](09-realtime-scoreboard.md)).

Questo capitolo si concentra sulla versione admin e dedica la seconda metà al meccanismo di seek, che è la parte più sottile del file.

## La pagina board admin a colpo d'occhio

La pagina ([`board.vue`](../../app/pages/admin/tournaments/match_records/board.vue)) ha tre zone:

1. **Barra filtri** (sempre visibile): input di ricerca, un `ApiSelectMenu` per scegliere il torneo, un pulsante per azzerare la selezione e uno di refresh, più un badge con il totale.
2. **Area scrollabile** con quattro stati mutuamente esclusivi:
   - nessun torneo selezionato → invito a sceglierne uno;
   - `status === 'pending'` → griglia di skeleton;
   - lista vuota → stato "nessun risultato";
   - altrimenti → la **griglia di card** (`MatchRecordCardReadOnly`).
3. **Pannello di modifica** (`MatchRecordFormPanel`), aperto al click su una card.

La fetch segue il pattern del [Capitolo 06](06-data-flow-api.md): `useLazyAsyncData` che dipende da `search` e `tournamentId`, e che restituisce `Promise.resolve(null)` finché nessun torneo è selezionato (righe 152-163). Niente torneo, niente chiamata.

```ts
const items = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta?.total ?? 0)
```

Al click su una card si apre il pannello in modalità modifica, posizionato sulla tab "esito":

```ts
// righe 195-199
function openEdit(item: MatchRecord) {
  editingItem.value = item
  initialTab.value = 'outcome'   // si parte dalla tab dell'esito
  panelOpen.value = true
}
```

## Il problema che il seek risolve

Durante un torneo la lista degli incontri può essere lunga decine di righe. Chi guarda il tabellone vuole vedere **subito** l'incontro che si sta svolgendo *adesso*, senza scorrere a mano. Quando la lista viene caricata (o ricaricata), la pagina deve quindi scorrere da sola fino alla card giusta. Questo è il *seek*.

La regola di priorità è:

1. se esiste un incontro **in corso** (`status === 'in_progress'`) → scorri lì;
2. altrimenti, se esiste un incontro **programmato** (`status === 'scheduled'`) → scorri lì;
3. altrimenti → non scorrere.

## Come è implementato il seek

Servono tre ingredienti: i riferimenti agli elementi DOM delle card, un flag per scorrere una sola volta, e un `watch` che fa lo scroll quando i dati arrivano.

### 1. Raccogliere i riferimenti alle card

Nel template, ogni card registra il proprio elemento DOM in un array, usando l'**indice** come chiave (righe 91-99):

```vue
<div
  v-for="(match, index) in items"
  :key="match.id"
  :ref="(el) => { if (el) matchCardEls[index] = el as HTMLElement }"
  class="cursor-pointer"
  @click="openEdit(match)"
>
  <MatchRecordCardReadOnly :match="match" :show-judges-points="false" />
</div>
```

`matchCardEls` è un `ref<HTMLElement[]>([])` (riga 127). La *function ref* `:ref="(el) => …"` è il modo Vue per ottenere il nodo DOM reale di ogni elemento di una lista: l'indice `index` della card nella lista corrisponde all'indice nell'array `matchCardEls`. Questo allineamento indice-a-indice è ciò che permette, più avanti, di passare dall'indice di un incontro al suo elemento sullo schermo.

### 2. Il flag "scorri una sola volta"

```ts
let hasScrolledInitially = false   // riga 128
```

Senza questo flag, **ogni** rilettura dei dati (ricerca, refresh, paginazione) farebbe risaltare la pagina all'incontro attivo, interrompendo l'utente che stava scorrendo a mano. Il flag fa sì che il seek automatico avvenga **una sola volta** per ogni "sessione di visualizzazione" di un torneo.

> Nota: `hasScrolledInitially` è una semplice variabile `let`, **non** un `ref`. Non deve essere reattiva — serve solo come interruttore di controllo, e renderla reattiva innescherebbe ricalcoli inutili.

### 3. Il `watch` che esegue lo scroll

Il cuore del seek (righe 168-181):

```ts
watch(items, async (newItems) => {
  if (!newItems.length || hasScrolledInitially) { return }   // (a)
  await nextTick()                                            // (b)

  const inProgressIdx = newItems.findIndex(m => m.status === 'in_progress')   // (c)
  if (inProgressIdx !== -1 && matchCardEls.value[inProgressIdx]) {
    matchCardEls.value[inProgressIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else {
    const scheduledIdx = newItems.findIndex(m => m.status === 'scheduled')    // (d)
    if (scheduledIdx !== -1 && matchCardEls.value[scheduledIdx]) {
      matchCardEls.value[scheduledIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
  hasScrolledInitially = true                                 // (e)
})
```

Passo per passo:

- **(a) guardia d'uscita** — se la lista è vuota *oppure* abbiamo già scrollato, esci subito. È qui che il flag impedisce ripetizioni.
- **(b) `await nextTick()`** — questo è il dettaglio cruciale. Quando `items` cambia, Vue non ha *ancora* ridisegnato il DOM: le card (e quindi i loro elementi in `matchCardEls`) potrebbero non esistere ancora. `nextTick()` (≈ "aspetta che lo schermo sia stato effettivamente ridipinto") sospende la funzione finché il DOM non riflette i nuovi dati. Solo allora `matchCardEls.value[i]` punta a un elemento reale.
- **(c) cerca l'incontro in corso** — `findIndex` restituisce l'indice del primo incontro `in_progress`, o `-1` se non c'è. Si controlla *sia* `idx !== -1` *sia* che `matchCardEls.value[idx]` esista, perché il DOM potrebbe non essere perfettamente allineato in casi limite.
- **(d) fallback sul programmato** — se non c'è nessun incontro in corso, ripeti la stessa logica con `status === 'scheduled'`.
- **(e) alza il flag** — da ora in poi il seek automatico non scatterà più finché non viene riarmato.

`scrollIntoView({ behavior: 'smooth', block: 'center' })` scorre il contenitore in modo fluido (animato) fino a portare la card al **centro** verticale dello schermo.

### Riarmare il seek

Il flag deve tornare `false` in due situazioni, così il prossimo caricamento riposiziona di nuovo la vista:

**Quando si cambia torneo** (righe 143-150):

```ts
watch(tournamentId, (val) => {
  if (!val) { searchInput.value = ''; search.value = '' }
  hasScrolledInitially = false   // riarma il seek
  matchCardEls.value = []         // svuota i vecchi riferimenti DOM
})
```

**Quando si preme refresh** (righe 183-187):

```ts
function refreshBoard() {
  hasScrolledInitially = false   // riarma il seek
  matchCardEls.value = []
  refresh()                       // rilegge la lista → il watch scatta di nuovo
}
```

In entrambi i casi si azzera anche `matchCardEls`: i vecchi nodi DOM appartengono alla lista precedente e vanno scartati prima che `:ref` ripopoli l'array con le nuove card.

## La variante pubblica: seek a ogni aggiornamento

La pagina pubblica [`public/tournaments/match_records.vue`](../../app/pages/public/tournaments/match_records.vue) usa lo **stesso** algoritmo di priorità (in corso → programmato), ma con una differenza deliberata: **non** ha il flag `hasScrolledInitially`. Il suo `watch(matchesData)` (righe 242-253) riposiziona la vista **a ogni** arrivo di dati, comprese le push WebSocket:

```ts
// Mantiene l'incontro attivo (o il prossimo) centrato a ogni refresh, incluse le push WS.
watch(matchesData, async () => {
  await nextTick()
  const inProgressIdx = matches.value.findIndex(m => m.status === 'in_progress')
  if (inProgressIdx !== -1 && matchCardEls.value[inProgressIdx]) {
    matchCardEls.value[inProgressIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else { /* …fallback su 'scheduled'… */ }
})
```

La logica è coerente con l'uso: il tabellone pubblico è una vista "kiosk" che deve **inseguire** continuamente l'incontro attivo man mano che il backend notifica i cambiamenti; quello admin riposiziona una volta sola per non disturbare chi sta lavorando sulla lista. Il pezzo WebSocket che innesca questi aggiornamenti è descritto nel [Capitolo 09](09-realtime-scoreboard.md).
