# Stripe Funnel Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Charge real money in the `/free-book` funnel — save the card once at checkout, then charge it with one click on every upsell, and on a real schedule for the installment plan.

**Architecture:** A server-side product catalog is the only source of truth for amounts; the client sends product *keys*, never prices. The Stripe customer + saved payment method + GHL contact id live in one HMAC-signed httpOnly cookie (no database). Checkout and one-click upsells use PaymentIntents; the convention installment plan uses a Subscription Schedule. Stripe webhooks push paid-status back into GoHighLevel.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, `stripe` (server SDK), `@stripe/stripe-js` + `@stripe/react-stripe-js` (Payment Element), `vitest` (unit tests), Node `crypto` (cookie signing).

## Global Constraints

- **Stripe account:** BILL KORMAN MINDSET REVOLUTION (`acct_1RqImuAPnj4h3W19`). Build/test in **test mode**, swap to live at launch.
- **API key:** use a **restricted key** (`rk_`), least privilege — stored in `STRIPE_SECRET_KEY`. Never a raw `sk_`. Never commit or log keys.
- **Never pass `payment_method_types`** to any Stripe call (dynamic payment methods). For server-side `confirm: true` charges, use `automatic_payment_methods: { enabled: true, allow_redirects: 'never' }`.
- **Stripe SDK:** install latest; do **not** override `apiVersion` (the SDK pins the latest, `2026-06-24.dahlia`) to avoid TS literal mismatches.
- All amounts in **cents**, currency **`usd`**.
- **Runtime:** every route under `src/app/api/stripe/*` must `export const runtime = 'nodejs'` (Stripe SDK + `crypto` need Node, not Edge).
- **Best-effort GHL:** GHL calls never block the buyer and never fail a Stripe webhook.
- **Testing strategy:** TDD with `vitest` for all pure logic (catalog math, cookie sign/verify, client charge helpers) and one mocked happy-path + one guard test per API route. Full payment flows are verified manually in Stripe test mode (Task 13) — networked Stripe/3-DS flows aren't meaningfully unit-testable.
- **Docs to confirm while implementing** (APIs drift): [Payment Element + deferred PaymentIntent](https://docs.stripe.com/payments/paymentelement/deferred-payment-intent), [Save a card during payment](https://docs.stripe.com/payments/save-during-payment), [Subscription Schedules](https://docs.stripe.com/billing/subscriptions/subscription-schedules), [Webhooks](https://docs.stripe.com/webhooks). The `stripe-best-practices` skill is authoritative on key handling and dynamic payment methods.

---

### Task 1: Project setup — deps, test runner, env, Stripe client & catalog

**Files:**
- Modify: `package.json` (dependencies + scripts)
- Create: `vitest.config.ts`
- Modify: `.env.example`
- Create: `src/lib/stripe.ts`
- Test: `src/lib/stripe.test.ts`

**Interfaces:**
- Produces: `stripe` (configured `Stripe` client), `isStripeConfigured(): boolean`, `PRODUCTS` map, `type ProductKey`, `checkoutAmountCents(orderBump: boolean): number`, `CURRENCY = 'usd'`.

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
npm install -D vitest
```
Expected: packages added, no errors.

- [ ] **Step 2: Add test scripts to `package.json`**

Add to the `"scripts"` block:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 4: Add the new env vars to `.env.example`**

Append:
```
# Stripe (BILL KORMAN MINDSET REVOLUTION). Use restricted keys (rk_), test mode first.
STRIPE_SECRET_KEY=rk_test_your_restricted_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
STRIPE_CONVENTION_PLAN_PRICE_ID=price_convention_3pay_monthly
FUNNEL_SESSION_SECRET=generate_32plus_random_bytes
```

- [ ] **Step 5: Write the failing test for the catalog**

`src/lib/stripe.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { PRODUCTS, checkoutAmountCents } from './stripe';

describe('product catalog', () => {
  it('prices every funnel product in cents', () => {
    expect(PRODUCTS['book-shipping'].amount).toBe(595);
    expect(PRODUCTS['order-bump'].amount).toBe(4700);
    expect(PRODUCTS['mastery'].amount).toBe(750000);
    expect(PRODUCTS['convention-regular'].amount).toBe(99700);
    expect(PRODUCTS['convention-vip'].amount).toBe(149700);
    expect(PRODUCTS['course'].amount).toBe(49700);
  });

  it('sums checkout to shipping only when the bump is off', () => {
    expect(checkoutAmountCents(false)).toBe(595);
  });

  it('adds the order bump when on', () => {
    expect(checkoutAmountCents(true)).toBe(595 + 4700);
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test -- src/lib/stripe.test.ts`
Expected: FAIL — `Cannot find module './stripe'` / exports undefined.

- [ ] **Step 7: Implement `src/lib/stripe.ts`**

```ts
import Stripe from 'stripe';

// Restricted key (rk_) in test mode first, live at launch. Never a raw sk_.
const secretKey = process.env.STRIPE_SECRET_KEY;

// Do NOT override apiVersion — the installed SDK pins the latest supported version.
export const stripe = new Stripe(secretKey ?? '');

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const CURRENCY = 'usd';

export type ProductKey =
  | 'book-shipping'
  | 'order-bump'
  | 'mastery'
  | 'convention-regular'
  | 'convention-vip'
  | 'course';

// Single source of truth for amounts (cents). The client never sends a price.
export const PRODUCTS: Record<ProductKey, { amount: number; label: string }> = {
  'book-shipping':      { amount: 595,    label: 'The 168 Game — Shipping & Handling' },
  'order-bump':         { amount: 4700,   label: 'Quick Start Implementation Guide' },
  'mastery':            { amount: 750000, label: 'Time Ownership Accelerator (6-Month)' },
  'convention-regular': { amount: 99700,  label: 'Convention — Regular Ticket' },
  'convention-vip':     { amount: 149700, label: 'Convention — VIP Ticket' },
  'course':             { amount: 49700,  label: 'On-Demand Mastery Course' },
};

export function checkoutAmountCents(orderBump: boolean): number {
  return PRODUCTS['book-shipping'].amount + (orderBump ? PRODUCTS['order-bump'].amount : 0);
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -- src/lib/stripe.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Create the recurring price for the installment plan (test mode)**

You are already logged in via `stripe login`. Run:
```bash
stripe products create --name "The 168 Game Convention — 3-Payment Plan"
# copy the returned product id (prod_...), then:
stripe prices create \
  --unit-amount 33233 \
  --currency usd \
  -d "recurring[interval]=month" \
  -d "product=prod_XXXX"
```
Copy the returned `price_...` id into `.env.local` as `STRIPE_CONVENTION_PLAN_PRICE_ID`.

- [ ] **Step 10: Populate `.env.local` with test values**

Add to `.env.local` (gitignored — never commit): the test publishable key `pk_test_51RqImuAPnj4h3W19...` (from `stripe config`), a **restricted test key** created at the [API keys page](https://dashboard.stripe.com/test/apikeys) with write access to Customers, PaymentIntents, SetupIntents, Products, Prices, Subscriptions, and read on Events/Webhooks; the `STRIPE_CONVENTION_PLAN_PRICE_ID` from Step 9; and `FUNNEL_SESSION_SECRET` from `openssl rand -hex 32`. Leave `STRIPE_WEBHOOK_SECRET` blank until Task 13.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json vitest.config.ts .env.example src/lib/stripe.ts src/lib/stripe.test.ts
git commit -m "feat(stripe): add SDK, test runner, and server product catalog"
```

---

### Task 2: Signed funnel-session cookie helper

**Files:**
- Create: `src/lib/funnel-session.ts`
- Test: `src/lib/funnel-session.test.ts`

**Interfaces:**
- Produces:
  - `interface FunnelSession { stripeCustomerId: string; paymentMethodId: string | null; ghlContactId: string | null; email: string; purchased: string[] }`
  - `FUNNEL_COOKIE = 'funnel_session'`
  - `serializeSession(s: FunnelSession): string` — returns `base64url(json).signature`
  - `parseSession(raw: string | undefined | null): FunnelSession | null` — verifies HMAC, returns null on tamper/missing
- Consumes: `process.env.FUNNEL_SESSION_SECRET`

- [ ] **Step 1: Write the failing tests**

`src/lib/funnel-session.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { serializeSession, parseSession, type FunnelSession } from './funnel-session';

const sample: FunnelSession = {
  stripeCustomerId: 'cus_123',
  paymentMethodId: 'pm_123',
  ghlContactId: 'ghl_123',
  email: 'a@b.com',
  purchased: ['mastery'],
};

beforeAll(() => {
  process.env.FUNNEL_SESSION_SECRET = 'test-secret-please-change';
});

describe('funnel session cookie', () => {
  it('round-trips a session through sign + verify', () => {
    const raw = serializeSession(sample);
    expect(parseSession(raw)).toEqual(sample);
  });

  it('rejects a tampered payload', () => {
    const raw = serializeSession(sample);
    const [body, sig] = raw.split('.');
    const tampered = Buffer.from(JSON.stringify({ ...sample, purchased: [] })).toString('base64url');
    expect(parseSession(`${tampered}.${sig}`)).toBeNull();
  });

  it('returns null for missing or malformed input', () => {
    expect(parseSession(undefined)).toBeNull();
    expect(parseSession('')).toBeNull();
    expect(parseSession('not-a-cookie')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/funnel-session.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/funnel-session.ts`**

```ts
import crypto from 'crypto';

export const FUNNEL_COOKIE = 'funnel_session';

export interface FunnelSession {
  stripeCustomerId: string;
  paymentMethodId: string | null;
  ghlContactId: string | null;
  email: string;
  purchased: string[];
}

function secret(): string {
  const s = process.env.FUNNEL_SESSION_SECRET;
  if (!s) throw new Error('FUNNEL_SESSION_SECRET is not set');
  return s;
}

function hmac(body: string): string {
  return crypto.createHmac('sha256', secret()).update(body).digest('base64url');
}

export function serializeSession(s: FunnelSession): string {
  const body = Buffer.from(JSON.stringify(s)).toString('base64url');
  return `${body}.${hmac(body)}`;
}

export function parseSession(raw: string | undefined | null): FunnelSession | null {
  if (!raw || !raw.includes('.')) return null;
  const [body, sig] = raw.split('.');
  if (!body || !sig) return null;
  const expected = hmac(body);
  // constant-time compare; lengths must match first
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as FunnelSession;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/lib/funnel-session.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/funnel-session.ts src/lib/funnel-session.test.ts
git commit -m "feat(stripe): add signed funnel-session cookie helper"
```

---

### Task 3: `/api/stripe/checkout` route — customer + PaymentIntent + GHL lead capture

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`
- Test: `src/app/api/stripe/checkout/route.test.ts`

**Interfaces:**
- Consumes: `stripe`, `isStripeConfigured`, `checkoutAmountCents` (Task 1); `serializeSession`, `FUNNEL_COOKIE` (Task 2); `isGHLConfigured`, `upsertContact` (`src/lib/ghl.ts`).
- Request body: `{ firstName, lastName, email, address?, city?, state?, zip?, country?, orderBump?: boolean }`
- Produces response: `{ clientSecret: string }` (200) or `{ errors }` (400) or `{ message }` (500).
- Side effect: sets `funnel_session` httpOnly cookie.

- [ ] **Step 1: Write the failing test (happy path + validation guard)**

`src/app/api/stripe/checkout/route.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const cookieStore = { set: vi.fn(), get: vi.fn() };
vi.mock('next/headers', () => ({ cookies: () => cookieStore }));
vi.mock('@/lib/ghl', () => ({
  isGHLConfigured: () => true,
  upsertContact: vi.fn(async () => 'ghl_contact_1'),
}));
vi.mock('@/lib/stripe', async (orig) => {
  const actual = await orig<typeof import('@/lib/stripe')>();
  return {
    ...actual,
    isStripeConfigured: () => true,
    stripe: {
      customers: {
        list: vi.fn(async () => ({ data: [] })),
        create: vi.fn(async () => ({ id: 'cus_1' })),
      },
      paymentIntents: {
        create: vi.fn(async () => ({ id: 'pi_1', client_secret: 'pi_1_secret' })),
      },
    },
  };
});

import { POST } from './route';
import { stripe } from '@/lib/stripe';

function req(body: unknown) {
  return new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/stripe/checkout', () => {
  it('creates a PaymentIntent for the correct amount and sets the session cookie', async () => {
    const res = await POST(req({ firstName: 'Jane', lastName: 'Doe', email: 'j@d.com', orderBump: true }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ clientSecret: 'pi_1_secret' });
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5295, currency: 'usd', customer: 'cus_1', setup_future_usage: 'off_session' })
    );
    // no payment_method_types passed
    expect(stripe.paymentIntents.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ payment_method_types: expect.anything() })
    );
    expect(cookieStore.set).toHaveBeenCalled();
  });

  it('rejects invalid contact info', async () => {
    const res = await POST(req({ firstName: 'J', lastName: '', email: 'nope' }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/app/api/stripe/checkout/route.test.ts`
Expected: FAIL — route not found.

- [ ] **Step 3: Implement `src/app/api/stripe/checkout/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe, isStripeConfigured, checkoutAmountCents, CURRENCY } from '@/lib/stripe';
import { serializeSession, FUNNEL_COOKIE } from '@/lib/funnel-session';
import { isGHLConfigured, upsertContact } from '@/lib/ghl';

export const runtime = 'nodejs';

interface Body {
  firstName: string; lastName: string; email: string;
  address?: string; city?: string; state?: string; zip?: string; country?: string;
  orderBump?: boolean;
}

function validate(b: Body) {
  const errors: Record<string, string> = {};
  if (!b.firstName || b.firstName.trim().length < 2) errors.firstName = 'First name required';
  if (!b.lastName || b.lastName.trim().length < 2) errors.lastName = 'Last name required';
  if (!b.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) errors.email = 'Valid email required';
  return errors;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const errors = validate(body);
    if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

    if (!isStripeConfigured()) {
      console.error('Stripe not configured');
      return NextResponse.json({ message: 'Payment temporarily unavailable.' }, { status: 500 });
    }

    const email = body.email.trim().toLowerCase();
    const orderBump = Boolean(body.orderBump);

    // 1. GHL lead capture (best-effort — never blocks payment).
    let ghlContactId: string | null = null;
    if (isGHLConfigured()) {
      try {
        const tags = ['funnel-checkout', 'book-order', '168-game', 'contact-form'];
        if (orderBump) tags.push('order-bump-quickstart');
        ghlContactId = await upsertContact({
          firstName: body.firstName, lastName: body.lastName, email,
          address1: body.address, city: body.city, state: body.state,
          postalCode: body.zip, country: body.country,
          tags, source: 'Funnel Checkout — Free Book',
        });
      } catch (err) {
        console.error('GHL lead capture failed (best-effort):', err);
      }
    }

    // 2. Reuse an existing Stripe customer for this email, else create one.
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0]
      ?? await stripe.customers.create({
        email,
        name: `${body.firstName.trim()} ${body.lastName.trim()}`,
        address: body.address
          ? { line1: body.address, city: body.city, state: body.state, postal_code: body.zip, country: 'US' }
          : undefined,
      });

    // 3. PaymentIntent that charges shipping (+bump) and saves the card.
    const pi = await stripe.paymentIntents.create({
      amount: checkoutAmountCents(orderBump),
      currency: CURRENCY,
      customer: customer.id,
      setup_future_usage: 'off_session',
      metadata: { ghlContactId: ghlContactId ?? '', email, step: 'book', orderBump: String(orderBump) },
      // No payment_method_types — dynamic payment methods.
    });

    // 4. Persist funnel state in a signed httpOnly cookie.
    const cookie = serializeSession({
      stripeCustomerId: customer.id,
      paymentMethodId: null,
      ghlContactId,
      email,
      purchased: [],
    });
    (await cookies()).set(FUNNEL_COOKIE, cookie, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 2,
    });

    return NextResponse.json({ clientSecret: pi.client_secret }, { status: 200 });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/app/api/stripe/checkout/route.test.ts`
Expected: PASS (2 tests). If `cookies()` is awaited in the route, ensure the mock's `set` is still asserted (it is).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/stripe/checkout
git commit -m "feat(stripe): add checkout route (customer + PaymentIntent + GHL capture)"
```

---

### Task 4: `/api/stripe/save-session` route — persist saved card after confirm

**Files:**
- Create: `src/app/api/stripe/save-session/route.ts`
- Test: `src/app/api/stripe/save-session/route.test.ts`

**Interfaces:**
- Consumes: `stripe` (Task 1); `parseSession`, `serializeSession`, `FUNNEL_COOKIE` (Task 2).
- Request body: `{ paymentIntentId: string }`
- Produces response: `{ ok: true }` (200) or `{ message }` (400/500).
- Side effect: writes `paymentMethodId` into the cookie; sets customer default PM.

- [ ] **Step 1: Write the failing test**

`src/app/api/stripe/save-session/route.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serializeSession } from '@/lib/funnel-session';

process.env.FUNNEL_SESSION_SECRET = 'test-secret';
const validCookie = serializeSession({
  stripeCustomerId: 'cus_1', paymentMethodId: null, ghlContactId: 'g1', email: 'a@b.com', purchased: [],
});
const cookieStore = { get: vi.fn(() => ({ value: validCookie })), set: vi.fn() };
vi.mock('next/headers', () => ({ cookies: () => cookieStore }));
vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: { retrieve: vi.fn(async () => ({ id: 'pi_1', customer: 'cus_1', payment_method: 'pm_9', status: 'succeeded' })) },
    customers: { update: vi.fn(async () => ({})) },
  },
  isStripeConfigured: () => true,
}));

import { POST } from './route';
import { stripe } from '@/lib/stripe';

const req = (b: unknown) => new Request('http://localhost', { method: 'POST', body: JSON.stringify(b) });
beforeEach(() => vi.clearAllMocks());

describe('POST /api/stripe/save-session', () => {
  it('stores the payment method and sets it as customer default', async () => {
    const res = await POST(req({ paymentIntentId: 'pi_1' }));
    expect(res.status).toBe(200);
    expect(stripe.customers.update).toHaveBeenCalledWith('cus_1', {
      invoice_settings: { default_payment_method: 'pm_9' },
    });
    expect(cookieStore.set).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/app/api/stripe/save-session/route.test.ts`
Expected: FAIL — route not found.

- [ ] **Step 3: Implement `src/app/api/stripe/save-session/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { parseSession, serializeSession, FUNNEL_COOKIE } from '@/lib/funnel-session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { paymentIntentId } = (await request.json()) as { paymentIntentId?: string };
    if (!paymentIntentId) return NextResponse.json({ message: 'Missing paymentIntentId' }, { status: 400 });

    const jar = await cookies();
    const session = parseSession(jar.get(FUNNEL_COOKIE)?.value);
    if (!session) return NextResponse.json({ message: 'No funnel session' }, { status: 400 });

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const paymentMethodId = typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id;
    if (pi.status !== 'succeeded' || !paymentMethodId) {
      return NextResponse.json({ message: 'Payment not completed' }, { status: 400 });
    }

    // Make the saved card the customer default so installments and upsells use it.
    await stripe.customers.update(session.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    jar.set(FUNNEL_COOKIE, serializeSession({ ...session, paymentMethodId }), {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 2,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('save-session error:', error);
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/app/api/stripe/save-session/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/stripe/save-session
git commit -m "feat(stripe): persist saved card + set customer default after checkout"
```

---

### Task 5: `/api/stripe/upsell` route — one-click charge + 3-DS finalize

**Files:**
- Create: `src/app/api/stripe/upsell/route.ts`
- Test: `src/app/api/stripe/upsell/route.test.ts`

**Interfaces:**
- Consumes: `stripe`, `PRODUCTS`, `CURRENCY`, `type ProductKey` (Task 1); `parseSession`, `serializeSession`, `FUNNEL_COOKIE` (Task 2).
- Request body (create): `{ product: ProductKey }`
- Request body (finalize after 3-DS): `{ finalizePaymentIntentId: string }`
- Produces response: `{ status: 'succeeded' }` | `{ status: 'requires_action', clientSecret }` | `{ status: 'failed', message }` (200 for all business outcomes; 400 for missing session / already purchased).
- Upsell products allowed: `mastery`, `course`, `convention-regular`, `convention-vip`.

- [ ] **Step 1: Write the failing tests**

`src/app/api/stripe/upsell/route.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serializeSession } from '@/lib/funnel-session';

process.env.FUNNEL_SESSION_SECRET = 'test-secret';
let cookieValue = serializeSession({
  stripeCustomerId: 'cus_1', paymentMethodId: 'pm_1', ghlContactId: 'g1', email: 'a@b.com', purchased: [],
});
const cookieStore = { get: vi.fn(() => ({ value: cookieValue })), set: vi.fn((_n, v) => { cookieValue = v; }) };
vi.mock('next/headers', () => ({ cookies: () => cookieStore }));

const create = vi.fn(async () => ({ id: 'pi_up', status: 'succeeded', client_secret: 's', metadata: { product: 'course' } }));
vi.mock('@/lib/stripe', async (orig) => {
  const actual = await orig<typeof import('@/lib/stripe')>();
  return { ...actual, stripe: { paymentIntents: { create, retrieve: vi.fn() } } };
});

import { POST } from './route';
const req = (b: unknown) => new Request('http://localhost', { method: 'POST', body: JSON.stringify(b) });
beforeEach(() => { vi.clearAllMocks(); cookieValue = serializeSession({ stripeCustomerId: 'cus_1', paymentMethodId: 'pm_1', ghlContactId: 'g1', email: 'a@b.com', purchased: [] }); });

describe('POST /api/stripe/upsell', () => {
  it('charges the saved card on-session for the catalog amount', async () => {
    const res = await POST(req({ product: 'course' }));
    expect(await res.json()).toEqual({ status: 'succeeded' });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 49700, currency: 'usd', customer: 'cus_1', payment_method: 'pm_1', confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      }),
      expect.objectContaining({ idempotencyKey: 'cus_1:course' }),
    );
  });

  it('blocks a product that was already purchased', async () => {
    cookieValue = serializeSession({ stripeCustomerId: 'cus_1', paymentMethodId: 'pm_1', ghlContactId: 'g1', email: 'a@b.com', purchased: ['course'] });
    const res = await POST(req({ product: 'course' }));
    expect(res.status).toBe(409);
  });

  it('rejects an unknown / non-upsell product', async () => {
    const res = await POST(req({ product: 'book-shipping' }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/app/api/stripe/upsell/route.test.ts`
Expected: FAIL — route not found.

- [ ] **Step 3: Implement `src/app/api/stripe/upsell/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe, PRODUCTS, CURRENCY, type ProductKey } from '@/lib/stripe';
import { parseSession, serializeSession, FUNNEL_COOKIE, type FunnelSession } from '@/lib/funnel-session';

export const runtime = 'nodejs';

const UPSELL_PRODUCTS: ProductKey[] = ['mastery', 'course', 'convention-regular', 'convention-vip'];

const cookieOpts = {
  httpOnly: true, sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 2,
};

async function markPurchased(session: FunnelSession, product: string) {
  const jar = await cookies();
  const next = { ...session, purchased: [...new Set([...session.purchased, product])] };
  jar.set(FUNNEL_COOKIE, serializeSession(next), cookieOpts);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { product?: ProductKey; finalizePaymentIntentId?: string };
    const jar = await cookies();
    const session = parseSession(jar.get(FUNNEL_COOKIE)?.value);
    if (!session || !session.paymentMethodId) {
      return NextResponse.json({ status: 'failed', message: 'No saved card on file.' }, { status: 400 });
    }

    // Finalize branch: called by the client after completing a 3-DS challenge.
    if (body.finalizePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(body.finalizePaymentIntentId);
      if (pi.status === 'succeeded') {
        await markPurchased(session, String(pi.metadata.product ?? ''));
        return NextResponse.json({ status: 'succeeded' }, { status: 200 });
      }
      return NextResponse.json({ status: 'failed', message: 'Payment not completed.' }, { status: 200 });
    }

    // Create branch.
    const product = body.product;
    if (!product || !UPSELL_PRODUCTS.includes(product)) {
      return NextResponse.json({ status: 'failed', message: 'Unknown product.' }, { status: 400 });
    }
    if (session.purchased.includes(product)) {
      return NextResponse.json({ status: 'failed', message: 'Already purchased.' }, { status: 409 });
    }

    const pi = await stripe.paymentIntents.create(
      {
        amount: PRODUCTS[product].amount,
        currency: CURRENCY,
        customer: session.stripeCustomerId,
        payment_method: session.paymentMethodId,
        confirm: true,
        // On-session: buyer is present, so 3-DS can complete. No redirects (server-side confirm).
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        metadata: { ghlContactId: session.ghlContactId ?? '', product },
      },
      { idempotencyKey: `${session.stripeCustomerId}:${product}` },
    );

    if (pi.status === 'succeeded') {
      await markPurchased(session, product);
      return NextResponse.json({ status: 'succeeded' }, { status: 200 });
    }
    if (pi.status === 'requires_action') {
      return NextResponse.json({ status: 'requires_action', clientSecret: pi.client_secret }, { status: 200 });
    }
    return NextResponse.json({ status: 'failed', message: 'Payment could not be completed.' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment failed.';
    console.error('upsell error:', error);
    return NextResponse.json({ status: 'failed', message }, { status: 200 });
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/app/api/stripe/upsell/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/stripe/upsell
git commit -m "feat(stripe): add one-click upsell charge route with 3-DS finalize"
```

---

### Task 6: `/api/stripe/installment-plan` route — convention 3-payment subscription

**Files:**
- Create: `src/app/api/stripe/installment-plan/route.ts`
- Test: `src/app/api/stripe/installment-plan/route.test.ts`

**Interfaces:**
- Consumes: `stripe` (Task 1); `parseSession`, `serializeSession`, `FUNNEL_COOKIE` (Task 2); `process.env.STRIPE_CONVENTION_PLAN_PRICE_ID`.
- Request body: `{}` (product is fixed: `convention-plan`).
- Produces response: `{ status: 'active' }` | `{ status: 'requires_action', clientSecret }` | `{ status: 'failed', message }`.

- [ ] **Step 1: Write the failing test**

`src/app/api/stripe/installment-plan/route.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serializeSession } from '@/lib/funnel-session';

process.env.FUNNEL_SESSION_SECRET = 'test-secret';
process.env.STRIPE_CONVENTION_PLAN_PRICE_ID = 'price_plan';
const cookieValue = serializeSession({
  stripeCustomerId: 'cus_1', paymentMethodId: 'pm_1', ghlContactId: 'g1', email: 'a@b.com', purchased: [],
});
const cookieStore = { get: vi.fn(() => ({ value: cookieValue })), set: vi.fn() };
vi.mock('next/headers', () => ({ cookies: () => cookieStore }));

const create = vi.fn(async () => ({
  id: 'sub_sched_1',
  subscription: { latest_invoice: { payment_intent: { status: 'succeeded', client_secret: 's' } } },
}));
vi.mock('@/lib/stripe', () => ({ stripe: { subscriptionSchedules: { create } } }));

import { POST } from './route';
const req = () => new Request('http://localhost', { method: 'POST', body: '{}' });
beforeEach(() => vi.clearAllMocks());

describe('POST /api/stripe/installment-plan', () => {
  it('creates a 3-iteration subscription schedule on the saved card', async () => {
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'active' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_1',
      end_behavior: 'cancel',
    }));
    const arg = create.mock.calls[0][0];
    expect(arg.phases[0].iterations).toBe(3);
    expect(arg.phases[0].items[0].price).toBe('price_plan');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/app/api/stripe/installment-plan/route.test.ts`
Expected: FAIL — route not found.

- [ ] **Step 3: Implement `src/app/api/stripe/installment-plan/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { parseSession, FUNNEL_COOKIE } from '@/lib/funnel-session';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const priceId = process.env.STRIPE_CONVENTION_PLAN_PRICE_ID;
    if (!priceId) return NextResponse.json({ status: 'failed', message: 'Plan not configured.' }, { status: 500 });

    const jar = await cookies();
    const session = parseSession(jar.get(FUNNEL_COOKIE)?.value);
    if (!session || !session.paymentMethodId) {
      return NextResponse.json({ status: 'failed', message: 'No saved card on file.' }, { status: 400 });
    }

    // 3 monthly charges of $332.33 on the saved card, then auto-cancel.
    const schedule = await stripe.subscriptionSchedules.create({
      customer: session.stripeCustomerId,
      start_date: 'now',
      end_behavior: 'cancel',
      default_settings: {
        default_payment_method: session.paymentMethodId,
        collection_method: 'charge_automatically',
      },
      phases: [{ items: [{ price: priceId, quantity: 1 }], iterations: 3 }],
      metadata: { ghlContactId: session.ghlContactId ?? '', product: 'convention-plan' },
      expand: ['subscription.latest_invoice.payment_intent'],
    });

    const sub = schedule.subscription;
    const pi =
      sub && typeof sub !== 'string' && sub.latest_invoice && typeof sub.latest_invoice !== 'string'
        ? sub.latest_invoice.payment_intent
        : null;

    if (pi && typeof pi !== 'string' && pi.status === 'requires_action') {
      return NextResponse.json({ status: 'requires_action', clientSecret: pi.client_secret }, { status: 200 });
    }
    return NextResponse.json({ status: 'active' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start the plan.';
    console.error('installment-plan error:', error);
    return NextResponse.json({ status: 'failed', message }, { status: 200 });
  }
}
```

> **Implementer note:** confirm against the [Subscription Schedules docs](https://docs.stripe.com/billing/subscriptions/subscription-schedules) that `expand: ['subscription.latest_invoice.payment_intent']` returns the first invoice's PI on `create`. If the shape differs, retrieve `schedule.subscription` with that expand and read `latest_invoice.payment_intent`. The test mocks this shape, so update the mock to match whatever the live API returns.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/app/api/stripe/installment-plan/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/stripe/installment-plan
git commit -m "feat(stripe): add convention 3-payment installment subscription route"
```

---

### Task 7: `/api/stripe/webhook` route — signature verify + GHL fulfillment

**Files:**
- Create: `src/app/api/stripe/webhook/route.ts`
- Modify: `src/lib/ghl.ts` (add `addNote` reuse is fine; no change needed unless a helper is missing)
- Test: `src/app/api/stripe/webhook/route.test.ts`

**Interfaces:**
- Consumes: `stripe` (Task 1); `addNote` (`src/lib/ghl.ts`); `process.env.STRIPE_WEBHOOK_SECRET`.
- Reads raw body + `stripe-signature` header.
- Produces response: `{ received: true }` (200) or `400` on bad signature.

- [ ] **Step 1: Write the failing test**

`src/app/api/stripe/webhook/route.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const addNote = vi.fn(async () => {});
vi.mock('@/lib/ghl', () => ({ addNote }));

const constructEvent = vi.fn();
vi.mock('@/lib/stripe', () => ({ stripe: { webhooks: { constructEvent } } }));

import { POST } from './route';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

const req = (sig: string | null) =>
  new Request('http://localhost', { method: 'POST', headers: sig ? { 'stripe-signature': sig } : {}, body: '{}' });

beforeEach(() => vi.clearAllMocks());

describe('POST /api/stripe/webhook', () => {
  it('adds a GHL note on payment_intent.succeeded', async () => {
    constructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { amount: 49700, metadata: { ghlContactId: 'g1', product: 'course' } } },
    });
    const res = await POST(req('good'));
    expect(res.status).toBe(200);
    expect(addNote).toHaveBeenCalledWith('g1', expect.stringContaining('497'));
  });

  it('rejects a bad signature', async () => {
    constructEvent.mockImplementation(() => { throw new Error('bad sig'); });
    const res = await POST(req('bad'));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/app/api/stripe/webhook/route.test.ts`
Expected: FAIL — route not found.

- [ ] **Step 3: Implement `src/app/api/stripe/webhook/route.ts`**

```ts
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { addNote } from '@/lib/ghl';

export const runtime = 'nodejs';

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

async function noteFromMetadata(meta: Stripe.Metadata | undefined, amount: number, verb: string) {
  const ghlContactId = meta?.ghlContactId;
  const product = meta?.product ?? 'purchase';
  if (!ghlContactId) return;
  try {
    await addNote(ghlContactId, `**Stripe ${verb}** — ${dollars(amount)} for ${product}`);
  } catch (err) {
    console.error('GHL note from webhook failed (best-effort):', err);
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get('stripe-signature');
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? '', secret ?? '');
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await noteFromMetadata(pi.metadata, pi.amount, 'payment');
      break;
    }
    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice;
      await noteFromMetadata(inv.subscription_details?.metadata, inv.amount_paid, 'installment paid');
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      await noteFromMetadata(inv.subscription_details?.metadata, inv.amount_due, 'installment FAILED');
      break;
    }
    case 'charge.refunded': {
      const ch = event.data.object as Stripe.Charge;
      await noteFromMetadata(ch.metadata, ch.amount_refunded, 'refund');
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
```

> **Implementer note:** the metadata path for `invoice.paid` (`subscription_details?.metadata`) depends on the API shape — confirm the schedule's metadata propagates to invoices; if not, set `metadata` on `default_settings`/subscription in Task 6 so invoices carry `ghlContactId`. Update the test mock to match.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/app/api/stripe/webhook/route.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/stripe/webhook
git commit -m "feat(stripe): add signature-verified webhook that posts payments to GHL"
```

---

### Task 8: Client charge helpers + Stripe provider

**Files:**
- Create: `src/lib/stripe-client.ts` (browser `loadStripe` singleton)
- Create: `src/lib/funnel-payments-client.ts` (framework-free charge helpers)
- Create: `src/components/funnel/StripeProvider.tsx`
- Test: `src/lib/funnel-payments-client.test.ts`

**Interfaces:**
- Produces:
  - `getStripe(): Promise<Stripe | null>` (browser singleton from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
  - `chargeUpsell(product: string, stripe: Stripe): Promise<{ ok: boolean; error?: string }>` — POSTs to `/api/stripe/upsell`, runs `handleNextAction` on `requires_action`, then finalizes.
  - `startInstallmentPlan(stripe: Stripe): Promise<{ ok: boolean; error?: string }>` — POSTs to `/api/stripe/installment-plan`, confirms first invoice if needed.
  - `<StripeProvider amount currency children>` — wraps children in `<Elements>` (deferred mode).

- [ ] **Step 1: Write the failing tests**

`src/lib/funnel-payments-client.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chargeUpsell } from './funnel-payments-client';

const fakeStripe = { handleNextAction: vi.fn() } as any;
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', vi.fn()); });

describe('chargeUpsell', () => {
  it('resolves ok on an immediate success', async () => {
    (fetch as any).mockResolvedValueOnce({ json: async () => ({ status: 'succeeded' }) });
    expect(await chargeUpsell('course', fakeStripe)).toEqual({ ok: true });
  });

  it('handles a 3-DS challenge then finalizes', async () => {
    (fetch as any)
      .mockResolvedValueOnce({ json: async () => ({ status: 'requires_action', clientSecret: 'cs_1' }) })
      .mockResolvedValueOnce({ json: async () => ({ status: 'succeeded' }) });
    fakeStripe.handleNextAction.mockResolvedValueOnce({ paymentIntent: { id: 'pi_1', status: 'succeeded' } });

    const out = await chargeUpsell('mastery', fakeStripe);
    expect(fakeStripe.handleNextAction).toHaveBeenCalledWith({ clientSecret: 'cs_1' });
    expect(out).toEqual({ ok: true });
  });

  it('surfaces a decline', async () => {
    (fetch as any).mockResolvedValueOnce({ json: async () => ({ status: 'failed', message: 'Card declined' }) });
    expect(await chargeUpsell('course', fakeStripe)).toEqual({ ok: false, error: 'Card declined' });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/funnel-payments-client.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/stripe-client.ts`**

```ts
import { loadStripe, type Stripe } from '@stripe/stripe-js';

let promise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!promise) {
    promise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
  }
  return promise;
}
```

- [ ] **Step 4: Implement `src/lib/funnel-payments-client.ts`**

```ts
import type { Stripe } from '@stripe/stripe-js';

async function postJSON(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json() as Promise<{ status: string; clientSecret?: string; message?: string }>;
}

export async function chargeUpsell(product: string, stripe: Stripe): Promise<{ ok: boolean; error?: string }> {
  const r = await postJSON('/api/stripe/upsell', { product });
  if (r.status === 'succeeded') return { ok: true };
  if (r.status === 'requires_action' && r.clientSecret) {
    const { error, paymentIntent } = await stripe.handleNextAction({ clientSecret: r.clientSecret });
    if (error || paymentIntent?.status !== 'succeeded') {
      return { ok: false, error: error?.message ?? 'Authentication failed.' };
    }
    const f = await postJSON('/api/stripe/upsell', { finalizePaymentIntentId: paymentIntent.id });
    return f.status === 'succeeded' ? { ok: true } : { ok: false, error: f.message ?? 'Payment failed.' };
  }
  return { ok: false, error: r.message ?? 'Payment failed.' };
}

export async function startInstallmentPlan(stripe: Stripe): Promise<{ ok: boolean; error?: string }> {
  const r = await postJSON('/api/stripe/installment-plan', {});
  if (r.status === 'active') return { ok: true };
  if (r.status === 'requires_action' && r.clientSecret) {
    const { error, paymentIntent } = await stripe.handleNextAction({ clientSecret: r.clientSecret });
    if (error || paymentIntent?.status !== 'succeeded') {
      return { ok: false, error: error?.message ?? 'Authentication failed.' };
    }
    return { ok: true };
  }
  return { ok: false, error: r.message ?? 'Could not start the plan.' };
}
```

- [ ] **Step 5: Implement `src/components/funnel/StripeProvider.tsx`**

```tsx
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe-client';

const stripePromise = getStripe();

export default function StripeProvider({
  amount, children,
}: {
  amount: number;
  children: React.ReactNode;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        amount,
        currency: 'usd',
        setupFutureUsage: 'off_session',
        appearance: { theme: 'night', labels: 'floating' },
      }}
    >
      {children}
    </Elements>
  );
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -- src/lib/funnel-payments-client.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/stripe-client.ts src/lib/funnel-payments-client.ts src/lib/funnel-payments-client.test.ts src/components/funnel/StripeProvider.tsx
git commit -m "feat(stripe): add browser Stripe singleton, charge helpers, Elements provider"
```

---

### Task 9: Wire the checkout page to the Payment Element

**Files:**
- Modify: `src/app/(funnel)/free-book/checkout/page.tsx`

**Interfaces:**
- Consumes: `StripeProvider` (Task 8), `checkoutAmountCents` (Task 1), `chargeUpsell` not used here; uses `useStripe`, `useElements`, `PaymentElement` from `@stripe/react-stripe-js`; posts to `/api/stripe/checkout` + `/api/stripe/save-session`.
- This task is **verified manually** (Task 13) — no unit test (Stripe.js needs a browser).

- [ ] **Step 1: Split the page into a provider shell + inner form**

Wrap the existing page content in `StripeProvider` and move the form into an inner component so it can call `useStripe()/useElements()`. At the top of `checkout/page.tsx`:
```tsx
'use client';

import { useMemo, useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import StripeProvider from '@/components/funnel/StripeProvider';
import { checkoutAmountCents } from '@/lib/stripe';
// ...keep existing imports (motion, icons, Image, Link, useRouter, Input, OrderBump, FunnelCTA)

export default function CheckoutPage() {
  const [orderBump, setOrderBump] = useState(false);
  const amount = useMemo(() => checkoutAmountCents(orderBump), [orderBump]);
  return (
    <StripeProvider amount={amount}>
      <CheckoutForm orderBump={orderBump} setOrderBump={setOrderBump} />
    </StripeProvider>
  );
}
```

- [ ] **Step 2: Replace the fake card inputs with `<PaymentElement>`**

In the new `CheckoutForm`, delete the three `Input`s for `cardNumber`, `expiry`, `cvc` and the matching `formData` keys. Replace the "Payment Information" block's inputs with:
```tsx
<PaymentElement options={{ layout: 'tabs' }} />
```
Keep the contact + shipping `Input`s and the `OrderBump` exactly as they are.

- [ ] **Step 3: Rewrite `handleSubmit` to run the real payment**

```tsx
const stripe = useStripe();
const elements = useElements();
const router = useRouter();
const [error, setError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!stripe || !elements || isSubmitting) return;
  setIsSubmitting(true);
  setError(null);

  const { error: submitError } = await elements.submit();
  if (submitError) { setError(submitError.message ?? 'Check your card details.'); setIsSubmitting(false); return; }

  // Keep the existing sessionStorage writes for the thank-you summary.
  const orderItems = [{ name: 'The 168 Game (Book)', price: 0, note: 'Free + $5.95 shipping' }];
  if (orderBump) orderItems.push({ name: 'Quick Start Implementation Guide', price: 47, note: '' });
  sessionStorage.setItem('funnelCustomer', JSON.stringify({
    firstName: formData.firstName, lastName: formData.lastName, email: formData.email,
    address: formData.address, city: formData.city, state: formData.state, zip: formData.zip, country: formData.country,
  }));
  sessionStorage.setItem('funnelOrder', JSON.stringify({ items: orderItems, shipping: 5.95, total: orderBump ? 52.95 : 5.95 }));

  const res = await fetch('/api/stripe/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...formData, orderBump }),
  });
  const data = await res.json();
  if (!res.ok || !data.clientSecret) { setError(data.message ?? 'Could not start payment.'); setIsSubmitting(false); return; }

  const { error: payError, paymentIntent } = await stripe.confirmPayment({
    elements, clientSecret: data.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/free-book/mastery` },
    redirect: 'if_required',
  });
  if (payError) { setError(payError.message ?? 'Payment failed.'); setIsSubmitting(false); return; }

  await fetch('/api/stripe/save-session', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId: paymentIntent!.id }),
  });
  router.push('/free-book/mastery');
};
```
Render `{error && <p className="text-red-400 text-sm">{error}</p>}` above the submit button. Remove `cardNumber/expiry/cvc` from `formData`'s initial state.

- [ ] **Step 4: Verify it builds**

Run: `npm run build`
Expected: compiles with no type errors. (Full payment behavior is checked in Task 13.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/(funnel)/free-book/checkout/page.tsx"
git commit -m "feat(stripe): collect + save card on checkout via Payment Element"
```

---

### Task 10: One-click upsell hook + wire mastery / course / convention pages

**Files:**
- Create: `src/hooks/useUpsellCharge.ts`
- Modify: `src/app/(funnel)/free-book/mastery/page.tsx`
- Modify: `src/app/(funnel)/free-book/course/page.tsx`
- Modify: `src/app/(funnel)/free-book/convention/page.tsx`

**Interfaces:**
- Consumes: `chargeUpsell`, `getStripe` (Task 8).
- Produces: `useUpsellCharge()` → `{ run(product, onSuccess): Promise<void>, isLoading: boolean, error: string | null }`.
- Verified manually (Task 13).

- [ ] **Step 1: Implement `src/hooks/useUpsellCharge.ts`**

```ts
'use client';

import { useState } from 'react';
import { getStripe } from '@/lib/stripe-client';
import { chargeUpsell } from '@/lib/funnel-payments-client';

export function useUpsellCharge() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(product: string, onSuccess: () => void) {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    const stripe = await getStripe();
    if (!stripe) { setError('Payment unavailable.'); setIsLoading(false); return; }
    const { ok, error } = await chargeUpsell(product, stripe);
    if (ok) { onSuccess(); return; } // leave loading true through the redirect
    setError(error ?? 'Payment failed.');
    setIsLoading(false);
  }

  return { run, isLoading, error };
}
```

- [ ] **Step 2: Wire `mastery/page.tsx`**

Add `const { run, isLoading, error } = useUpsellCharge();` (import it). Replace `handleAccept` so it charges before routing, keeping the existing `sessionStorage` write:
```tsx
const handleAccept = () => {
  run('mastery', () => {
    const order = JSON.parse(sessionStorage.getItem('funnelOrder') || '{}');
    order.items = [...(order.items || []), { name: 'Time Ownership Accelerator (6-Month)', price: 7500, note: 'Paid in full' }];
    order.total = (order.total || 0) + 7500;
    sessionStorage.setItem('funnelOrder', JSON.stringify(order));
    router.push('/free-book/convention');
  });
};
```
Both `FunnelCTA` accept buttons: pass `disabled={isLoading}` and label `{isLoading ? 'Processing…' : 'YES! Add This To My Order'}`. Remove the `'full' | 'payments'` parameter (mastery is a single $7,500 charge) and **delete the two "Payment plans available" lines**. Render `{error && <p className="text-red-400 text-sm mt-3">{error}</p>}` near each button.

- [ ] **Step 3: Wire `course/page.tsx`**

Import the hook (`import { useUpsellCharge } from '@/hooks/useUpsellCharge';`), add `const { run, isLoading, error } = useUpsellCharge();`, and replace `handleAccept`:
```tsx
const handleAccept = () => {
  run('course', () => {
    const order = JSON.parse(sessionStorage.getItem('funnelOrder') || '{}');
    order.items = [...(order.items || []), { name: 'On-Demand Mastery Course', price: 497, note: '' }];
    order.total = (order.total || 0) + 497;
    sessionStorage.setItem('funnelOrder', JSON.stringify(order));
    router.push('/free-book/convention');
  });
};
```
`handleDecline` (→ `/free-book/convention`) is unchanged. Give both accept `FunnelCTA`s `disabled={isLoading}` and render `{error && <p className="text-red-400 text-sm mt-3">{error}</p>}` near each.

- [ ] **Step 4: Wire `convention/page.tsx` — replace external links with one-click**

Remove every `href="https://buy.stripe.com/..."` (and `target`/`rel`) from the `FunnelCTA`s and the two `TicketCard`s. Drive them with `onClick` instead:
```tsx
const { run, isLoading, error } = useUpsellCharge();
const buy = (product: 'convention-regular' | 'convention-vip', price: number, label: string) =>
  run(product, () => {
    const order = JSON.parse(sessionStorage.getItem('funnelOrder') || '{}');
    order.items = [...(order.items || []), { name: label, price, note: '' }];
    order.total = (order.total || 0) + price;
    sessionStorage.setItem('funnelOrder', JSON.stringify(order));
    router.push('/free-book/thank-you');
  });
```
Wire the Regular CTAs to `onClick={() => buy('convention-regular', 997, 'Convention — Regular Ticket')}` and VIP to `onClick={() => buy('convention-vip', 1497, 'Convention — VIP Ticket')}`, all `disabled={isLoading}`. `TicketCard` currently takes `href` — change it to accept an optional `onClick` + `disabled` (see Step 5). `handleDecline` → `/free-book/convention-plan` is unchanged. Add `useRouter` import if missing.

- [ ] **Step 5: Update `TicketCard` to support onClick**

In `src/components/funnel/TicketCard.tsx`, change the props from `href: string` to `onClick?: () => void; disabled?: boolean` and make the CTA a `<button onClick={onClick} disabled={disabled}>` instead of an anchor (keep all styling classes identical).

- [ ] **Step 6: Verify it builds**

Run: `npm run build`
Expected: compiles, no type errors, no remaining `buy.stripe.com` references (`grep -rn "buy.stripe.com" src` → no results).

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useUpsellCharge.ts "src/app/(funnel)/free-book/mastery/page.tsx" "src/app/(funnel)/free-book/course/page.tsx" "src/app/(funnel)/free-book/convention/page.tsx" src/components/funnel/TicketCard.tsx
git commit -m "feat(stripe): one-click upsell charges on mastery, course, convention"
```

---

### Task 11: Wire the convention installment plan page

**Files:**
- Modify: `src/app/(funnel)/free-book/convention-plan/page.tsx`

**Interfaces:**
- Consumes: `startInstallmentPlan`, `getStripe` (Task 8).
- Verified manually (Task 13).

- [ ] **Step 1: Wire the accept handler to the subscription route**

Add state + imports (`getStripe`, `startInstallmentPlan`). Replace `handleAccept`:
```tsx
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleAccept = async () => {
  if (isLoading) return;
  setIsLoading(true); setError(null);
  const stripe = await getStripe();
  if (!stripe) { setError('Payment unavailable.'); setIsLoading(false); return; }
  const { ok, error } = await startInstallmentPlan(stripe);
  if (!ok) { setError(error ?? 'Could not start the plan.'); setIsLoading(false); return; }
  const order = JSON.parse(sessionStorage.getItem('funnelOrder') || '{}');
  order.items = [...(order.items || []), { name: 'Convention Ticket (3-Payment Plan)', price: 997, note: '3 × $332.33' }];
  order.total = (order.total || 0) + 997;
  sessionStorage.setItem('funnelOrder', JSON.stringify(order));
  router.push('/free-book/thank-you');
};
```
Give both accept `FunnelCTA`s `disabled={isLoading}` and render `{error && <p className="text-red-400 text-sm">{error}</p>}`. `handleDecline` is unchanged.

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: compiles, no type errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(funnel)/free-book/convention-plan/page.tsx"
git commit -m "feat(stripe): start 3-payment subscription on convention-plan accept"
```

---

### Task 12: Remove the superseded lead-capture route + add a key-leak pre-commit hook

**Files:**
- Delete: `src/app/api/funnel-checkout/route.ts` (and its now-empty folder)
- Create: `.githooks/pre-commit`
- Modify: `package.json` (a `prepare` script to register the hook path)

**Interfaces:** none.

- [ ] **Step 1: Confirm nothing still calls the old route**

Run: `grep -rn "api/funnel-checkout" src`
Expected: no results (the checkout page now calls `/api/stripe/checkout`). If any remain, fix them first.

- [ ] **Step 2: Delete the old route**

```bash
git rm src/app/api/funnel-checkout/route.ts
```

- [ ] **Step 3: Add a pre-commit hook that blocks secret keys**

`.githooks/pre-commit`:
```bash
#!/bin/sh
if git diff --cached -U0 | grep -nE '(sk_live|sk_test|rk_live|rk_test|whsec_)[A-Za-z0-9]{6,}'; then
  echo "❌ Commit blocked: a Stripe secret/restricted/webhook key literal is staged."
  echo "   Move it to .env.local (gitignored) and retry."
  exit 1
fi
```
Then:
```bash
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```
Add to `package.json` scripts so clones pick it up: `"prepare": "git config core.hooksPath .githooks"`.

- [ ] **Step 4: Verify the hook fires**

Run: `echo "const k='sk_test_abcdef123456'" > /tmp/leak.ts && cp /tmp/leak.ts src/leak-check.ts && git add src/leak-check.ts && git commit -m "should fail"`
Expected: commit is **blocked**. Then clean up: `git reset src/leak-check.ts && rm src/leak-check.ts`.

- [ ] **Step 5: Commit**

```bash
git add .githooks/pre-commit package.json
git commit -m "chore(stripe): drop superseded funnel-checkout route; block key leaks pre-commit"
```

---

### Task 13: End-to-end test-mode runbook + go-live checklist

**Files:** none (verification + documentation task).

- [ ] **Step 1: Start the webhook listener and dev server**

In one terminal: `stripe listen --forward-to localhost:3000/api/stripe/webhook` — copy the `whsec_...` it prints into `.env.local` as `STRIPE_WEBHOOK_SECRET`. In another: `npm run dev`.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all unit tests PASS.

- [ ] **Step 3: Walk the happy path with a test card**

Go to `/free-book` → checkout. Use card `4242 4242 4242 4242`, any future expiry/CVC/ZIP, order bump ON. Verify: charge of **$52.95** appears in the [test dashboard](https://dashboard.stripe.com/test/payments), the customer has a **saved card**, and you land on `mastery`.

- [ ] **Step 4: Exercise each upsell**

Accept `mastery` ($7,500) → expect a one-click charge, land on `convention`. On `convention`, buy Regular ($997) → charge + land on `thank-you`. Re-run and take the `course` ($497) and `convention-plan` paths: the plan should create a **subscription schedule** with 3 upcoming invoices in the dashboard. Confirm the CLI listener logs `payment_intent.succeeded` / `invoice.paid` and that GHL contacts get the payment notes.

- [ ] **Step 5: Exercise 3-DS and decline**

Repeat checkout with the authentication card `4000 0025 0000 3155` (expect a 3-DS modal) and the decline card `4000 0000 0000 9995` (expect an inline error and no redirect).

- [ ] **Step 6: Go-live checklist (do NOT run charges live until approved)**

Document for the client: create **live-mode** restricted key + publishable key + a live webhook endpoint (`https://<domain>/api/stripe/webhook`, same event types) in the dashboard; recreate the $332.33 recurring price in **live mode** and update `STRIPE_CONVENTION_PLAN_PRICE_ID`; set all five env vars in Vercel (Production); redeploy; run one real low-value smoke charge and refund it; confirm the live webhook delivers. Then the funnel is live.

- [ ] **Step 7: Commit any doc notes (if created)**

```bash
git add -A && git commit -m "docs(stripe): add test-mode runbook results and go-live checklist" || echo "nothing to commit"
```

---

## Notes for the executor

- Work on branch `stripe-funnel-integration` (already created).
- The four upsell `sessionStorage` writes are intentionally preserved so the existing `thank-you` page keeps working unchanged.
- If a Stripe API shape differs from a test's mock (subscription schedule / invoice metadata are the likely spots — see the implementer notes in Tasks 6 and 7), fix the **mock** to match reality, not the assertion's intent.
- Never paste a real key into a file the hook scans; keys live only in `.env.local` and Vercel.
