'use client';

import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe-client';

const stripePromise = getStripe();

export default function StripeProvider({
  amount, children,
}: {
  amount: number;
  children: React.ReactNode;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        amount,
        currency: 'usd',
        setupFutureUsage: 'off_session',
        appearance: { theme: 'night', labels: 'floating' },
      }}
    >
      {children}
    </Elements>
  );
}
