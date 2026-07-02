import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serializeSession } from '@/lib/funnel-session';

process.env.FUNNEL_SESSION_SECRET = 'test-secret';
process.env.STRIPE_CONVENTION_PLAN_PRICE_ID = 'price_plan';
const cookieValue = serializeSession({
  stripeCustomerId: 'cus_1', paymentMethodId: 'pm_1', ghlContactId: 'g1', email: 'a@b.com', purchased: [],
});
const cookieValueNullPm = serializeSession({
  stripeCustomerId: 'cus_1', paymentMethodId: null, ghlContactId: 'g1', email: 'a@b.com', purchased: [],
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
  resolveCustomerPaymentMethod: vi.fn(async () => 'pm_healed'),
}));

import { POST } from './route';
import { stripe, resolveCustomerPaymentMethod } from '@/lib/stripe';

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

  it('returns requires_action + clientSecret when first invoice payment_intent needs 3DS', async () => {
    (stripe.subscriptionSchedules.create as any).mockResolvedValueOnce({
      id: 'sub_sched_2',
      subscription: {
        latest_invoice: {
          payment_intent: { status: 'requires_action', client_secret: 'cs_plan' },
        },
      },
    });
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'requires_action', clientSecret: 'cs_plan' });
  });

  it('returns 400 and does not call stripe when there is no funnel session', async () => {
    (cookieStore.get as any).mockReturnValueOnce(undefined);
    const res = await POST(req());
    expect(res.status).toBe(400);
    expect(stripe.subscriptionSchedules.create).not.toHaveBeenCalled();
  });

  it('returns 500 when the plan price env var is not configured', async () => {
    const saved = process.env.STRIPE_CONVENTION_PLAN_PRICE_ID;
    delete process.env.STRIPE_CONVENTION_PLAN_PRICE_ID;
    try {
      const res = await POST(req());
      expect(res.status).toBe(500);
    } finally {
      process.env.STRIPE_CONVENTION_PLAN_PRICE_ID = saved;
    }
  });

  it('self-heals: resolves saved card via resolveCustomerPaymentMethod when paymentMethodId is null', async () => {
    cookieStore.get.mockReturnValueOnce({ value: cookieValueNullPm });
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'active' });
    expect(resolveCustomerPaymentMethod).toHaveBeenCalledWith('cus_1');
    const arg = (stripe.subscriptionSchedules.create as any).mock.calls[0][0];
    expect(arg.default_settings.default_payment_method).toBe('pm_healed');
  });
});
