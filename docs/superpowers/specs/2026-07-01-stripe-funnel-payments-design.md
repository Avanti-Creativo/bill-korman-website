# Stripe Payments for the Free-Book Funnel — Design Spec

**Date:** 2026-07-01
**Branch:** `stripe-funnel-integration`
**Status:** Approved design, pending spec review

## 1. Goal

Add real payment processing to the `/free-book` funnel. The buyer enters card
details **once** at checkout; the card is saved to a Stripe Customer; every
subsequent upsell "Yes" charges that saved card in **one click** (no card
re-entry). Installment offers charge the saved card on a real schedule.

Today the funnel collects fake card fields that go nowhere, captures the lead in
GoHighLevel (GHL), and routes through upsells that only write to `sessionStorage`
(convention tickets link out to external `buy.stripe.com` pages). This replaces
that with a first-party Stripe integration while preserving the existing custom
UI and the GHL lead capture.

## 2. Scope

In scope (all confirmed with the client):

| Funnel step | Product | Amount | Charge type |
|---|---|---|---|
| `checkout` | Book shipping & handling | $5.95 | One-time, **saves card** |
| `checkout` (bump) | Quick Start Implementation Guide | +$47.00 | One-time |
| `mastery` | Time Ownership Accelerator | $7,500.00 | One-click (saved card) |
| `course` | On-Demand Mastery Course | $497.00 | One-click (saved card) |
| `convention` | Convention — Regular | $997.00 | One-click (saved card) |
| `convention` | Convention — VIP | $1,497.00 | One-click (saved card) |
| `convention-plan` | Convention — 3-pay | 3 × $332.33 (today / +30d / +60d) | Subscription (saved card) |

Confirmed assumptions:

- **Mastery** is a single **$7,500 one-click** charge. The page's "Payment plans
  available" line has no UI/terms today; we either remove that line or define
  terms in a later pass. Not built in v1.
- The two external `buy.stripe.com` convention links are **replaced** by
  in-funnel one-click buttons ($997 / $1,497).

Out of scope: refunds UI, physical-fulfillment automation beyond a GHL note,
mastery installments, tax collection (none charged today), coupon/discount codes.

## 3. Stripe account & keys

- Account: **BILL KORMAN MINDSET REVOLUTION** (`acct_1RqImuAPnj4h3W19`), verified
  via `stripe login`.
- Build and test in **test mode** first, then swap to live for launch.
- Use a **restricted API key** (`rk_`), least-privilege, not the raw secret key.
  Required permissions (write unless noted): Customers, PaymentIntents,
  SetupIntents, Prices/Products, Subscriptions, Checkout Sessions; Webhook
  Endpoints (read); Events (read). Create one RAK for test, one for live.
- Pin the SDK to API version **`2026-06-24.dahlia`**.
- **Never** pass `payment_method_types` — omit it everywhere so Stripe's dynamic
  payment methods (managed from the Dashboard) apply.

### Environment variables (add to `.env.example` + `.env.local`)

```
STRIPE_SECRET_KEY=rk_test_…                 # restricted key (rk_), not sk_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_CONVENTION_PLAN_PRICE_ID=price_…     # recurring $332.33/mo price, created once in-account
FUNNEL_SESSION_SECRET=…                      # 32+ random bytes, signs the funnel cookie
```

Secrets live only in `.env.local` (gitignored) and Vercel env — never committed,
never logged, never returned to the client. Add a pre-commit hook that blocks
`sk_`/`rk_` literals in tracked files.

## 4. Architecture

Three interacting units plus the Stripe primitives, chosen to keep the whole
funnel on a consistent set of APIs:

### 4.1 `src/lib/stripe.ts` — server Stripe client + product catalog

- Initializes the `Stripe` client from `STRIPE_SECRET_KEY`, `apiVersion` pinned.
- Exports `PRODUCTS`, the **single source of truth for every amount** (in cents).
  The client never sends an amount — only a product *key*.

