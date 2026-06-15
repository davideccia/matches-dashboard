# 10 — Pattern Ricorrenti

> Vedi anche: [05 — Flusso dei Dati](05-data-flow.md), [06 — Integrazioni Esterne](06-external-integrations.md).

Quattro pattern ricorrenti danno forma alla maggior parte di questo codice. Una volta interiorizzati, gran parte dei file si leggono come variazioni su questi temi.

## 1. La ricetta DataTable + FormPanel

Ogni pagina admin di tipo lista ha la stessa forma:

```vue
<template>
  <UDashboardPanel>
    <UPageHeader :title="t('users.title')">
      <template #right>
        <UButton :label="t('common.create')" @click="onCreate" />
      </template>
    </UPageHeader>

    <DataTable
      ref="dataTable"
      :url="'/api/desktop/users'"
      :columns="columns"
    >
      <!-- slot di colonna per celle/azioni custom -->
    </DataTable>

    <UserFormPanel
      :open="open"
      :item="editing"
      @saved="dataTable?.refresh()"
      @closed="open = false"
    />
  </UDashboardPanel>
</template>
```

Il contratto:

- `DataTable` possiede la paginazione, la dimensione della pagina, la ricerca e il fetch URL → server-page. Espone `refresh()` tramite `defineExpose`.
- Il `*FormPanel` è una `USlideover` (drawer laterale destro) con un form validato Zod. Fa POST (create) o PUT (edit) ed emette `saved` e `closed`.
- La pagina genitore li mette in comunicazione: non ha codice di fetch, di validazione o di submit — solo definizioni di colonne e handler di evento.

Aggiungere una nuova risorsa admin significa: scrivere le colonne, scrivere il form panel, puntare la tabella all'URL. Tre file, niente impalcatura.

### Riferimento prop di `DataTable`

| Prop / slot          | Tipo / default             | Scopo                                                                         |
|----------------------|----------------------------|-------------------------------------------------------------------------------|
| `url` (obbligatorio) | `string`                   | Endpoint backend; i parametri `page`, `size`, `search` vengono aggiunti automaticamente |
| `columns` (obbligatorio) | `TableColumn<T>[]`     | Definizioni di colonna da `@nuxt/ui`                                          |
| `params`             | `QueryParams \| undefined` | Parametri extra della query aggiunti a ogni richiesta (es. un valore di filtro). Osservato in profondità — un cambiamento reimposta a pagina 1 |
| `pageSize`           | `number`, default `10`     | Dimensione iniziale della pagina; l'utente può cambiarla tramite il selettore righe-per-pagina |
| `searchable`         | `boolean`, default `true`  | Mostra l'input di ricerca. Disabilita per tabelle in cui la ricerca server-side non è supportata |
| `showTotal`          | `boolean`, default `true`  | Mostra il badge con il conteggio totale delle righe                           |
| `searchPlaceholder`  | `string \| undefined`      | Sovrascrive il placeholder predefinito nella casella di ricerca               |
| `emptyIcon`          | `string`, default `i-mdi-database` | Icona mostrata nello slot empty-state                                 |
| `emptyText`          | `string \| undefined`      | Sovrascrive il messaggio predefinito "nessun risultato"                       |
| `#filters` slot      | —                          | Reso accanto all'input di ricerca — tipicamente dropdown di filtro aggiuntivi |
| `#empty` slot        | —                          | Sostituzione completa del contenuto dell'empty-state                          |
| `defineExpose`       | `{ refresh, total, pending }` | Chiama `refresh()` dal genitore dopo una mutazione                         |

## 2. JWT in `localStorage`, idratato all'avvio

Persistenza: `localStorage`. Stato reattivo: celle `useState` chiavate `'auth-token'` e `'auth-user'`. Il plugin `plugins/auth.client.ts` viene eseguito a ogni caricamento di pagina:

```ts
// app/plugins/auth.client.ts
// 1. Idrata lo stato da localStorage.
// 2. Valida il token chiamando GET /api/desktop/auth/user.
// 3. In caso di 401, ripulisce entrambe le chiavi; il middleware auth.global.ts reindirizza poi a /login.
```

Due conseguenze da tenere a mente:

- Ogni full reload aggiunge un round-trip extra (la chiamata di validazione). Per uno strumento admin è accettabile.
- Un JWT rubato è pienamente utilizzabile — `localStorage` è accessibile da qualunque script sull'origine. Non è specifico di questa app, ma vale la pena segnalarlo.

## 3. `useState` come singleton condiviso

Non c'è Pinia. Lo stato cross-component usa `useState<T>(key, factory)` di Nuxt, che restituisce la stessa `ref` per la stessa chiave. La factory viene invocata una volta per istanza di app. Esempi nel repo:

- `useState<string | null>('auth-token')` — JWT corrente
- `useState<AuthUser | null>('auth-user')` — utente corrente

Il pattern basta perché l'app ha pochissimi pezzi di stato condiviso. Se la situazione dovesse cambiare, Pinia è il naturale upgrade.

## 4. Notify-then-refetch su WebSocket

Lo scoreboard live si sottoscrive a `/topic/tournaments/{id}/matches`. La callback **ignora il body del messaggio** e ri-emette la GET REST:

```ts
stompClient.subscribe(`/topic/tournaments/${id}/matches`, () => fetchMatches(id))
```

Il pattern significa che il WebSocket è solo un segnale di evento; REST resta l'unica fonte di verità. Il client non deve mai fondere aggiornamenti parziali nello stato reattivo, e il recupero da reconnect è gratis — il prossimo evento innescherà un refresh che include tutto ciò che si era perso.

Vedi [06](06-external-integrations.md) per il setup completo, compresa la derivazione dell'URL `http→ws` e il ciclo di vita esplicito `activate`/`deactivate`.

## 5. Gli auto-import cambiano il modo in cui si leggono i file

Nuxt auto-importa tutto in `components/`, `composables/`, `utils/`, oltre alle API stesse di Vue e Nuxt. Un file che usa `ref`, `computed`, `useState`, `useI18n`, `<DataTable>` e `useApi` non avrà **alcuna** riga di `import` per quei simboli. È normale — in caso di dubbio sull'origine di un simbolo, cerca nel codice o consulta i `.nuxt/types/*.d.ts` generati automaticamente.

## 6. Disciplina i18n: aggiungi sempre a entrambi i file

Esistono esattamente due file di traduzione: `i18n/locales/it.json` e `i18n/locales/en.json`. Ogni nuova chiave deve atterrare in entrambi. Il plugin ESLint `@intlify/eslint-plugin-vue-i18n` segnala chiavi mancanti/non usate — `pnpm eslint . --fix` cattura la maggior parte delle distrazioni.
