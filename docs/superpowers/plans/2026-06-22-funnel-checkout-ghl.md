# Funnel Checkout → GHL Lead Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture every free-book funnel checkout submission into GoHighLevel as a contact, a pipeline opportunity, and an order note — without ever blocking the funnel.

**Architecture:** Extract the duplicated GHL logic into a shared `src/lib/ghl.ts` module; refactor the existing `contact` and `playbook` routes onto it (behavior-preserving); add a new `/api/funnel-checkout` route that upserts the contact, creates an opportunity in the "Book Ordered Pipeline → Ordered Book" stage, and adds an order note; wire the checkout page's submit handler to call that route best-effort (timeout-raced) before redirecting to the upsell.

**Tech Stack:** Next.js 16 (App Router) route handlers, React 19 client component, GHL/LeadConnector v2 REST API (`services.leadconnectorhq.com`, `Version: 2021-07-28`).

## Global Constraints

- **No test framework is configured** (per `CLAUDE.md`). Per-task verification is `npm run lint` and `npm run build` (the build performs the TypeScript typecheck). The feature is validated end-to-end by a live GHL smoke test in Task 5.
- **Never transmit payment data.** Card number, expiry, and CVC must never be included in any request body sent to the server or GHL.
- **Never block the funnel.** The checkout client must redirect to `/free-book/mastery` regardless of whether the GHL call succeeds, fails, or times out.
- **GHL API constants (verbatim):** base URL `https://services.leadconnectorhq.com`, header `Version: 2021-07-28`, auth `Authorization: Bearer ${process.env.GHL_API_KEY}`.
- **Env vars (verbatim):** `GHL_API_KEY`, `GHL_LOCATION_ID`, `GHL_FUNNEL_PIPELINE_ID` = `ahKfmeubC9KOOIBmPu2p`, `GHL_FUNNEL_PIPELINE_STAGE_ID` = `91280596-9065-4a4c-906b-4f72f075ad62`.
- **Behavior preservation:** the refactor of `contact` and `playbook` routes must not change their request payloads, tags, source strings, response messages, or status codes.

## File Structure

- `src/lib/ghl.ts` — **new.** Shared GHL helpers: `GHL_BASE_URL`, `isGHLConfigured`, `getGHLHeaders`, `upsertContact`, `createOpportunity`, `addNote`.
- `src/app/api/contact/route.ts` — **modify.** Use the shared lib; keep contact-specific `subjectLabels` / `subjectTags` / validation in the route.
- `src/app/api/playbook/route.ts` — **modify.** Use the shared lib.
- `src/app/api/funnel-checkout/route.ts` — **new.** The checkout capture endpoint.
- `src/components/funnel/FunnelCTA.tsx` — **modify.** Add an optional `disabled` prop.
- `src/app/(funnel)/free-book/checkout/page.tsx` — **modify.** Async submit that posts the lead, with `isSubmitting` state.
- `.env.example` — **new.** Documents all GHL env vars (no secrets).
- `.env.local` — **new (not committed).** Real credentials for the smoke test.

---

### Task 1: Shared `src/lib/ghl.ts` module + refactor existing routes

**Files:**
- Create: `src/lib/ghl.ts`
- Modify: `src/app/api/contact/route.ts`
- Modify: `src/app/api/playbook/route.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `export const GHL_BASE_URL: string`
  - `export function isGHLConfigured(): boolean`
  - `export function getGHLHeaders(): Record<string, string>`
  - `export interface UpsertContactInput { firstName: string; lastName: string; email: string; phone?: string; address1?: string; city?: string; state?: string; postalCode?: string; country?: string; tags: string[]; source: string }`
  - `export function upsertContact(input: UpsertContactInput): Promise<string>` (returns contactId)
  - `export interface CreateOpportunityInput { pipelineId: string; pipelineStageId: string; contactId: string; name: string; monetaryValue?: number; status?: string }`
  - `export function createOpportunity(input: CreateOpportunityInput): Promise<unknown | null>`
  - `export function addNote(contactId: string, body: string): Promise<void>`

- [ ] **Step 1: Create the shared module**

Create `src/lib/ghl.ts` with exactly this content:

```ts
// Shared GoHighLevel (GHL / LeadConnector v2) API helpers.
// Used by the contact, playbook, and funnel-checkout route handlers.

export const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

export function isGHLConfigured(): boolean {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

export function getGHLHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    'Content-Type': 'application/json',
    Version: '2021-07-28',
  };
}

