# 08 — Match board & auto-scroll (seek)

> See also: [07 — The admin CRUD pattern](07-admin-crud-pattern.md), [09 — Realtime scoreboard](09-realtime-scoreboard.md)

The *match board* is a grid view of a tournament's bouts, meant to be left open during an event. It exists in two variants that share the same idea of **auto-scrolling to the active match** (the "seek"):

- **Admin** — [`app/pages/admin/tournaments/match_records/board.vue`](../../app/pages/admin/tournaments/match_records/board.vue): clickable cards that open the edit panel.
- **Public** — [`app/pages/public/tournaments/match_records.vue`](../../app/pages/public/tournaments/match_records.vue): read-only, with live updates over WebSocket ([Chapter 09](09-realtime-scoreboard.md)).

This chapter focuses on the admin version and devotes its second half to the seek mechanism, which is the subtlest part of the file.

## The admin board page at a glance

The page ([`board.vue`](../../app/pages/admin/tournaments/match_records/board.vue)) has three zones:

1. **Filter bar** (always visible): a search input, an `ApiSelectMenu` to pick the tournament, a button to clear the selection, a refresh button, and a badge with the total.
2. **Scrollable area** with four mutually exclusive states:
   - no tournament selected → a prompt to pick one;
   - `status === 'pending'` → a grid of skeletons;
   - empty list → a "no results" state;
   - otherwise → the **card grid** (`MatchRecordCardReadOnly`).
3. **Edit panel** (`MatchRecordFormPanel`), opened by clicking a card.

The fetch follows the pattern from [Chapter 06](06-data-flow-api.md): a `useLazyAsyncData` that depends on `search` and `tournamentId`, and that returns `Promise.resolve(null)` while no tournament is selected (lines 152-163). No tournament, no call.

```ts
const items = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta?.total ?? 0)
```

Clicking a card opens the panel in edit mode, positioned on the "outcome" tab:

```ts
// lines 195-199
function openEdit(item: MatchRecord) {
  editingItem.value = item
  initialTab.value = 'outcome'   // start on the outcome tab
  panelOpen.value = true
}
```

## The problem the seek solves

During a tournament the match list can be dozens of rows long. Whoever watches the board wants to see the bout happening *right now* **immediately**, without scrolling by hand. So when the list loads (or reloads), the page must scroll itself to the right card. That's the *seek*.

The priority rule is:

1. if there's a match **in progress** (`status === 'in_progress'`) → scroll there;
2. otherwise, if there's a **scheduled** match (`status === 'scheduled'`) → scroll there;
3. otherwise → don't scroll.

## How the seek is implemented

It takes three ingredients: references to the cards' DOM elements, a flag to scroll only once, and a `watch` that does the scrolling when the data arrives.

### 1. Collecting references to the cards

In the template, each card registers its own DOM element into an array, using its **index** as the key (lines 91-99):

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

`matchCardEls` is a `ref<HTMLElement[]>([])` (line 127). The *function ref* `:ref="(el) => …"` is Vue's way to obtain the real DOM node of each item in a list: the `index` of the card in the list matches the index in the `matchCardEls` array. This index-to-index alignment is what later lets the code go from a match's index to its element on screen.

### 2. The "scroll only once" flag

```ts
let hasScrolledInitially = false   // line 128
```

Without this flag, **every** data re-read (search, refresh, pagination) would jump the page to the active match, interrupting a user who was scrolling by hand. The flag makes the automatic seek happen **only once** per "viewing session" of a tournament.

> Note: `hasScrolledInitially` is a plain `let` variable, **not** a `ref`. It doesn't need to be reactive — it's just a control switch, and making it reactive would trigger pointless recomputations.

### 3. The `watch` that performs the scroll

The heart of the seek (lines 168-181):

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

Step by step:

- **(a) early-exit guard** — if the list is empty *or* we've already scrolled, return immediately. This is where the flag prevents repeats.
- **(b) `await nextTick()`** — this is the crucial detail. When `items` changes, Vue has *not yet* re-rendered the DOM: the cards (and therefore their elements in `matchCardEls`) may not exist yet. `nextTick()` (≈ "wait until the screen has actually been repainted") suspends the function until the DOM reflects the new data. Only then does `matchCardEls.value[i]` point to a real element.
- **(c) find the in-progress match** — `findIndex` returns the index of the first `in_progress` match, or `-1` if there is none. It checks *both* `idx !== -1` *and* that `matchCardEls.value[idx]` exists, because the DOM might not be perfectly aligned in edge cases.
- **(d) scheduled fallback** — if there's no in-progress match, repeat the same logic with `status === 'scheduled'`.
- **(e) raise the flag** — from now on the automatic seek won't fire again until it's re-armed.

`scrollIntoView({ behavior: 'smooth', block: 'center' })` scrolls the container smoothly (animated) until the card sits at the vertical **center** of the screen.

### Re-arming the seek

The flag must return to `false` in two situations, so the next load re-positions the view again:

**When the tournament changes** (lines 143-150):

```ts
watch(tournamentId, (val) => {
  if (!val) { searchInput.value = ''; search.value = '' }
  hasScrolledInitially = false   // re-arm the seek
  matchCardEls.value = []         // drop the old DOM references
})
```

**When refresh is pressed** (lines 183-187):

```ts
function refreshBoard() {
  hasScrolledInitially = false   // re-arm the seek
  matchCardEls.value = []
  refresh()                       // re-reads the list → the watch fires again
}
```

In both cases `matchCardEls` is also cleared: the old DOM nodes belong to the previous list and must be discarded before `:ref` repopulates the array with the new cards.

## The public variant: seek on every update

The public page [`public/tournaments/match_records.vue`](../../app/pages/public/tournaments/match_records.vue) uses the **same** priority algorithm (in progress → scheduled), but with a deliberate difference: it has **no** `hasScrolledInitially` flag. Its `watch(matchesData)` (lines 242-253) re-positions the view on **every** data arrival, including WebSocket pushes:

```ts
// Keep the active (or next) match centered on every refresh, including WS pushes.
watch(matchesData, async () => {
  await nextTick()
  const inProgressIdx = matches.value.findIndex(m => m.status === 'in_progress')
  if (inProgressIdx !== -1 && matchCardEls.value[inProgressIdx]) {
    matchCardEls.value[inProgressIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else { /* …scheduled fallback… */ }
})
```

The logic matches the use case: the public board is a "kiosk" view that must continuously **chase** the active match as the backend signals changes; the admin one re-positions once so as not to disturb someone working on the list. The WebSocket piece that triggers these updates is described in [Chapter 09](09-realtime-scoreboard.md).
