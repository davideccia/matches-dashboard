# 06 — Il pattern CRUD admin

Quasi ogni pagina admin fa la stessa cosa: elenca i record, li cerca, e li crea/modifica/elimina. **CRUD** = *Create, Read, Update, Delete* (crea, leggi, aggiorna, elimina). Invece di reinventarlo per ogni pagina, il codice usa un'unica ricetta ripetuta, costruita con tre componenti riutilizzabili. Imparala una volta e ogni pagina admin si legge allo stesso modo.

I tre ingredienti:

1. **`DataTable`** — l'elenco (tabella paginata e ricercabile).
2. **`*FormPanel`** — un form a pannello laterale per creazione/modifica.
3. **`ApiSelectMenu`** — un menu a tendina ricercabile per scegliere un record correlato.

Percorreremo la pagina atleti, che è rappresentativa. File: [`app/pages/admin/configurations/athletes.vue`](../../app/pages/admin/configurations/athletes.vue) e [`app/components/AthleteFormPanel.vue`](../../app/components/AthleteFormPanel.vue).

## Ingrediente 1 — `DataTable`

[`app/components/DataTable.vue`](../../app/components/DataTable.vue) è una tabella generica. Le passi un `url` e le `columns`; fa il resto:

```vue
<DataTable
  ref="tableRef"
  url="/api/admin/athletes"
  :columns="columns"
  empty-icon="i-mdi-account"
>
  <template #birth_date-cell="{ row }">
    {{ formatServerDateOnly(row.original.birth_date, locale) }}
  </template>
  <template #actions-cell="{ row }">
    <UButton icon="i-mdi-pencil" @click="openEdit(row.original)" />
    <UButton icon="i-mdi-delete" @click="confirmDelete(row.original)" />
  </template>
</DataTable>
```

Cosa gestisce internamente (leggi il componente per conferma):