export interface UpsertContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  tags: string[];
  source: string;
}

// Creates a contact, or updates the existing one when GHL reports a duplicate.
// Returns the contactId.
export async function upsertContact(input: UpsertContactInput): Promise<string> {
  const locationId = process.env.GHL_LOCATION_ID;

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = input.phone?.trim() || undefined;
  const address1 = input.address1?.trim() || undefined;
  const city = input.city?.trim() || undefined;
  const state = input.state?.trim() || undefined;
  const postalCode = input.postalCode?.trim() || undefined;
  const country = input.country?.trim() || undefined;

  const createRes = await fetch(`${GHL_BASE_URL}/contacts/`, {
    method: 'POST',
    headers: getGHLHeaders(),
    body: JSON.stringify({
      firstName,
      lastName,
      email: input.email.trim().toLowerCase(),
      phone,
      address1,
      city,
      state,
      postalCode,
      country,
      locationId,
      tags: input.tags,
      source: input.source,
    }),
  });

  if (createRes.ok) {
    const result = await createRes.json();
    return result.contact.id;
  }

  // GHL returns 400/422/409 for duplicate contacts with the existing
  // contactId in meta. Update that contact instead.
  const errorResult = await createRes.json().catch(() => null);

  if (errorResult?.meta?.contactId) {
    const contactId = errorResult.meta.contactId;
    await fetch(`${GHL_BASE_URL}/contacts/${contactId}`, {
      method: 'PUT',
      headers: getGHLHeaders(),
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        address1,
        city,
        state,
        postalCode,
        country,
        tags: input.tags,
      }),
    });
    return contactId;
  }

  throw new Error(
    `Failed to create GHL contact: ${createRes.status} ${JSON.stringify(errorResult)}`
  );
}

export interface CreateOpportunityInput {
  pipelineId: string;
  pipelineStageId: string;
  contactId: string;
  name: string;
  monetaryValue?: number;
  status?: string;
}

