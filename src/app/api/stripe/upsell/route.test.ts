import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serializeSession } from '@/lib/funnel-session';

process.env.FUNNEL_SESSION_SECRET = 'test-secret';

let cookieValue = serializeSession({
  stripeCustomerId: 'cus_1', paymentMethodId: 'pm_1', ghlContactId: 'g1', email: 'a@b.com', purchased: [],
});
const cookieStore = { get: vi.fn(() => ({ value: cookieValue })), set: vi.fn((_n, v) => { cookieValue = v; }) };

vi.mock('next/headers', () => ({ cookies: () => cookieStore }));
vi.mock('@/lib/stripe', async (orig) => {
  const actual = await orig<typeof import('@/lib/stripe')>();
  return {
    ...actual,
    stripe: {
      paymentIntents: {
        create: vi.fn(async () => ({ id: 'pi_up', status: 'succeeded', client_secret: 's', metadata: { product: 'course' } })),
        retrieve: vi.fn(),
      },
    },
  };
});

import { POST } from './route';
import { stripe } from '@/lib/stripe';

const req = (b: unknown) => new Request('http://localhost', { method: 'POST', body: JSON.stringify(b) });
beforeEach(() => { vi.clearAllMocks(); cookieValue = serializeSession({ stripeCustomerId: 'cus_1', paymentMethodId: 'pm_1', ghlContactId: 'g1', email: 'a@b.com', purchased: [] }); });

describe('POST /api/stripe/upsell', () => {
  it('charges the saved card on-session for the catalog amount', async () => {
    const res = await POST(req({ product: 'course' }));
    expect(await res.json()).toEqual({ status: 'succeeded' });
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
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
