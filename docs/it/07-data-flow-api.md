# 07 — Flusso dati e livello API

Questo capitolo segue i dati mentre si muovono tra il backend, i composable e i componenti.

## La forma di una richiesta

Tutti i dati admin autenticati passano per un unico helper: [`useApi()`](../../app/composables/useApi.ts). Incapsula `useSanctumClient()` (il client HTTP di `nuxt-auth-sanctum` che già conosce l'URL base dell'API e allega il token di autenticazione) e aggiunge un header `Accept-Language` così che il backend possa localizzare le risposte:

```ts
export function useApi() {
  const client = useSanctumClient()
  const { $i18n } = useNuxtApp()
  const lang = () => ({ 'Accept-Language': $i18n.locale.value })

  const get  = <T>(path, params?)        => client<T>(path, { method: 'GET',  params, headers: lang() })
  const post = <T>(path, body?, params?) => client<T>(path, { method: 'POST', body, params, headers: lang() })
  const put  = <T>(path, body?, params?) => client<T>(path, { method: 'PUT',  body, params, headers: lang() })
  const del  = <T>(path, params?)        => client<T>(path, { method: 'DELETE', params, headers: lang() })
  const download = async (path, filename) => { /* download blob con token Bearer */ }

  return { get, post, put, del, download }
}
```

Quindi `api.get<Athlete>('/api/admin/athletes/123')` è una GET tipizzata con token e lingua allegati. Il generico `<T>` è il tipo di risposta atteso.

### `download` — l'unico caso speciale

I download di file non possono passare per il normale client JSON, quindi `download()` usa `$fetch` grezzo con `responseType: 'blob'`, leggendo manualmente il cookie `sanctum.token.cookie` e aggiungendo da sé l'header `Authorization: Bearer …`, poi avvia un download del browser tramite un elemento `<a>` temporaneo. Usalo per i PDF e simili.

### Gestione degli errori: `getApiErrorMessage`

Anch'esso esportato da `useApi.ts`, questo helper estrae in modo sicuro il `message` leggibile del backend da un oggetto errore lanciato:

```ts
catch (e) {
  toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
}
```

È il pattern standard di gestione errori in tutta l'app: tenta la richiesta, in caso di errore mostra un toast con il messaggio del backend (o un fallback generico).

## La forma di una risposta: la paginazione Laravel

Gli endpoint di elenco di Laravel restituiscono un involucro standard. Il tipo TypeScript è `PaginatedResponse<T>` in [`app/types/models.ts`](../../app/types/models.ts):

```ts
interface PaginatedResponse<T> {
  data: T[]
  links: { first; last; prev; next }
  meta: {
    current_page; from; last_page; per_page; to; total; path
    links: Array<{ url; label; active }>
  }
}
```

I due campi che la UI legge più spesso sono `data` (le righe) e `meta.total` (per la paginazione). Il componente `DataTable` (vedi il [Capitolo 06](06-admin-crud-pattern.md)) consuma esattamente questa forma e rinvia indietro `page` / `per_page` / `search` / `paginate: 1` come parametri di query.

> [!NOTE]
> Gli endpoint supportano un flag `paginate`: `paginate: 1` restituisce l'involucro paginato; `paginate: 0` restituisce un elenco piatto (usato da `ApiSelectMenu` quando `:paginated="false"`). Alcuni endpoint accettano anche un parametro `with=relazione1,relazione2` per caricare in anticipo i record correlati (es. il tabellone pubblico richiede `?with=red_corner,blue_corner,...`).

## Come si innesca il recupero: `useLazyAsyncData`

I componenti recuperano i dati tramite `useLazyAsyncData(chiave, fetcher, opzioni)` di Nuxt (≈ "esegui questo fetcher asincrono, dammi `data`/`status`/`refresh` reattivi, e non bloccare la navigazione durante il caricamento"). La `DataTable` lo usa con una chiave per istanza e riesegue `refresh()` ogni volta che cambiano pagina, dimensione pagina, ricerca o `params`:

```ts
const { data, refresh, status } = useLazyAsyncData(
  `data-table-${instanceId}`,
  () => api.get(props.url, { page: page.value, per_page: selectedPageSize.value,
                            search: search.value || undefined, paginate: 1, ...props.params }),
)
watch(page, () => refresh())
watch(searchInput, /* con debounce */ () => { search.value = …; refresh() })
```

Il tabellone pubblico usa la stessa primitiva `useLazyAsyncData` ma con `$fetch` non autenticato (nessun token) — vedi il [Capitolo 08](08-realtime-scoreboard.md).

## Validazione in uscita: Zod

Prima dell'invio, i form validano i dati con **Zod** (≈ dichiari la forma richiesta del dato; rifiuti tutto ciò che non corrisponde). A una `UForm` si passano uno `schema` Zod e uno `state` reattivo; blocca l'invio finché lo stato non valida, e mostra automaticamente gli errori per campo.

```ts
const schema = z.object({
  first_name: z.string().min(1),
  gender: z.enum(GENDERS),
  team_name: z.string().optional(),
  default_discipline_id: z.string().nullish(),
})
```

`z.enum(GENDERS)` riusa l'enum di dominio da `constants.ts`, così i valori ammessi dal form e il resto dell'app restano allineati ([Capitolo 09](09-domain-model.md)). All'invio, il pannello mappa i dati validati `event.data` nel corpo della richiesta (trasformando le stringhe vuote in `null` dove il backend lo richiede) e chiama `api.post`/`api.put`.

## Da capo a fondo: una tipica scrittura admin

```
L'utente modifica il form
   │  UForm valida contro lo schema Zod  ── fallisce ──► errori inline per campo
   ▼ passa
onSubmit costruisce il body
   ▼
api.put('/api/admin/athletes/123', body)   ← token + Accept-Language allegati da useApi
   │
   ├─ successo ─► chiude il pannello, emette 'saved', toast di successo
   │                 └─► il genitore chiama tableRef.refresh()  ─► DataTable ri-recupera l'elenco
   └─ errore ──► toast di errore con getApiErrorMessage(e)
```

## Helper di conversione date

Il backend parla in stringhe data ISO; gli input HTML e le visualizzazioni localizzate hanno bisogno di altri formati. [`app/utils/date.ts`](../../app/utils/date.ts) (costruito su `moment`) fa da ponte:

- `serverDateToInput(iso)` → `YYYY-MM-DDTHH:mm:ss` per `<input type="datetime-local">`.
- `inputDateToServer(value)` → stringa ISO da rinviare.
- `formatServerDate(iso, locale)` / `formatServerDateOnly(iso, locale)` → visualizzazione localizzata (italiano `DD/MM/YYYY`, inglese `YYYY-MM-DD`), **senza conversione di fuso orario** — i valori sono mostrati esattamente come memorizzati.
