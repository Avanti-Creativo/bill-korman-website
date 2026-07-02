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
