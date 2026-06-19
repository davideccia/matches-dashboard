# 06 — Flusso dati e livello API

> Vedi anche: [05 — Autenticazione](05-authentication.md), [07 — Il pattern CRUD admin](07-admin-crud-pattern.md), [10 — Modello di dominio](10-domain-model.md)

Questo capitolo segue il percorso dei dati: come il frontend chiede dati all'API, in che forma li riceve, come valida ciò che invia.

## `useApi`: l'unico punto di contatto con l'API

Tutte le pagine admin passano per [`app/composables/useApi.ts`](../../app/composables/useApi.ts). È un sottile wrapper attorno a `useSanctumClient()` (il client HTTP che allega automaticamente il token, vedi [Capitolo 05](05-authentication.md)) che aggiunge l'header `Accept-Language` con la lingua corrente:

```ts
export function useApi() {
  const client = useSanctumClient()
  const { $i18n } = useNuxtApp()
  const lang = () => ({ 'Accept-Language': $i18n.locale.value })

  const get  = <T>(path, params?)        => client<T>(path, { method: 'GET', params, headers: lang() })
  const post = <T>(path, body?, params?) => client<T>(path, { method: 'POST', body, params, headers: lang() })
  const put  = <T>(path, body?, params?) => client<T>(path, { method: 'PUT', body, params, headers: lang() })
  const del  = <T>(path, params?)        => client<T>(path, { method: 'DELETE', params, headers: lang() })
  // upload(formData), download(...) — vedi sotto
  return { get, post, put, del, download, upload }
}
```

Tutti i metodi sono *generici* (`<T>`): chi chiama specifica il tipo della risposta attesa, così TypeScript conosce la forma di ciò che torna.

### `Accept-Language`

Allegando `Accept-Language` a ogni richiesta, il frontend lascia che sia il backend a localizzare i messaggi (es. errori di validazione). La lingua segue la scelta dell'utente nell'interfaccia ([Capitolo 11](11-i18n-theming.md)).

### `upload` e `download`

- `upload(path, formData)` → invia un `FormData` (per file/allegati) come POST.
- `download(path, filename)` → caso speciale: non passa per il client Sanctum ma usa `$fetch` con `responseType: 'blob'`, leggendo manualmente il token dal cookie `sanctum.token.cookie` e allegandolo come `Authorization: Bearer …`. Crea poi un link temporaneo (`URL.createObjectURL`) e lo "clicca" per scaricare il file. Serve per i PDF (es. tabelloni dei tornei).

### Estrarre il messaggio d'errore

Stesso file, funzione esportata `getApiErrorMessage(e)`: estrae in modo difensivo `e.data.message` dalla risposta d'errore dell'API. Si trova ovunque nei blocchi `catch`:

```ts
catch (e) {
  toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
}
```

## La forma delle risposte: paginazione Laravel

L'API Laravel restituisce le liste in un involucro standard `{ data, meta }` (a volte con `links`). Il tipo completo è in [`app/types/models.ts`](../../app/types/models.ts) (`PaginatedResponse<T>`, righe 152-170), ma la forma minima usata ovunque è:

```ts
interface Paginated<T> {
  data: T[]
  meta: { total: number, current_page: number, last_page: number, per_page: number }
}
```

Da qui il pattern ricorrente per estrarre i pezzi:

```ts
const items = computed(() => data.value?.data ?? [])   // le righe
const total = computed(() => data.value?.meta?.total ?? 0)  // conteggio per la paginazione
```

## Fetch dichiarativa con `useLazyAsyncData`

Nelle pagine e nei componenti che leggono liste, le chiamate non sono imperative ma **dichiarative** via `useLazyAsyncData` di Nuxt. Gli si dà una chiave univoca, una funzione che produce la Promise, e una lista di sorgenti reattive da osservare; rilegge automaticamente quando una di esse cambia:

```ts
const { data, refresh, status } = useLazyAsyncData(
  'matches-board',
  () => {
    if (!tournamentId.value) { return Promise.resolve(null) }   // niente torneo → niente fetch
    return api.get<Paginated<MatchRecord>>('/api/admin/match_records?with=…', {
      page: 1,
      ...(search.value ? { search: search.value } : {}),
      tournament_id: tournamentId.value,
    })
  },
  { watch: [search, tournamentId] },   // rilegge quando cambia ricerca o torneo
)
```

(Esempio reale: [`board.vue`](../../app/pages/admin/tournaments/match_records/board.vue) righe 152-163.)

- `status` vale `'idle' | 'pending' | 'success' | 'error'` ed è usato per mostrare skeleton/spinner.
- `refresh()` riesegue la fetch su richiesta (es. dopo un salvataggio, o premendo il pulsante di refresh).
- Restituire `Promise.resolve(null)` è il modo per *non* chiamare l'API quando mancano i prerequisiti (nessun torneo selezionato).

### Il parametro `with=`

Nelle URL vedrai spesso `?with=tournament,red_corner,blue_corner,winner,…`. È una convenzione del backend Laravel per chiedere di **includere le relazioni** nella risposta (*eager loading*), evitando richieste multiple. Le relazioni così caricate compaiono come campi opzionali sui modelli (vedi [Capitolo 10](10-domain-model.md)).

## Scrittura e validazione con Zod

Le scritture (create/update) passano per i pannelli-form. Prima di chiamare `post`/`put`, l'input è validato con uno *schema* Zod. Esempio da [`AthleteFormPanel.vue`](../../app/components/panels/AthleteFormPanel.vue) (righe 121-130):

```ts
const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().min(1),
  gender: z.enum(GENDERS),
  tax_number: z.string().min(1),
  team_name: z.string().optional(),
  default_weight_category_id: z.string().nullish(),
  default_discipline_id: z.string().nullish(),
})
```

Il componente `<UForm :schema="schema" :state="state">` di @nuxt/ui collega lo schema allo stato del form e mostra gli errori per campo automaticamente. La validazione lato client è una comodità, **non** la fonte di verità: il backend ri-valida sempre, e i suoi messaggi (localizzati grazie ad `Accept-Language`) tornano via `getApiErrorMessage`.

## Il quadro completo

```
Utente digita → state reattivo → (submit) → validazione Zod
   → useApi.post/put → useSanctumClient (allega token + Accept-Language)
   → API Laravel → risposta { data } → toast di successo → emit('saved')
   → la pagina chiama dataTable.refresh() → useLazyAsyncData rilegge la lista
```

Questo ciclo è il cuore del pattern CRUD del [Capitolo 07](07-admin-crud-pattern.md).
