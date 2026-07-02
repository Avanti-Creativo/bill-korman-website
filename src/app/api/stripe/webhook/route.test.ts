import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a mocked module
vi.mock('@/lib/ghl');
vi.mock('@/lib/stripe');

import { POST } from './route';
import * as ghlModule from '@/lib/ghl';
import * as stripeModule from '@/lib/stripe';

process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

const req = (sig: string | null) =>
  new Request('http://localhost', { method: 'POST', headers: sig ? { 'stripe-signature': sig } : {}, body: '{}' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/stripe/webhook', () => {
  it('adds a GHL note on payment_intent.succeeded', async () => {
    const mockAddNote = vi.fn(async () => {});
    vi.mocked(ghlModule.addNote).mockImplementation(mockAddNote);

    const mockConstructEvent = vi.fn(() => ({
      type: 'payment_intent.succeeded',
      data: { object: { amount: 49700, metadata: { ghlContactId: 'g1', product: 'course' } } },
    }));
    vi.mocked(stripeModule.stripe.webhooks.constructEvent).mockImplementation(mockConstructEvent);

    const res = await POST(req('good'));
    expect(res.status).toBe(200);
    expect(mockAddNote).toHaveBeenCalledWith('g1', expect.stringContaining('497'));
  });

  it('rejects a bad signature', async () => {
    const mockConstructEvent = vi.fn(() => { throw new Error('bad sig'); });
    vi.mocked(stripeModule.stripe.webhooks.constructEvent).mockImplementation(mockConstructEvent);

    const res = await POST(req('bad'));
    expect(res.status).toBe(400);
    expect(vi.mocked(ghlModule.addNote)).not.toHaveBeenCalled();
  });
});
