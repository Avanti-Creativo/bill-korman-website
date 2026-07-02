'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FunnelCTA from '@/components/funnel/FunnelCTA';
import UrgencyBanner from '@/components/funnel/UrgencyBanner';
import { getStripe } from '@/lib/stripe-client';
import { startInstallmentPlan } from '@/lib/funnel-payments-client';

const features = [
  'Full 3-day convention (March 26-28, 2026)',
  'All workshops and sessions',
  'Networking with 150 elite entrepreneurs',
  'Complete materials and workbook',
  'Recording access',
  '90-day post-event support',
];

export default function ConventionPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (isLoading) return;
    setIsLoading(true); setError(null);
    const stripe = await getStripe();
    if (!stripe) { setError('Payment unavailable.'); setIsLoading(false); return; }
    const { ok, error } = await startInstallmentPlan(stripe);
    if (!ok) { setError(error ?? 'Could not start the plan.'); setIsLoading(false); return; }
    const order = JSON.parse(sessionStorage.getItem('funnelOrder') || '{}');
    order.items = [...(order.items || []), { name: 'Convention Ticket (3-Payment Plan)', price: 997, note: '3 × $332.33' }];
    order.total = (order.total || 0) + 997;
    sessionStorage.setItem('funnelOrder', JSON.stringify(order));
    router.push('/free-book/thank-you');
  };

  const handleDecline = () => {
    router.push('/free-book/thank-you');
  };

  return (
    <div className="min-h-screen bg-black">
      <UrgencyBanner
        message="WAIT - Before You Go..."
        variant="limited"
        icon="alert"
      />

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Same Convention. Same Access.{' '}
              <span className="text-accent-400">Just 3 Easy Payments.</span>
            </h1>

            <p className="text-xl text-neutral-300 mb-8">
              You Were Just About To Pass On The Most Important Investment You Could Make This NEW Year.
            </p>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-8 text-left">
              <p className="text-neutral-300 mb-4">
                If this convention helps you reclaim just 10 hours per week, and you use those hours
                on revenue-generating work, you'll make back your investment in the first month.
              </p>
              <p className="text-white font-semibold mb-2">
                One strategic partnership from the room pays for this 10x over.
              </p>
              <p className="text-white font-semibold">
                One breakthrough that unsticks your revenue ceiling covers this 50x over.
              </p>
            </div>

            <p className="text-neutral-400 mb-8">
              Running a business means managing cash. I've been there.
            </p>

            {/* Payment Plan Offer */}
            <div className="bg-accent-500/10 border-2 border-accent-500 rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Instead of $997 today, pay just...</h2>
              <div className="text-5xl font-bold text-accent-400 mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                3 Payments of $332.33
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-neutral-900/50 rounded-lg p-4">
                  <div className="text-sm text-neutral-400 mb-1">PAYMENT 1</div>
                  <div className="text-white font-bold">$332.33 today</div>
                  <div className="text-xs text-accent-400">Secures your spot</div>
                </div>
                <div className="bg-neutral-900/50 rounded-lg p-4">
                  <div className="text-sm text-neutral-400 mb-1">PAYMENT 2</div>
                  <div className="text-white font-bold">$332.33</div>
                  <div className="text-xs text-neutral-500">in 30 days</div>
                </div>
                <div className="bg-neutral-900/50 rounded-lg p-4">
                  <div className="text-sm text-neutral-400 mb-1">PAYMENT 3</div>
                  <div className="text-white font-bold">$332.33</div>
                  <div className="text-xs text-neutral-500">in 60 days</div>
                </div>
              </div>

              <p className="text-lg text-white font-semibold mb-4">
                Same ticket. Same access. Same guarantee.
              </p>

              <ul className="grid md:grid-cols-2 gap-3 text-left mb-6">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-neutral-300 text-sm">
                    <Check className="w-4 h-4 text-accent-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <FunnelCTA onClick={handleAccept} size="xl" className="w-full" disabled={isLoading}>
                Yes, Split My Payment Into 3 (Start With $332.33 Today)
              </FunnelCTA>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>

            {/* Guarantee */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-accent-400" />
                <h3 className="text-lg font-bold text-white">Remember: You Risk Absolutely Nothing</h3>
              </div>

              <p className="text-neutral-300 mb-4">
                Secure your spot with the first payment of $332.33.
              </p>
              <p className="text-neutral-300 mb-4">
                Show up on Day 1. Experience it for yourself.
              </p>
              <p className="text-white font-semibold mb-4">
                If by the end of Day 1 you're not convinced this is the best business investment
                you've made this year, tell us and we'll refund all payments.
              </p>
              <p className="text-neutral-400 mb-4">
                No questions. No hassle.
              </p>
              <p className="text-accent-400 font-semibold">
                You're protected. I'm taking all the risk. The only way you lose is if you don't show up.
              </p>
            </div>

            {/* Final CTA */}
            <div className="space-y-4">
              <FunnelCTA onClick={handleAccept} size="xl" className="w-full" disabled={isLoading}>
                Lock In My Payment Plan Spot Now
              </FunnelCTA>

              <button
                onClick={handleDecline}
                className="text-neutral-500 hover:text-neutral-400 text-sm underline transition-colors block mx-auto"
              >
                No, I'll pass on this offer
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-neutral-600">
          <p>&copy; {new Date().getFullYear()} Bill Korman. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
