# 06 — Data flow & the API layer

> See also: [05 — Authentication](05-authentication.md), [07 — The admin CRUD pattern](07-admin-crud-pattern.md), [10 — Domain model](10-domain-model.md)

This chapter follows the path of data: how the frontend asks the API for data, in what shape it receives it, and how it validates what it sends.

## `useApi`: the single point of contact with the API

Every admin page goes through [`app/composables/useApi.ts`](../../app/composables/useApi.ts). It's a thin wrapper around `useSanctumClient()` (the HTTP client that automatically attaches the token, see [Chapter 05](05-authentication.md)) that adds an `Accept-Language` header with the current language:

```ts
export function useApi() {
  const client = useSanctumClient()
  const { $i18n } = useNuxtApp()
  const lang = () => ({ 'Accept-Language': $i18n.locale.value })

  const get  = <T>(path, params?)        => client<T>(path, { method: 'GET', params, headers: lang() })
  const post = <T>(path, body?, params?) => client<T>(path, { method: 'POST', body, params, headers: lang() })
  const put  = <T>(path, body?, params?) => client<T>(path, { method: 'PUT', body, params, headers: lang() })
  const del  = <T>(path, params?)        => client<T>(path, { method: 'DELETE', params, headers: lang() })
  // upload(formData), download(...) — see below
  return { get, post, put, del, download, upload }
}
```

All methods are *generic* (`<T>`): the caller specifies the expected response type, so TypeScript knows the shape of what comes back.

### `Accept-Language`

By attaching `Accept-Language` to every request, the frontend lets the backend localise messages (e.g. validation errors). The language follows the user's choice in the interface ([Chapter 11](11-i18n-theming.md)).

### `upload` and `download`

- `upload(path, formData)` → sends a `FormData` (for files/attachments) as a POST.
- `download(path, filename)` → a special case: it does **not** go through the Sanctum client but uses `$fetch` with `responseType: 'blob'`, manually reading the token from the `sanctum.token.cookie` cookie and attaching it as `Authorization: Bearer …`. It then creates a temporary link (`URL.createObjectURL`) and "clicks" it to download the file. Used for PDFs (e.g. tournament sheets).

### Extracting the error message

Same file, exported function `getApiErrorMessage(e)`: defensively extracts `e.data.message` from the API's error response. You'll find it in every `catch` block:

```ts
catch (e) {
  toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
}
```

## The shape of responses: Laravel pagination

The Laravel API returns lists in a standard `{ data, meta }` envelope (sometimes with `links`). The full type is in [`app/types/models.ts`](../../app/types/models.ts) (`PaginatedResponse<T>`, lines 152-170), but the minimal shape used everywhere is:

```ts
interface Paginated<T> {
  data: T[]
  meta: { total: number, current_page: number, last_page: number, per_page: number }
}
```

Hence the recurring pattern for extracting the pieces:

```ts
const items = computed(() => data.value?.data ?? [])   // the rows
const total = computed(() => data.value?.meta?.total ?? 0)  // count for pagination
```

## Declarative fetching with `useLazyAsyncData`

In pages and components that read lists, calls aren't imperative but **declarative** via Nuxt's `useLazyAsyncData`. You give it a unique key, a function that produces the Promise, and a list of reactive sources to watch; it re-reads automatically when one of them changes:

```ts
const { data, refresh, status } = useLazyAsyncData(
  'matches-board',
  () => {
    if (!tournamentId.value) { return Promise.resolve(null) }   // no tournament → no fetch
    return api.get<Paginated<MatchRecord>>('/api/admin/match_records?with=…', {
      page: 1,
      ...(search.value ? { search: search.value } : {}),
      tournament_id: tournamentId.value,
    })
  },
  { watch: [search, tournamentId] },   // re-reads when search or tournament changes
)
```

(Real example: [`board.vue`](../../app/pages/admin/tournaments/match_records/board.vue) lines 152-163.)

- `status` is `'idle' | 'pending' | 'success' | 'error'` and is used to show skeletons/spinners.
- `refresh()` re-runs the fetch on demand (e.g. after a save, or when pressing the refresh button).
- Returning `Promise.resolve(null)` is how you *avoid* calling the API when prerequisites are missing (no tournament selected).

### The `with=` parameter

In URLs you'll often see `?with=tournament,red_corner,blue_corner,winner,…`. It's a Laravel backend convention to request that **relations be included** in the response (*eager loading*), avoiding multiple round-trips. Relations loaded this way appear as optional fields on the models (see [Chapter 10](10-domain-model.md)).

## Writing and validating with Zod

Writes (create/update) go through the form panels. Before calling `post`/`put`, the input is validated against a Zod *schema*. Example from [`AthleteFormPanel.vue`](../../app/components/panels/AthleteFormPanel.vue) (lines 121-130):

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

The `<UForm :schema="schema" :state="state">` component from @nuxt/ui binds the schema to the form state and shows per-field errors automatically. Client-side validation is a convenience, **not** the source of truth: the backend always re-validates, and its messages (localised thanks to `Accept-Language`) come back through `getApiErrorMessage`.

## The full picture

```
User types → reactive state → (submit) → Zod validation
   → useApi.post/put → useSanctumClient (attaches token + Accept-Language)
   → Laravel API → response { data } → success toast → emit('saved')
   → the page calls dataTable.refresh() → useLazyAsyncData re-reads the list
```

This cycle is the heart of the CRUD pattern in [Chapter 07](07-admin-crud-pattern.md).
