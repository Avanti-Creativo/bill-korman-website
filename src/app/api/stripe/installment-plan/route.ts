import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { parseSession, FUNNEL_COOKIE } from '@/lib/funnel-session';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const priceId = process.env.STRIPE_CONVENTION_PLAN_PRICE_ID;
    if (!priceId) return NextResponse.json({ status: 'failed', message: 'Plan not configured.' }, { status: 500 });

    const jar = await cookies();
    const session = parseSession(jar.get(FUNNEL_COOKIE)?.value);
    if (!session || !session.paymentMethodId || !session.stripeCustomerId) {
      return NextResponse.json({ status: 'failed', message: 'No saved card on file.' }, { status: 400 });
    }

    // 3 monthly charges of $332.33 on the saved card, then auto-cancel.
    const schedule = await stripe.subscriptionSchedules.create({
      customer: session.stripeCustomerId,
      start_date: 'now',
      end_behavior: 'cancel',
      default_settings: {
        default_payment_method: session.paymentMethodId,
        collection_method: 'charge_automatically',
      },
      phases: [{ items: [{ price: priceId, quantity: 1 }], iterations: 3 }],
      metadata: { ghlContactId: session.ghlContactId ?? '', product: 'convention-plan' },
      expand: ['subscription.latest_invoice.payment_intent'],
    });

    const sub = schedule.subscription;
    const pi =
      sub && typeof sub !== 'string' && sub.latest_invoice && typeof sub.latest_invoice !== 'string'
        ? sub.latest_invoice.payment_intent
        : null;

    if (pi && typeof pi !== 'string' && pi.status === 'requires_action') {
      return NextResponse.json({ status: 'requires_action', clientSecret: pi.client_secret }, { status: 200 });
    }
    return NextResponse.json({ status: 'active' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start the plan.';
    console.error('installment-plan error:', error);
    return NextResponse.json({ status: 'failed', message }, { status: 200 });
  }
}
