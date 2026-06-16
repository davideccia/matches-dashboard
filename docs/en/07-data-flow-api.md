# 07 — Data Flow & the API Layer

This chapter follows data as it moves between the backend, the composables, and the components.

## The shape of a request

All authenticated admin data goes through one helper: [`useApi()`](../../app/composables/useApi.ts). It wraps `useSanctumClient()` (the HTTP client from `nuxt-auth-sanctum` that already knows the API base URL and attaches the auth token) and adds an `Accept-Language` header so the backend can localise its responses:

```ts
export function useApi() {
  const client = useSanctumClient()
  const { $i18n } = useNuxtApp()
  const lang = () => ({ 'Accept-Language': $i18n.locale.value })

  const get  = <T>(path, params?)       => client<T>(path, { method: 'GET',  params, headers: lang() })
  const post = <T>(path, body?, params?) => client<T>(path, { method: 'POST', body, params, headers: lang() })
  const put  = <T>(path, body?, params?) => client<T>(path, { method: 'PUT',  body, params, headers: lang() })
  const del  = <T>(path, params?)        => client<T>(path, { method: 'DELETE', params, headers: lang() })
  const download = async (path, filename) => { /* blob download with Bearer token */ }

  return { get, post, put, del, download }
}
```

So `api.get<Athlete>('/api/admin/athletes/123')` is a typed GET with the token and language attached. The generic `<T>` is the expected response type.

### `download` — the one special case

File downloads can't go through the normal JSON client, so `download()` uses raw `$fetch` with `responseType: 'blob'`, manually reading the `sanctum.token.cookie` and adding the `Authorization: Bearer …` header itself, then triggers a browser download via a temporary `<a>` element. Use it for PDFs and similar.

### Error handling: `getApiErrorMessage`

Also exported from `useApi.ts`, this helper safely digs the backend's human-readable `message` out of a thrown error object:

```ts
catch (e) {
  toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
}
```

This is the standard error pattern across the app: try the request, on failure show a toast with the backend message (or a generic fallback).

## The shape of a response: Laravel pagination

Laravel's list endpoints return a standard envelope. The TypeScript type is `PaginatedResponse<T>` in [`app/types/models.ts`](../../app/types/models.ts):

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

The two fields the UI reads most are `data` (the rows) and `meta.total` (for pagination). The `DataTable` component (see [Chapter 06](06-admin-crud-pattern.md)) consumes exactly this shape and sends `page` / `per_page` / `search` / `paginate: 1` back as query parameters.

> [!NOTE]
> Endpoints support a `paginate` flag: `paginate: 1` returns the paged envelope; `paginate: 0` returns a flat list (used by `ApiSelectMenu` when `:paginated="false"`). Some endpoints also accept a `with=relation1,relation2` parameter to eager-load related records (e.g. the public scoreboard requests `?with=red_corner,blue_corner,...`).

## How fetching is triggered: `useLazyAsyncData`

Components fetch through Nuxt's `useLazyAsyncData(key, fetcher, options)` (≈ "run this async fetcher, give me reactive `data`/`status`/`refresh`, and don't block navigation while it loads"). The `DataTable` uses it with a per-instance key and re-runs `refresh()` whenever page, page size, search, or `params` change:

```ts
const { data, refresh, status } = useLazyAsyncData(
  `data-table-${instanceId}`,
  () => api.get(props.url, { page: page.value, per_page: selectedPageSize.value,
                            search: search.value || undefined, paginate: 1, ...props.params }),
)
watch(page, () => refresh())
watch(searchInput, /* debounced */ () => { search.value = …; refresh() })
```

The public scoreboard uses the same `useLazyAsyncData` primitive but with the unauthenticated `$fetch` (no token) — see [Chapter 08](08-realtime-scoreboard.md).

## Validation on the way out: Zod

Before data is sent, forms validate it with **Zod** (≈ declare the data's required shape; reject anything that doesn't match). A `UForm` is given a Zod `schema` and a reactive `state`; it blocks submission until the state validates, and shows per-field errors automatically.

```ts
const schema = z.object({
  first_name: z.string().min(1),
  gender: z.enum(GENDERS),
  team_name: z.string().optional(),
  default_discipline_id: z.string().nullish(),
})
```

`z.enum(GENDERS)` reuses the domain enum from `constants.ts`, so the form's allowed values and the rest of the app stay in lockstep ([Chapter 09](09-domain-model.md)). On submit, the panel maps the validated `event.data` into the request body (turning empty strings into `null` where the backend expects it) and calls `api.post`/`api.put`.

## End-to-end: a typical admin write

```
User edits form
   │  UForm validates against Zod schema  ── fails ──► inline field errors
   ▼ passes
onSubmit builds body
   ▼
api.put('/api/admin/athletes/123', body)   ← token + Accept-Language attached by useApi
   │
   ├─ success ─► close panel, emit 'saved', success toast
   │                 └─► parent calls tableRef.refresh()  ─► DataTable re-fetches list
   └─ failure ─► error toast with getApiErrorMessage(e)
```

## Date conversion helpers

The backend speaks ISO date strings; HTML inputs and localized displays need other formats. [`app/utils/date.ts`](../../app/utils/date.ts) (built on `moment`) bridges them:

- `serverDateToInput(iso)` → `YYYY-MM-DDTHH:mm:ss` for `<input type="datetime-local">`.
- `inputDateToServer(value)` → ISO string for sending back.
- `formatServerDate(iso, locale)` / `formatServerDateOnly(iso, locale)` → localized display (Italian `DD/MM/YYYY`, English `YYYY-MM-DD`), with **no timezone conversion** — values are shown exactly as stored.