```ts
export const PRODUCTS = {
  'book-shipping':      { amount: 595,    label: 'The 168 Game — Shipping & Handling' },
  'order-bump':         { amount: 4700,   label: 'Quick Start Implementation Guide' },
  'mastery':            { amount: 750000, label: 'Time Ownership Accelerator (6-Month)' },
  'convention-regular': { amount: 99700,  label: 'Convention — Regular Ticket' },
  'convention-vip':     { amount: 149700, label: 'Convention — VIP Ticket' },
  'course':             { amount: 49700,  label: 'On-Demand Mastery Course' },
} as const;
// 'convention-plan' is billed via a Subscription against STRIPE_CONVENTION_PLAN_PRICE_ID.
```

### 4.2 `src/lib/funnel-session.ts` — DB-less funnel state

There is no database. State that must survive across funnel pages and be trusted
server-side lives in one **HMAC-signed, httpOnly cookie** (`funnel_session`),
signed with `FUNNEL_SESSION_SECRET` using Node `crypto` (no new dependency).

Payload:

```ts
interface FunnelSession {
  stripeCustomerId: string;
  paymentMethodId: string | null;   // set once the card is saved
  ghlContactId: string | null;      // from lead capture, for webhook → GHL
  email: string;
  purchased: string[];              // product keys already charged (idempotency guard)
}
```

Helpers: `readSession(req)`, `writeSession(res, data)`, `sign()`, `verify()`.
`purchased[]` prevents charging the same upsell twice on refresh/back.

### 4.3 API routes — `src/app/api/stripe/*`

All amounts are resolved server-side from `PRODUCTS`; the client passes only a
product key. Each route reads/writes the signed session cookie.

- **`checkout/route.ts`** — Initial payment (also folds in the existing GHL lead
  capture, replacing `/api/funnel-checkout`).
  1. Validate contact fields (reuse the current validation).
  2. `upsertContact(...)` via `src/lib/ghl.ts` → `ghlContactId` (best-effort).
  3. Create or look up a Stripe **Customer** by email (name + shipping address).
  4. Compute amount from catalog (`book-shipping` + optional `order-bump`).
  5. Create a **PaymentIntent** (deferred confirmation) with
     `setup_future_usage: 'off_session'`, `customer`, and
     `metadata: { ghlContactId, email, step: 'book', orderBump }`. Omit
     `payment_method_types`.
  6. `writeSession({ stripeCustomerId, ghlContactId, email, paymentMethodId: null, purchased: [] })`.
  7. Return `{ clientSecret }`.

- **`save-session/route.ts`** — Called right after the client confirms the first
  payment. Retrieves the PaymentIntent, extracts `customer` + `payment_method`,
  writes `paymentMethodId` into the session cookie, and sets it as the customer's
  `invoice_settings.default_payment_method` (needed for the installment plan).

- **`upsell/route.ts`** — One-click charge. Body: `{ product }`.
  1. Read session → `stripeCustomerId`, `paymentMethodId`. Reject if missing.
  2. Reject if `product` already in `purchased[]`.
  3. Look up amount from catalog. Create a **PaymentIntent** with `customer`,
     `payment_method`, `confirm: true`, **on-session** (buyer is present — omit
     `off_session` so 3-DS can complete instead of hard-declining), an
     **idempotency key** of `${customerId}:${product}`, and metadata
     `{ ghlContactId, product }`. Omit `payment_method_types`.
  4. `succeeded` → add `product` to `purchased[]`, return `{ status: 'succeeded' }`.
     `requires_action` (e.g. 3-DS on the $7,500) → return
     `{ status: 'requires_action', clientSecret }`; the client runs
     `stripe.handleNextAction()` then re-confirms; on success we mark purchased.
     Any decline → `{ status: 'failed', message }`.

