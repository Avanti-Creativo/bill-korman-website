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

  it('charges shipping only (595) when the order bump is off', async () => {
    const res = await POST(req({ firstName: 'Jane', lastName: 'Doe', email: 'j@d.com', orderBump: false }));
    expect(res.status).toBe(200);
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 595, currency: 'usd' })
    );
  });

  it('rejects invalid contact info', async () => {
    const res = await POST(req({ firstName: 'J', lastName: '', email: 'nope' }));
    expect(res.status).toBe(400);
  });
});
