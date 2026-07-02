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
