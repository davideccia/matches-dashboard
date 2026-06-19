# 07 — Il pattern CRUD admin

> Vedi anche: [06 — Flusso dati e livello API](06-data-flow-api.md), [08 — Tabellone incontri e auto-scroll](08-match-board-and-scroll.md)

Quasi ogni pagina admin (atleti, discipline, categorie di peso, utenti, tornei) è la stessa ricetta ripetuta. Imparala una volta e le conosci tutte. La ricetta combina tre componenti riutilizzabili: **`DataTable`**, un **`*FormPanel`** e **`ApiSelectMenu`**.

## La ricetta in tre passi

1. **`DataTable`** — tabella paginata generica. Riceve una `url` e delle `columns`, fa la fetch da sola, gestisce ricerca/paginazione/refresh ed espone `refresh()`.
2. **`*FormPanel`** — uno *slideover* (≈ pannello che scorre dal lato) con un form validato da Zod per creare/modificare. Emette `saved` quando il salvataggio va a buon fine.
3. **`ApiSelectMenu`** — dentro il form, una select che carica le opzioni da un endpoint (per scegliere risorse correlate: una categoria, una disciplina…).

La pagina si limita a definire le colonne, gestire gli stati (`panelOpen`, `editingItem`) e cablare gli eventi.

## Esempio completo: la pagina atleti

Da [`app/pages/admin/configurations/athletes.vue`](../../app/pages/admin/configurations/athletes.vue) (semplificato):

```vue
<template>
  <DataTable ref="tableRef" url="/api/admin/athletes" :columns="columns" empty-icon="i-mdi-account">
    <!-- celle personalizzate via slot con nome `<colonna>-cell` -->
    <template #birth_date-cell="{ row }">
      {{ formatServerDateOnly((row.original as Athlete).birth_date, locale) }}
    </template>
    <template #actions-cell="{ row }">
      <UButton icon="i-mdi-pencil" @click="openEdit(row.original as Athlete)" />
      <UButton icon="i-mdi-delete" color="error" @click="confirmDelete(row.original as Athlete)" />
    </template>
  </DataTable>

  <ClientOnly>
    <AthleteFormPanel v-model="panelOpen" :item="editingItem" @saved="() => tableRef?.refresh()" />
    <!-- + UModal di conferma cancellazione -->
  </ClientOnly>
</template>
```

```ts
const tableRef = useTemplateRef('tableRef')
const panelOpen = ref(false)
const editingItem = ref<Athlete | null>(null)

const columns = computed(() => [
  { accessorKey: 'full_name', header: t('athlete.firstName') },
  { accessorKey: 'birth_date', header: t('athlete.birthDate') },
  // …
  { id: 'actions', header: '' },
])

function openCreate() { editingItem.value = null;  panelOpen.value = true }  // crea
function openEdit(i)  { editingItem.value = i;     panelOpen.value = true }  // modifica
```

Tre dettagli ricorrenti:

- **`item === null` ⇒ creazione, `item !== null` ⇒ modifica.** Lo stesso pannello serve entrambi i casi.
- **Slot `<colonna>-cell`** per renderizzare celle personalizzate (date formattate, badge di stato, pulsanti azione).
- **`<ClientOnly>`** avvolge il pannello: si renderizza solo nel browser, evitando problemi di idratazione con i componenti overlay.
- Dopo `@saved`, la pagina chiama `tableRef.refresh()` per rileggere la lista.

## Dentro `DataTable`

[`app/components/DataTable.vue`](../../app/components/DataTable.vue) è il cavallo di battaglia. Punti salienti:

```ts
const { data, refresh, status } = useLazyAsyncData(
  `data-table-${instanceId}`,                       // chiave univoca per istanza
  () => api.get<{ data: T[], meta: {…} }>(props.url, {
    page: page.value,
    per_page: selectedPageSize.value,
    search: search.value || undefined,
    paginate: 1,
    ...props.params,                                 // filtri extra dalla pagina
  }),
)
```

- **Generico**: `<script setup lang="ts" generic="T extends Record<string, unknown>">` — la tabella non sa nulla del tipo di dato, lo riceve dalle colonne.
- **Ricerca con debounce**: l'input di ricerca aggiorna `search` solo dopo 300 ms di pausa (righe 118-128), per non bombardare l'API a ogni tasto. Cambiare la ricerca riporta a pagina 1.
- **Paginazione**: `page` e `selectedPageSize` sono osservati; al loro cambiamento si rifà la fetch. I valori possibili di pagina sono `PAGE_SIZES = [10, 20, 50, 100]` da [`constants.ts`](../../app/utils/constants.ts).
- **`props.params` con `deep: true`**: se la pagina passa filtri extra (es. `tournament_id`), un loro cambiamento resetta a pagina 1 e rilegge.
- **`defineExpose({ refresh, total, pending })`**: è così che la pagina genitore può chiamare `tableRef.refresh()`.
- **Slot pass-through**: tutti gli slot definiti sulla pagina (tranne `empty` e `filters`) vengono inoltrati a `UTable`, abilitando le celle personalizzate `<colonna>-cell`.

## Dentro un `*FormPanel`

[`app/components/panels/AthleteFormPanel.vue`](../../app/components/panels/AthleteFormPanel.vue) mostra il pattern condiviso da tutti i pannelli:

1. **`open` come `defineModel`**: `const open = defineModel<boolean>()` — il pannello è aperto/chiuso via `v-model` dal genitore.
2. **Caricamento in modifica**: un `watch(open)` (righe 145-175) scatta all'apertura; se è modalità modifica, fa una `GET /api/admin/athletes/{id}` per popolare lo `state` con dati freschi; altrimenti azzera i campi.
3. **Schema Zod + `<UForm>`**: validazione per campo (vedi [Capitolo 06](06-data-flow-api.md)).
4. **`onSubmit`**: costruisce il `body`, chiama `put` (modifica) o `post` (creazione), mostra un toast, emette `saved`. I campi vuoti vengono normalizzati a `null` (`team_name: event.data.team_name || null`).
5. **Gestione errori**: nel `catch`, `getApiErrorMessage(e)` mostra il messaggio del backend.

## Dentro `ApiSelectMenu`

[`app/components/ApiSelectMenu.vue`](../../app/components/ApiSelectMenu.vue) è la select "intelligente" usata nei form per scegliere risorse correlate. Caratteristiche:

- **Ricerca server-side con debounce** (300 ms): digita e la lista si filtra interrogando l'endpoint.
- **Scroll infinito**: un `IntersectionObserver` (≈ una sentinella che avvisa quando un elemento entra in vista) su un elemento sentinella in fondo alla lista incrementa la pagina e accoda i nuovi risultati (righe 182-204).
- **Risoluzione della label in modifica**: se il genitore imposta `modelValue` prima ancora che il popover sia aperto, un `watch` (righe 220-228) fa una fetch silenziosa per risolvere l'etichetta da mostrare.
- **Integrazione con il form**: usa `useFormField()` per emettere `change/blur/focus`, così @nuxt/ui può pulire gli errori di validazione dopo la selezione.
- Modalità `paginated` (default, risposta `{ data, meta }`) oppure flat (`{ data }` con `paginate: 0`).

## Riepilogo del flusso

```
[Pagina]  definisce columns, stato, handler
   │  v-model:open ⇆ panelOpen
   ▼
[FormPanel]  apre → (modifica) GET per popolare → valida (Zod) → POST/PUT
   │  emit('saved')
   ▼
[Pagina]  tableRef.refresh()
   ▼
[DataTable]  useLazyAsyncData rilegge → UTable ridisegna
```