- **Il recupero dati** tramite [`useApi().get()`](07-data-flow-api.md) avvolto in `useLazyAsyncData` (≈ l'helper di Nuxt "recupera questo e dammi `data`/`status`/`refresh`"). Invia `page`, `per_page`, `search`, `paginate: 1` più eventuali `params` extra che passi.
- **La paginazione** — un controllo `UPagination` e un `USelect` per le righe per pagina (opzioni da `PAGE_SIZES` in `constants.ts`).
- **La ricerca** — una casella di ricerca opzionale (`searchable`, attiva di default) che applica un **debounce** di 300 ms (≈ aspetta che tu smetta di digitare prima di inviare la richiesta) e torna a pagina 1.
- **Stati vuoto / di caricamento** — un'illustrazione di default per "nessun risultato" e caricamento per riga.
- **Celle personalizzate tramite slot** — qualsiasi slot `#<chiaveColonna>-cell` lascia che il genitore renderizzi quella colonna a piacere (formattare date, mappare enum in etichette, pulsanti azione).

Soprattutto espone un metodo `refresh()` tramite `defineExpose`. Il genitore prende un `ref` alla tabella (`tableRef`) e chiama `tableRef.refresh()` dopo ogni creazione/modifica/eliminazione per ricaricare l'elenco.

La pagina genitore definisce le `columns` come array computed (così le intestazioni si ritraducono al cambio di lingua):

```ts
const columns = computed(() => [
  { accessorKey: 'full_name', header: t('athlete.firstName') },
  { accessorKey: 'birth_date', header: t('athlete.birthDate') },
  { accessorKey: 'gender', header: t('athlete.gender.label') },
  { id: 'actions', header: '' },
])
```

## Ingrediente 2 — `*FormPanel`

Ogni risorsa ha il suo pannello (es. [`AthleteFormPanel.vue`](../../app/components/AthleteFormPanel.vue)). È una `USlideover` (≈ un pannello che scivola dal bordo dello schermo) che avvolge una `UForm`. Il contratto:

- **Props**: `item` — il record da modificare, oppure `null` per creare. Un `v-model` booleano controlla aperto/chiuso.
- **Eventi emessi**: `saved` — emesso dopo una creazione o un aggiornamento riusciti.
- **Validazione**: uno schema **Zod** (`z.object({...})`) passato a `UForm`. Il form non si invia finché i dati non lo soddisfano. Esempio dal pannello atleta:

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

- **Lo stato locale del form** è un oggetto `reactive({...})`, popolato da `props.item` quando il pannello si apre (un `watch(open, …)` copia dentro i campi dell'item, o resetta per la modalità creazione).
- **L'invio** decide creazione vs aggiornamento in base al fatto che `item` sia null:

  ```ts
  if (isEdit.value) await api.put(`/api/admin/athletes/${props.item!.id}`, body)
  else              await api.post('/api/admin/athletes', body)
  open.value = false
  emit('saved')
  toast.add({ title: ..., color: 'success' })   // feedback all'utente
  ```

- **Gli errori** sono mostrati con un toast usando `getApiErrorMessage(e)` (un helper in `useApi.ts` che estrae il `message` del backend dall'errore). Vedi il [Capitolo 07](07-data-flow-api.md).

## Ingrediente 3 — `ApiSelectMenu`

Quando un campo del form è un *riferimento a un altro record* (la categoria di peso di default di un atleta, per esempio), non vuoi un enorme `<select>` scritto a mano. [`ApiSelectMenu.vue`](../../app/components/ApiSelectMenu.vue) è un menu a tendina che recupera le sue opzioni da un endpoint:

```vue
<ApiSelectMenu
  v-model="state.default_weight_category_id"
  endpoint="/api/admin/weight_categories"
  label-key="label"
  :placeholder="t('athlete.noCategory')"
/>
```

Caratteristiche da conoscere:

- **Ricerca lato server** — digitare nella casella (debounce 300 ms) riquery l'endpoint con `search=…`.
- **Scroll infinito** — osserva un elemento sentinella con un `IntersectionObserver` (≈ "avvisami quando questo elemento entra nella vista") e carica la pagina successiva quando arrivi in fondo. Imposta `:paginated="false"` per recuperare invece tutto in modo piatto.
- **Risoluzione del valore preselezionato** — in modalità modifica il campo ha già un id ma nessuna opzione caricata; il componente recupera silenziosamente la prima pagina per poter mostrare l'etichetta giusta.
- **Integrazione con il form** — chiama `emitFormChange/Blur/Focus` di `useFormField()` così che la `UForm` circostante azzeri correttamente gli errori di validazione quando scegli qualcosa.

## L'intera pagina assemblata

La pagina genitore (`athletes.vue`) lega insieme i tre:

```ts
const tableRef    = useTemplateRef('tableRef')
const panelOpen   = ref(false)
const editingItem = ref<Athlete | null>(null)

function openCreate() { editingItem.value = null; panelOpen.value = true }
function openEdit(i)  { editingItem.value = i;    panelOpen.value = true }
```

```vue
<ClientOnly>
  <AthleteFormPanel v-model="panelOpen" :item="editingItem" @saved="() => tableRef?.refresh()" />
  <UModal v-model:open="confirmOpen" :title="t('common.confirm')"> … conferma eliminazione … </UModal>
</ClientOnly>
```

Il flusso:

1. Pulsante "Aggiungi" → `openCreate()` → il pannello si apre in modalità creazione.
2. Matita su una riga → `openEdit(row)` → il pannello si apre precompilato.
3. Il pannello salva → emette `saved` → il genitore chiama `tableRef.refresh()` → l'elenco si ricarica.
4. Cestino su una riga → apre una conferma `UModal` → `deleteItem()` chiama `api.del(...)` poi aggiorna.

> [!TIP]
> Ogni risorsa admin (`tournaments`, `disciplines`, `weight_categories`, `users`, `registrations`) segue esattamente questa forma. Per aggiungerne una nuova, copia una pagina esistente + il suo FormPanel, cambia endpoint, colonne e schema Zod, e aggiungi la voce in sidebar in [`layouts/default.vue`](../../app/layouts/default.vue). (Il repo include anche una skill `nuxt-admin-crud` che genera questa impalcatura.)