- **`installment-plan/route.ts`** — Convention 3-pay. Body: `{ product: 'convention-plan' }`.
  1. Read session → customer + saved card.
  2. Create a **Subscription Schedule** on `STRIPE_CONVENTION_PLAN_PRICE_ID`
     (recurring $332.33/mo) against the saved customer + default payment method:
     a single phase with `iterations: 3` and `end_behavior: 'cancel'` (charges
     today, +30d, +60d, then stops). Use `payment_behavior: 'default_incomplete'`
     so the first invoice's PaymentIntent returns a `clientSecret`; the client
     confirms it on-session (handles 3-DS). Only treat the plan as active after
     that first confirmation succeeds; otherwise release the schedule.
  3. Metadata `{ ghlContactId, product: 'convention-plan' }`. Payments 2 & 3
     auto-charge on schedule; Stripe's dunning handles any later failure.

- **`webhook/route.ts`** — Signature-verified with `STRIPE_WEBHOOK_SECRET`
  (raw body). Handles `payment_intent.succeeded`, `invoice.paid`,
  `invoice.payment_failed`, `charge.refunded`. Uses the object's **metadata**
  (`ghlContactId`, `product`) to update GHL best-effort: add a "Paid $X — [label]"
  note. GHL is the source of truth for *paid*, kept separate from the earlier
  lead capture. Best-effort: a GHL failure never 500s the webhook (Stripe would
  retry).

  > **As-built note (2026-07-02):** the webhook posts a **note only**. The
  > originally-planned opportunity `monetaryValue` bump was intentionally
  > dropped: with no datastore we don't persist the GHL opportunity id, so we
  > can't reliably update the existing opportunity's value (creating a new
  > opportunity per payment would clutter the pipeline). Tracked follow-up if
  > opportunity-value roll-up is later needed — it would require storing the
  > opportunity id (e.g. in the funnel-session cookie or a small store).

### 4.4 Client

- **`src/components/funnel/StripeProvider.tsx`** — wraps children in
  `<Elements>` (deferred `mode: 'payment'`, amount, `currency: 'usd'`,
  `setup_future_usage: 'off_session'`), loaded from
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- **`checkout/page.tsx`** — replace the fake `cardNumber/expiry/cvc` `Input`s with
  the Stripe **`<PaymentElement>`**. Order-bump toggle calls `elements.update({ amount })`.
  On submit: `elements.submit()` → `POST /api/stripe/checkout` → `stripe.confirmPayment({ … redirect: 'if_required' })`
  → `POST /api/stripe/save-session` → keep the existing `sessionStorage` order
  writes → `router.push('/free-book/mastery')`. Add real error + loading states.
- **`src/hooks/useUpsellCharge.ts`** — shared client hook used by `mastery`,
  `course`, `convention`: posts to `/api/stripe/upsell`, handles
  `requires_action` via `stripe.handleNextAction`, exposes `{ charge, isLoading, error }`.
  Each page's accept handler awaits `charge(product)`, keeps its `sessionStorage`
  write, then routes on success; on failure it shows an inline error and stays.
- **`convention-plan/page.tsx`** — accept handler posts to `/api/stripe/installment-plan`,
  confirms the first invoice if `requires_action`, then routes to `thank-you`.
- **`convention/page.tsx`** — the two external-link CTAs become one-click buttons
  (Regular / VIP) driven by `useUpsellCharge`.

## 5. Data flow (happy path)

```
checkout form submit
  → /api/stripe/checkout   (GHL upsert + Customer + PaymentIntent, cookie set)
  → confirmPayment (card saved)
  → /api/stripe/save-session (pm stored, default pm set)
  → mastery ──accept──▶ /api/stripe/upsell {mastery}  ─▶ convention
       └──decline──▶ course ──accept──▶ /api/stripe/upsell {course} ─▶ convention
  convention ──Regular/VIP──▶ /api/stripe/upsell {convention-*} ─▶ thank-you
             └──decline──▶ convention-plan ──accept──▶ /api/stripe/installment-plan ─▶ thank-you
  (async) Stripe webhooks ─▶ GHL notes + opportunity value
```

