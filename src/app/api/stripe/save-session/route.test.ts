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
