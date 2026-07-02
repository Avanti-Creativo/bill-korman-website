import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serializeSession } from '@/lib/funnel-session';

process.env.FUNNEL_SESSION_SECRET = 'test-secret';
process.env.STRIPE_CONVENTION_PLAN_PRICE_ID = 'price_plan';
const cookieValue = serializeSession({
  stripeCustomerId: 'cus_1', paymentMethodId: 'pm_1', ghlContactId: 'g1', email: 'a@b.com', purchased: [],
});
const cookieStore = { get: vi.fn(() => ({ value: cookieValue })), set: vi.fn() };
vi.mock('next/headers', () => ({ cookies: () => cookieStore }));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptionSchedules: {
      create: vi.fn(async () => ({
        id: 'sub_sched_1',
        subscription: { latest_invoice: { payment_intent: { status: 'succeeded', client_secret: 's' } } },
      })),
    },
  },
}));

import { POST } from './route';
import { stripe } from '@/lib/stripe';

const req = () => new Request('http://localhost', { method: 'POST', body: '{}' });
beforeEach(() => vi.clearAllMocks());

describe('POST /api/stripe/installment-plan', () => {
  it('creates a 3-iteration subscription schedule on the saved card', async () => {
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'active' });
    expect(stripe.subscriptionSchedules.create).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_1',
      end_behavior: 'cancel',
    }));
    const arg = (stripe.subscriptionSchedules.create as any).mock.calls[0][0];
    expect(arg.phases[0].iterations).toBe(3);
    expect(arg.phases[0].items[0].price).toBe('price_plan');
  });
});
