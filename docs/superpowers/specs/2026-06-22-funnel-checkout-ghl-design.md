# Funnel Checkout → GoHighLevel (GHL) Lead Capture — Design

**Date:** 2026-06-22
**Status:** Approved (pending spec review)

## Goal

Capture every contact/lead who submits the free-book funnel **checkout** form
(`/free-book/checkout`) into GoHighLevel, so the business has the contact, a
pipeline opportunity (deal), and an order note for each submission.

Today the checkout form (`src/app/(funnel)/free-book/checkout/page.tsx`) only
writes the order to `sessionStorage` and redirects to the `/free-book/mastery`
upsell. It makes **no** API call, so these leads are never captured anywhere.

## Context: existing GHL pattern

The codebase already integrates with GHL in two routes, which this design
mirrors:

- `src/app/api/contact/route.ts` — upserts a contact, creates a pipeline
  opportunity (if configured), and adds a note.
- `src/app/api/playbook/route.ts` — upserts a contact with tags.

Both use:
- Base URL `https://services.leadconnectorhq.com`
- `Authorization: Bearer ${process.env.GHL_API_KEY}`
- `Version: 2021-07-28`
- `process.env.GHL_LOCATION_ID`
- The "create contact; on duplicate error read `meta.contactId` and PUT-update"
  pattern.

The two routes **duplicate** `getGHLHeaders()` and the upsert logic. Since this
work adds a third consumer, we extract the shared logic into `src/lib/ghl.ts`
and refactor all three routes to use it (behavior-preserving for the existing
two).

## Configuration (environment variables)

Stored in `.env.local` (already gitignored via `.env*`). A new `.env.example`
documents them without secrets.

| Variable | Value | Notes |
|---|---|---|
| `GHL_API_KEY` | `pit-…` (Private Integration Token) | Reuses the existing var; works as the Bearer token the code already expects. |
| `GHL_LOCATION_ID` | `LwsKS1Uf1UctDEWEaj3p` | Reuses the existing var. |
| `GHL_FUNNEL_PIPELINE_ID` | `ahKfmeubC9KOOIBmPu2p` | "Book Ordered Pipeline". Separate from the contact form's `GHL_PIPELINE_ID` to avoid collision. |
| `GHL_FUNNEL_PIPELINE_STAGE_ID` | `91280596-9065-4a4c-906b-4f72f075ad62` | "Ordered Book" stage. |

> **Note:** The API key was shared in plaintext during planning. Recommend
> rotating it in GHL after rollout. The `pit-` prefix denotes a Private
> Integration Token.

## Components

### 1. `src/lib/ghl.ts` (new shared module)

Behavior-preserving extraction of the GHL helpers. Exposes:

- `GHL_BASE_URL` constant.
- `isGHLConfigured(): boolean` — true when `GHL_API_KEY` and `GHL_LOCATION_ID`
  are set.
- `getGHLHeaders(): Record<string,string>` — Bearer + Version + Content-Type.
- `upsertContact(input): Promise<string>` — creates or updates a contact and
  returns its `contactId`. `input` supports `firstName`, `lastName`, `email`,
  optional `phone`, optional address fields (`address1`, `city`, `state`,
  `postalCode`, `country`), `tags`, `source`.
- `createOpportunity({ pipelineId, pipelineStageId, contactId, name,
  monetaryValue?, status })` — returns the opportunity or `null` on failure
  (logged, non-throwing), matching the contact route's tolerant behavior.
- `addNote(contactId, body): Promise<void>` — best-effort, logs on failure.

The existing `contact` and `playbook` routes are refactored to call
`upsertContact` / `createOpportunity` / `addNote` instead of their inline
copies. Their externally observable behavior (tags, source strings, response
messages, status codes) is unchanged.

### 2. `src/app/api/funnel-checkout/route.ts` (new route)

`POST` handler:

1. Parse body. Expected fields: `firstName`, `lastName`, `email`, `address`,
   `city`, `state`, `zip`, `country`, `orderBump` (boolean), `total` (number).
   **Payment fields are never accepted or read.**
2. Validate `firstName`/`lastName` (≥2 chars) and `email` (regex), same rules as
   the other routes. Invalid → `400` with field errors.
3. If GHL not configured → log and `500` with a generic message.
4. `upsertContact` with:
   - address mapped to GHL fields (`address` → `address1`, `zip` →
     `postalCode`),
   - `source: "Funnel Checkout — Free Book"`,
   - tags `["funnel-checkout", "book-order", "168-game"]`, plus
     `"order-bump-quickstart"` when `orderBump` is true.
5. `createOpportunity` in `GHL_FUNNEL_PIPELINE_ID` /
   `GHL_FUNNEL_PIPELINE_STAGE_ID`:
   - `name: "Book Order — {firstName} {lastName}"`,
   - `monetaryValue: total`,
   - `status: "open"`.
   Skipped with a warning if the funnel pipeline vars are absent (mirrors the
   contact route's tolerant approach).
6. `addNote` with an order summary (items, bump yes/no, total, shipping
   address).
7. Return `200 { success: true }`. Opportunity/note failures are logged but do
   not fail the request, because the contact (the lead) was captured.

### 3. `src/app/(funnel)/free-book/checkout/page.tsx` (client wiring)

- Add `isSubmitting` state.
- `handleSubmit` becomes `async`:
  1. `preventDefault`, set `isSubmitting`.
  2. Keep the existing `sessionStorage` writes (`funnelCustomer`,
     `funnelOrder`).
  3. `POST` the lead payload (name, email, address fields, `orderBump`,
     `total`) to `/api/funnel-checkout`, **excluding** all card fields.
  4. Await the fetch inside `try/catch` **raced against an ~8s timeout** so a
     slow/hung GHL never traps the user.
  5. **Always** `router.push('/free-book/mastery')` afterward — success or
     failure. The funnel is never blocked.
- The submit button shows "Processing…" and is disabled while `isSubmitting`.

## Data flow

```
Checkout form submit
  → sessionStorage (unchanged)
  → POST /api/funnel-checkout  (no card data)
       → lib/ghl.upsertContact      (contact + address + tags + source)
       → lib/ghl.createOpportunity  (Book Ordered → Ordered Book, total)
       → lib/ghl.addNote            (order summary)
  → router.push('/free-book/mastery')   (always, regardless of API result)
```

## Error handling

- **Client:** never blocks; timeout race guarantees redirect; errors are
  swallowed (lead capture is best-effort from the user's perspective).
- **Server:** validation → `400`; missing config → `500`; contact upsert
  failure → `500` (the lead is the critical artifact); opportunity/note
  failures → logged, request still `200`.
- **No payment data** is transmitted to the server or GHL.

## Testing / verification

No test framework is configured (per `CLAUDE.md`), so verification is manual +
a live smoke test:

1. `npm run lint` and `npm run build` pass.
2. With `.env.local` set, run `npm run dev`, submit the checkout with a test
   contact, and confirm in GHL: contact created with address + tags, opportunity
   in Book Ordered → Ordered Book with the right total, and the order note.
3. Delete the test contact/opportunity from GHL afterward.
4. Confirm the redirect to `/free-book/mastery` still happens when GHL is
   unreachable (e.g., temporarily bad key) — the funnel must not break.

## Out of scope

- Real payment processing (checkout remains a mock charge).
- Capturing the earlier free-book opt-in page (only the checkout form is in
  scope for this work).
- Upsell/downsell pages (`mastery`, `course`, etc.) pushing additional events to
  GHL.
```