## 6. Error handling

- **Initial payment declined:** stay on checkout, show Stripe's error message, no
  redirect, lead already captured in GHL so the contact isn't lost.
- **Upsell declined / SCA fails:** inline error on that upsell page, buyer can
  retry or decline to move on. No charge, no `purchased[]` entry.
- **Installment first payment fails:** stay on `convention-plan` with an error;
  no subscription left dangling (create only after first-invoice success, or
  cancel on failure).
- **Best-effort boundaries:** GHL writes and the webhook's GHL updates never block
  the buyer or fail a Stripe webhook.
- **Double-charge protection:** `purchased[]` guard + idempotency keys +
  client button-disable during in-flight requests.

## 7. Security

- Restricted API key, least privilege; secret + webhook secret only in env.
- All amounts server-side from `PRODUCTS`; client sends product keys only.
- Session cookie is httpOnly + signed (tamper-evident) + `secure` in production.
- Webhook signatures verified against the raw body before any processing.
- No `payment_method_types`; dynamic methods via Dashboard.
- Pre-commit hook to catch key literals; `.env*` already gitignored.

## 8. Testing & rollout

No test framework is configured. Plan:

1. **Unit tests** (add a light runner, e.g. `vitest`, or plain node `assert`
   scripts) for the pure helpers only: catalog amount math and cookie
   `sign`/`verify` round-trip + tamper rejection.
2. **Manual E2E in test mode:** run `stripe listen --forward-to localhost:3000/api/stripe/webhook`;
   walk the full funnel with test cards — success (`4242…`), 3-DS required
   (`4000 0025 0000 3155`), decline (`4000 0000 0000 9995`). Verify: card saved,
   each upsell one-click charges, installment subscription created with 3 planned
   invoices, GHL notes/opportunity updated.
3. **Go-live:** create live RAK + live webhook endpoint, swap env in Vercel, run
   one real low-value smoke charge and refund it, then enable.

## 9. Alternatives considered

- **Checkout Session `ui_mode: 'custom'` for the first charge** (Stripe's stated
  preference for custom embedded UI). Not chosen: the checkout is a fully custom
  form with a dynamic order-bump total, and the one-click upsell requirement
  forces PaymentIntents regardless — keeping the whole funnel on the Payment
  Element + PaymentIntent primitive is more consistent and lower-risk here.
  Documented deviation.
- **`sessionStorage` for the Stripe customer id** instead of a signed cookie.
  Rejected: client-tamperable; a signed httpOnly cookie is the trusted store.
- **Off-session-only upsells.** Rejected in favor of handling `requires_action`
  so large charges ($7,500) can complete 3-DS instead of hard-declining.
- **Hand-rolled installment charge loop.** Rejected per Stripe guidance — use the
  Billing/Subscription APIs, which handle retries and dunning.

## 10. File change summary

New:
- `src/lib/stripe.ts`, `src/lib/funnel-session.ts`
- `src/app/api/stripe/{checkout,save-session,upsell,installment-plan,webhook}/route.ts`
- `src/components/funnel/StripeProvider.tsx`, `src/hooks/useUpsellCharge.ts`
- Pre-commit hook; light unit tests for helpers

Modified:
- `src/app/(funnel)/free-book/checkout/page.tsx` (Payment Element, real submit)
- `src/app/(funnel)/free-book/{mastery,course,convention,convention-plan}/page.tsx`
  (accept handlers charge before routing)
- `src/lib/ghl.ts` (payment-note / opportunity-value helper, if needed)
- `.env.example` (new Stripe vars)

Removed / superseded:
- `src/app/api/funnel-checkout/route.ts` (folded into `/api/stripe/checkout`)
- external `buy.stripe.com` links on the convention page
```
