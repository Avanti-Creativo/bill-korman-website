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