// Creates a pipeline opportunity. Returns the opportunity, or null on failure
// (logged, non-throwing) so callers never break on a deal-creation error.
export async function createOpportunity(
  input: CreateOpportunityInput
): Promise<unknown | null> {
  const locationId = process.env.GHL_LOCATION_ID;

  const res = await fetch(`${GHL_BASE_URL}/opportunities/`, {
    method: 'POST',
    headers: getGHLHeaders(),
    body: JSON.stringify({
      pipelineId: input.pipelineId,
      pipelineStageId: input.pipelineStageId,
      locationId,
      contactId: input.contactId,
      name: input.name,
      monetaryValue: input.monetaryValue,
      status: input.status ?? 'open',
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Failed to create GHL opportunity:', res.status, errorBody);
    return null;
  }

  const result = await res.json();
  return result.opportunity;
}

// Adds a note to a contact. Best-effort: logs on failure, never throws.
export async function addNote(contactId: string, body: string): Promise<void> {
  const res = await fetch(`${GHL_BASE_URL}/contacts/${contactId}/notes`, {
    method: 'POST',
    headers: getGHLHeaders(),
    body: JSON.stringify({ body }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Failed to add GHL note:', res.status, errorBody);
  }
}
```

- [ ] **Step 2: Refactor the contact route onto the shared lib**

Replace the entire contents of `src/app/api/contact/route.ts` with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import {
  isGHLConfigured,
  upsertContact,
  createOpportunity,
  addNote,
} from '@/lib/ghl';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Subject mapping for display labels and GHL tags
const subjectLabels: Record<string, string> = {
  'coaching-intensive': '1:1 Coaching Intensive',
  'coaching-basic': '1:1 Basic Coaching',
  'group-training': 'Group Training for Teams',
  'course': 'On-Demand Course',
  'speaking': 'Speaking Engagement',
  'media': 'Media/Press Inquiry',
  'other': 'General Question',
};

const subjectTags: Record<string, string[]> = {
  'coaching-intensive': ['contact-form', 'coaching-intensive', 'high-intent'],
  'coaching-basic': ['contact-form', 'coaching-basic'],
  'group-training': ['contact-form', 'group-training', 'corporate'],
  'course': ['contact-form', 'course-interest'],
  'speaking': ['contact-form', 'speaking-inquiry'],
  'media': ['contact-form', 'media-inquiry'],
  'other': ['contact-form', 'general-inquiry'],
};

function validateContactForm(data: ContactFormData): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please provide a valid email address';
  }
  if (!data.subject) {
    errors.subject = 'Please select a topic';
  }
  if (!data.message || data.message.trim().length < 20) {
    errors.message = 'Message must be at least 20 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    const { isValid, errors } = validateContactForm(body);
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (!isGHLConfigured()) {
      console.error('GHL integration not configured — missing GHL_API_KEY or GHL_LOCATION_ID');
      return NextResponse.json(
        {
          success: false,
          message: 'Something went wrong. Please try again or email us directly.',
        },
        { status: 500 }
      );
    }

    // 1. Create or update contact in GHL
    const contactId = await upsertContact({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      tags: subjectTags[body.subject] || ['contact-form'],
      source: 'Website Contact Form',
    });

    // 2. Create pipeline opportunity (skipped if pipeline not configured)
    const pipelineId = process.env.GHL_PIPELINE_ID;
    const pipelineStageId = process.env.GHL_PIPELINE_STAGE_ID;
    if (pipelineId && pipelineStageId) {
      const topicLabel = subjectLabels[body.subject] || body.subject;
      await createOpportunity({
        pipelineId,
        pipelineStageId,
        contactId,
        name: `${topicLabel} — ${body.firstName} ${body.lastName}`,
        status: 'open',
      });
    } else {
      console.warn('GHL pipeline not configured — skipping opportunity creation');
    }

    // 3. Add a note with the full message to the contact
    await addNote(
      contactId,
      `**Website Contact Form Submission**\n\nTopic: ${subjectLabels[body.subject] || body.subject}\n\nMessage:\n${body.message}`
    );

    return NextResponse.json(
      {
        success: true,
        message:
          'Thank you for your message. We will get back to you within 24-48 hours.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong. Please try again or email us directly.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Contact API endpoint. Use POST to submit a form.' },
    { status: 405 }
  );
}
```

- [ ] **Step 3: Refactor the playbook route onto the shared lib**

Replace the entire contents of `src/app/api/playbook/route.ts` with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { isGHLConfigured, upsertContact } from '@/lib/ghl';

interface PlaybookFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

function validatePlaybookForm(data: PlaybookFormData): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please provide a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaybookFormData = await request.json();

    const { isValid, errors } = validatePlaybookForm(body);
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (!isGHLConfigured()) {
      console.error('GHL integration not configured — missing GHL_API_KEY or GHL_LOCATION_ID');
      return NextResponse.json(
        {
          success: false,
          message: 'Something went wrong. Please try again later.',
        },
        { status: 500 }
      );
    }

    await upsertContact({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      tags: ['playbook-request', 'lead-magnet'],
      source: 'Playbook Form',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your playbook is ready for download!',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Playbook form error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong. Please try again later.',
      },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors (warnings pre-existing elsewhere are acceptable; no new errors in `src/lib/ghl.ts`, `src/app/api/contact/route.ts`, `src/app/api/playbook/route.ts`).

- [ ] **Step 5: Build (typecheck)**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ghl.ts src/app/api/contact/route.ts src/app/api/playbook/route.ts
git commit -m "Extract shared GHL helpers into src/lib/ghl.ts"
```

---

### Task 2: New `/api/funnel-checkout` route

**Files:**
- Create: `src/app/api/funnel-checkout/route.ts`

**Interfaces:**
- Consumes: `isGHLConfigured`, `upsertContact`, `createOpportunity`, `addNote` from `@/lib/ghl` (Task 1).
- Produces: `POST /api/funnel-checkout` accepting JSON `{ firstName, lastName, email, address?, city?, state?, zip?, country?, orderBump?, total? }`; responds `200 { success: true }`, `400 { success: false, errors }`, or `500 { success: false, message }`.

- [ ] **Step 1: Create the route**

Create `src/app/api/funnel-checkout/route.ts` with exactly this content:

```ts
import { NextRequest, NextResponse } from 'next/server';
import {
  isGHLConfigured,
  upsertContact,
  createOpportunity,
  addNote,
} from '@/lib/ghl';

// NOTE: Payment fields (card number, expiry, CVC) are intentionally NOT part
// of this payload and must never be sent here.
interface FunnelCheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  orderBump?: boolean;
  total?: number;
}

function validateCheckout(data: FunnelCheckoutData): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please provide a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: FunnelCheckoutData = await request.json();

    const { isValid, errors } = validateCheckout(body);
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (!isGHLConfigured()) {
      console.error('GHL integration not configured — missing GHL_API_KEY or GHL_LOCATION_ID');
      return NextResponse.json(
        { success: false, message: 'Something went wrong. Please try again later.' },
        { status: 500 }
      );
    }

    // 1. Create or update the contact with shipping address + tags
    const tags = ['funnel-checkout', 'book-order', '168-game'];
    if (body.orderBump) {
      tags.push('order-bump-quickstart');
    }

    const contactId = await upsertContact({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      address1: body.address,
      city: body.city,
      state: body.state,
      postalCode: body.zip,
      country: body.country,
      tags,
      source: 'Funnel Checkout — Free Book',
    });

    // 2. Create the opportunity in the Book Ordered pipeline (best-effort)
    const pipelineId = process.env.GHL_FUNNEL_PIPELINE_ID;
    const pipelineStageId = process.env.GHL_FUNNEL_PIPELINE_STAGE_ID;
    if (pipelineId && pipelineStageId) {
      await createOpportunity({
        pipelineId,
        pipelineStageId,
        contactId,
        name: `Book Order — ${body.firstName.trim()} ${body.lastName.trim()}`,
        monetaryValue: typeof body.total === 'number' ? body.total : undefined,
        status: 'open',
      });
    } else {
      console.warn('GHL funnel pipeline not configured — skipping opportunity creation');
    }

    // 3. Add an order-summary note (best-effort)
    const items = ['The 168 Game (Book) — Free + $5.95 shipping'];
    if (body.orderBump) {
      items.push('Quick Start Implementation Guide — $47');
    }
    const shippingAddress = [body.address, body.city, body.state, body.zip, body.country]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(', ');
    await addNote(
      contactId,
      `**Book Funnel Checkout**\n\nOrder:\n- ${items.join('\n- ')}\n\nOrder bump: ${
        body.orderBump ? 'Yes' : 'No'
      }\nTotal: $${(typeof body.total === 'number' ? body.total : 0).toFixed(2)}\nShipping address: ${
        shippingAddress || 'N/A'
      }`
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Funnel checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new errors in `src/app/api/funnel-checkout/route.ts`.

- [ ] **Step 3: Build (typecheck)**

Run: `npm run build`
Expected: build succeeds; `/api/funnel-checkout` appears in the route list.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/funnel-checkout/route.ts
git commit -m "Add /api/funnel-checkout route for GHL lead capture"
```

---

### Task 3: Add `disabled` support to `FunnelCTA`

**Files:**
- Modify: `src/components/funnel/FunnelCTA.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `FunnelCTA` accepts an optional `disabled?: boolean` prop; when true the button is disabled, shows reduced opacity + `not-allowed` cursor, and skips hover/tap motion.

- [ ] **Step 1: Add the `disabled` prop to the interface**

In `src/components/funnel/FunnelCTA.tsx`, add `disabled?: boolean;` to the `FunnelCTAProps` interface (after the `type?: ...` line):

```tsx
  type?: 'button' | 'submit' | 'reset';
  target?: string;
  rel?: string;
  disabled?: boolean;
}
```

- [ ] **Step 2: Destructure `disabled` in the component signature**

Add `disabled = false,` to the destructured props (after `type = 'button',`):

```tsx
  type = 'button',
  target,
  rel,
  disabled = false,
}: FunnelCTAProps) {
```

- [ ] **Step 3: Apply `disabled` styling to the shared classes**

Update `buttonClasses` to include disabled styling — change the `${pulse ? 'animate-pulse' : ''}` line block so it reads:

```tsx
  const buttonClasses = `
    inline-flex items-center justify-center gap-3
    rounded-lg font-bold
    transition-all duration-300
    hover:scale-[1.02]
    ${sizes[size]}
    ${pulse ? 'animate-pulse' : ''}
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
    ${className}
  `;
```

- [ ] **Step 4: Pass `disabled` to the `motion.button` and guard its motion**

Replace the returned `motion.button` (the non-`href` branch) with:

```tsx
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      style={variantStyles[variant]}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      {content}
    </motion.button>
  );
```

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no new errors in `src/components/funnel/FunnelCTA.tsx`.

- [ ] **Step 6: Build (typecheck)**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/funnel/FunnelCTA.tsx
git commit -m "Add disabled prop to FunnelCTA"
```

---

### Task 4: Wire the checkout page to capture the lead

**Files:**
- Modify: `src/app/(funnel)/free-book/checkout/page.tsx`

**Interfaces:**
- Consumes: `POST /api/funnel-checkout` (Task 2); `FunnelCTA` `disabled` prop (Task 3).
- Produces: checkout submit posts the lead (no card data) and redirects to `/free-book/mastery` unconditionally.

- [ ] **Step 1: Add an `isSubmitting` state**

In `src/app/(funnel)/free-book/checkout/page.tsx`, add the state next to the existing `orderBump` state (after line `const [orderBump, setOrderBump] = useState(false);`):

```tsx
  const [isSubmitting, setIsSubmitting] = useState(false);
```

- [ ] **Step 2: Replace `handleSubmit` with the async, lead-capturing version**

Replace the entire existing `handleSubmit` function with:

```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Save customer info and order to sessionStorage
    const orderItems = [
      { name: 'The 168 Game (Book)', price: 0, note: 'Free + $5.95 shipping' },
    ];
    if (orderBump) {
      orderItems.push({ name: 'Quick Start Implementation Guide', price: bumpPrice, note: '' });
    }
    sessionStorage.setItem('funnelCustomer', JSON.stringify({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      country: formData.country,
    }));
    sessionStorage.setItem('funnelOrder', JSON.stringify({
      items: orderItems,
      shipping: basePrice,
      total: total,
    }));

    // Capture the lead in GHL. Best-effort: never block the funnel, and bail
    // out after 8s so a slow/hung request can't trap the customer. Payment
    // fields are deliberately excluded from this payload.
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      await fetch('/api/funnel-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
          orderBump,
          total,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (err) {
      console.error('Lead capture failed:', err);
    }

    // Mock checkout - redirect to first upsell (always, regardless of capture)
    router.push('/free-book/mastery');
  };
```

- [ ] **Step 3: Reflect the submitting state on the submit button**

Replace the `FunnelCTA` submit block (the one wrapping the "Complete Order" label) with:

```tsx
                  <FunnelCTA
                    type="submit"
                    size="xl"
                    className="w-full"
                    showArrow={false}
                    disabled={isSubmitting}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" />
                      {isSubmitting ? 'Processing…' : `Complete Order - $${total.toFixed(2)}`}
                    </span>
                  </FunnelCTA>
```

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no new errors in `src/app/(funnel)/free-book/checkout/page.tsx`.

- [ ] **Step 5: Build (typecheck)**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(funnel)/free-book/checkout/page.tsx"
git commit -m "Capture funnel checkout leads in GHL on submit"
```

---

### Task 5: Configuration + live GHL smoke test

**Files:**
- Create: `.env.example`
- Create: `.env.local` (NOT committed — `.env*` is gitignored)

**Interfaces:**
- Consumes: the full feature (Tasks 1–4).
- Produces: documented env config + a verified end-to-end capture.

- [ ] **Step 1: Create `.env.example`**

Create `.env.example` with this content (placeholders only — no secrets):

```bash
# GoHighLevel (LeadConnector) integration
GHL_API_KEY=pit-your-private-integration-token
GHL_LOCATION_ID=your-location-id

# Contact form pipeline (optional — opportunity skipped if unset)
GHL_PIPELINE_ID=
GHL_PIPELINE_STAGE_ID=

# Funnel checkout pipeline — "Book Ordered Pipeline" / "Ordered Book" stage
GHL_FUNNEL_PIPELINE_ID=your-funnel-pipeline-id
GHL_FUNNEL_PIPELINE_STAGE_ID=your-funnel-stage-id
```

- [ ] **Step 2: Create `.env.local` with the real credentials**

Create `.env.local` with:

```bash
GHL_API_KEY=pit-REDACTED-SET-IN-ENV-LOCAL
GHL_LOCATION_ID=LwsKS1Uf1UctDEWEaj3p
GHL_FUNNEL_PIPELINE_ID=ahKfmeubC9KOOIBmPu2p
GHL_FUNNEL_PIPELINE_STAGE_ID=91280596-9065-4a4c-906b-4f72f075ad62
```

- [ ] **Step 3: Confirm `.env.local` is NOT tracked by git**

Run: `git status --porcelain .env.local`
Expected: empty output (gitignored). If it appears, STOP and fix `.gitignore` before continuing.

- [ ] **Step 4: Start the dev server**

Run (background): `npm run dev`
Expected: server ready at `http://localhost:3000`.

- [ ] **Step 5: Submit a test lead to the local route**

Run:

```bash
curl -s -X POST http://localhost:3000/api/funnel-checkout \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Smoke","lastName":"Test","email":"smoke-test+funnel@example.com","address":"123 Test St","city":"Austin","state":"TX","zip":"78701","country":"United States","orderBump":true,"total":52.95}'
```

Expected: `{"success":true}`

- [ ] **Step 6: Verify the contact + tags in GHL**

Run:

```bash
curl -s "https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=LwsKS1Uf1UctDEWEaj3p&email=smoke-test%2Bfunnel@example.com" \
  -H "Authorization: Bearer pit-REDACTED-SET-IN-ENV-LOCAL" \
  -H "Version: 2021-07-28" -H "Content-Type: application/json"
```

Expected: a contact is returned with the tags `funnel-checkout`, `book-order`, `168-game`, `order-bump-quickstart`. Record its `id` for cleanup. (If this endpoint shape differs, confirm the contact instead via the GHL web UI under Contacts.)

- [ ] **Step 7: Verify the opportunity in GHL**

Run (replace `CONTACT_ID` with the id from Step 6):

```bash
curl -s "https://services.leadconnectorhq.com/contacts/CONTACT_ID/" \
  -H "Authorization: Bearer pit-REDACTED-SET-IN-ENV-LOCAL" \
  -H "Version: 2021-07-28" -H "Content-Type: application/json"
```

Then confirm in the GHL web UI that the "Book Ordered Pipeline → Ordered Book" stage shows an opportunity named `Book Order — Smoke Test` with a value of `$52.95` and that the contact has the order note. (The pipeline/note are best-effort; if the contact + tags exist but a deal/note is missing, capture the server logs from the dev console and fix before sign-off.)

- [ ] **Step 8: Delete the test contact**

Run (replace `CONTACT_ID`):

```bash
curl -s -X DELETE "https://services.leadconnectorhq.com/contacts/CONTACT_ID" \
  -H "Authorization: Bearer pit-REDACTED-SET-IN-ENV-LOCAL" \
  -H "Version: 2021-07-28" -H "Content-Type: application/json"
```

Expected: success response. Deleting the contact also removes its opportunity and note.

- [ ] **Step 9: Verify the funnel never blocks on GHL failure**

Temporarily simulate a bad key by re-running the local route call with the dev server, but first confirm the design's non-blocking behavior at the UI level: open `http://localhost:3000/free-book/checkout`, fill the form with junk-but-valid values, submit, and confirm the browser redirects to `/free-book/mastery`. (The client swallows capture errors and redirects unconditionally.)

- [ ] **Step 10: Stop the dev server and commit the example file**

Stop the background dev server. Then:

```bash
git add .env.example
git commit -m "Document GHL env vars in .env.example"
```

(`.env.local` is intentionally not committed.)

---

## Self-Review

**1. Spec coverage:**
- Capture contact w/ address + tags + source → Task 2 Step 1 (`upsertContact` call). ✓
- Create opportunity in Book Ordered → Ordered Book → Task 2 Step 1 (`createOpportunity` with `GHL_FUNNEL_*`). ✓
- Order note → Task 2 Step 1 (`addNote`). ✓
- Exclude payment fields → Task 2 (interface omits them) + Task 4 Step 2 (payload omits card fields) + Global Constraints. ✓
- Never block funnel / timeout race → Task 4 Step 2 (AbortController 8s, unconditional `router.push`). ✓
- Shared `src/lib/ghl.ts` + refactor existing routes (behavior-preserving) → Task 1. ✓
- Separate `GHL_FUNNEL_*` pipeline vars → Task 2 + Task 5. ✓
- Env config + `.env.example` + gitignored `.env.local` → Task 5. ✓
- Manual/live smoke-test verification (no test framework) → Task 5. ✓
- `isSubmitting` / "Processing…" button → Task 3 + Task 4 Step 1/3. ✓

**2. Placeholder scan:** No "TBD"/"add error handling"/"similar to Task N" placeholders; every code step contains full code. `CONTACT_ID` in Task 5 is an intentional runtime value the operator substitutes, not a plan placeholder. ✓

**3. Type consistency:** `upsertContact(UpsertContactInput): Promise<string>`, `createOpportunity(CreateOpportunityInput): Promise<unknown|null>`, `addNote(string, string): Promise<void>`, `isGHLConfigured(): boolean` — names/signatures used identically in Tasks 1, 2. `FunnelCTA` `disabled?: boolean` defined in Task 3, consumed in Task 4. ✓
