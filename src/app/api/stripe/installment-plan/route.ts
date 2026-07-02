import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe, resolveCustomerPaymentMethod } from '@/lib/stripe';
import { parseSession, FUNNEL_COOKIE } from '@/lib/funnel-session';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const priceId = process.env.STRIPE_CONVENTION_PLAN_PRICE_ID;
    if (!priceId) return NextResponse.json({ status: 'failed', message: 'Plan not configured.' }, { status: 500 });

    const jar = await cookies();
    const session = parseSession(jar.get(FUNNEL_COOKIE)?.value);
    if (!session || !session.stripeCustomerId) {
      return NextResponse.json({ status: 'failed', message: 'No saved card on file.' }, { status: 400 });
    }

    let paymentMethodId = session.paymentMethodId;
    if (!paymentMethodId) {
      paymentMethodId = await resolveCustomerPaymentMethod(session.stripeCustomerId);
    }
    if (!paymentMethodId) {
      return NextResponse.json({ status: 'failed', message: 'No saved card on file.' }, { status: 400 });
    }

    // 3 monthly charges of $332.33 on the saved card, then auto-cancel.
    // Stripe API 2025-08-27+ (our SDK pins 2026-06-24.dahlia) replaced the phase
    // `iterations` parameter with `duration`. The first invoice auto-charges the
    // saved default card now; charges 2 & 3 run off-session at +30/+60 days, then
    // the schedule cancels. Invoices no longer expose `payment_intent`, so a card
    // that needs 3-DS on the first installment is collected via Stripe dunning
    // (hosted invoice email) rather than an inline challenge.
    await stripe.subscriptionSchedules.create({
      customer: session.stripeCustomerId,
      start_date: 'now',
      end_behavior: 'cancel',
      default_settings: {
        default_payment_method: paymentMethodId,
        collection_method: 'charge_automatically',
      },
      phases: [
        {
          items: [{ price: priceId, quantity: 1 }],
          duration: { interval: 'month', interval_count: 3 },
        },
      ],
      metadata: { ghlContactId: session.ghlContactId ?? '', product: 'convention-plan' },
    });

    return NextResponse.json({ status: 'active' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start the plan.';
    console.error('installment-plan error:', error);
    return NextResponse.json({ status: 'failed', message }, { status: 200 });
  }
}
