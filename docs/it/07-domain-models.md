# 07 — Modelli di Dominio

> Vedi anche: [06 — Integrazioni Esterne](06-external-integrations.md), [10 — Pattern Ricorrenti](10-notable-patterns.md).

Il dominio è *tornei di pugilato amatoriale*: gli atleti si iscrivono ai tornei, vengono accoppiati in match e i match vengono valutati dai giudici. Lo schema è del backend; il frontend conosce solo quanto basta per renderizzare form e tabelle. Esistono tre tipi di tipi qui: gli enum del backend (rispecchiati come tuple TypeScript `as const`), i DTO del backend (tipati inline dove serve) e gli schemi Zod per la validazione dei form.

## Enum del backend

Tutti i valori degli enum provengono dal backend. Sono definiti una sola volta in `app/utils/constants.ts` usando il pattern `as const` — un trucco TypeScript che restringe il tipo degli elementi dell'array da `string` all'unione letterale `'MALE' | 'FEMALE' | 'HYBRID'`. Importarli garantisce che il frontend non vada mai fuori sincrono rispetto ai valori ammessi dal backend.

```ts
// app/utils/constants.ts
export const GENDERS = ['MALE', 'FEMALE', 'HYBRID'] as const
export type Gender = typeof GENDERS[number]

export const TOURNAMENT_STATUSES = [
  'SCHEDULED', 'REGISTRATIONS_OPENED', 'REGISTRATIONS_CLOSED',
  'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
] as const

export const MATCH_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

export const END_METHODS = [
  'VICTORY_UNANIMOUS_DECISION', 'VICTORY_SPLIT_DECISION',
  'VICTORY_KO', 'VICTORY_TKO', 'VICTORY_DISQUALIFICATION',
  'DRAW', 'NO_CONTEST',
] as const

export const CLIENT_TYPES = ['DESKTOP', 'MOBILE'] as const  // tipo per personal-access-token
```

**Regola:** mai inserire stringhe enum hardcoded nelle pagine. Importa da `~/utils/constants` e usa la tupla tipata. I componenti select iterano l'array; il type checker prende eventuali typo.

## Interfacce delle entità principali

Tutte le forme delle entità del backend sono dichiarate in `app/types/models.ts` come interfacce TypeScript. Poiché l'app è `ssr: false` e gli auto-import sono attivi, qualsiasi componente può usare questi tipi senza un `import` esplicito.

| Interfaccia       | Campi chiave                                                                                                           |
|-------------------|------------------------------------------------------------------------------------------------------------------------|
| `User`            | `id`, `email`, `superadmin`, `createdAt`                                                                               |
| `Athlete`         | dati personali incluso `taxNumber` (codice fiscale italiano — usato come identificativo naturale), `gender`, `defaultWeightCategoryId` e `defaultDisciplineId` opzionali |
| `Discipline`      | `id`, `label`                                                                                                          |
| `WeightCategory`  | `id`, `label`, `value` (peso in kg)                                                                                    |
| `Tournament`      | `id`, `name`, campi location, `date`, `status` (da `TOURNAMENT_STATUSES`)                                              |
| `Registration`    | legame atleta ↔ torneo; `paidAt` (timestamp o null), `arrived` (booleano), `weightIn` (peso al check-in in kg), `notes`; vari campi `*Label`/`*FullName` sono proiezioni denormalizzate aggiunte dal backend per la visualizzazione |
| `Match`           | due angoli (`redCornerId`, `blueCornerId`), `status`, `winnerId` opzionale, `endMethod`, `rounds`, `minutesPerRound`, e un array `judgesPoints` con i punteggi per turno per giudice |
| `JudgePointsRow`  | una riga nella tabella dei punteggi: `round` + sei slot per giudici (tre per angolo)                                   |
| `PersonalAccessToken` | token API emesso a un utente per client `DESKTOP` o `MOBILE`; campi inclusi: `tokenHash`, `lastUsedAt`, `expiresAt` |

## L'envelope `Page<T>`

`Page<T>` di Spring Data è ciò che restituisce ogni endpoint di tipo lista. La forma consumata da `DataTable`:

```ts
{
  data: {
    content: T[],
    totalElements: number,
    // …più totalPages, number, size, ecc., non usati qui
  }
}
```

`DataTable` invia sempre `page` (zero-based) e `size` come query parameter. Il numero di pagina nella UI è 1-based, quindi il componente sottrae 1 prima della chiamata (vedi `app/components/DataTable.vue`).

## Validazione con Zod

I form panel dichiarano uno schema Zod e lo legano a `<UForm :schema="schema">`. Zod è una libreria di validazione TypeScript-first che produce anche il tipo corrispondente:

```ts
// forma usata nei componenti *FormPanel.vue
import { z } from 'zod'

const schema = z.object({
  email: z.email(),
  superadmin: z.boolean(),
})
type FormState = z.infer<typeof schema>
```

`<UForm>` di `@nuxt/ui` esegue lo schema al submit e mostra automaticamente gli errori sui campi. Il submit chiama poi `useApi().post(...)` / `.put(...)` ed emette `saved`.

## Etichette localizzate

I *valori* degli enum sono stabili, ma le loro etichette per l'utente non lo sono. `i18n/locales/{it,en}.json` contiene le stringhe per l'utente, cercate per chiave (es. `statuses.SCHEDULED`). Quando aggiungi un nuovo valore di enum:

1. Aggiungilo alla tupla `as const` in `constants.ts`.
2. Aggiungi l'etichetta alla chiave corrispondente in **entrambi** i file di traduzione.
