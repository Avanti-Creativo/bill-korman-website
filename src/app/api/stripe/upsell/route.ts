import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe, PRODUCTS, CURRENCY, resolveCustomerPaymentMethod, type ProductKey } from '@/lib/stripe';
import { parseSession, serializeSession, FUNNEL_COOKIE, type FunnelSession } from '@/lib/funnel-session';

export const runtime = 'nodejs';

const UPSELL_PRODUCTS: ProductKey[] = ['mastery', 'course', 'convention-regular', 'convention-vip'];

const cookieOpts = {
  httpOnly: true, sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 2,
};

async function markPurchased(session: FunnelSession, product: string) {
  const jar = await cookies();
  const next = { ...session, purchased: [...new Set([...session.purchased, product])] };
  jar.set(FUNNEL_COOKIE, serializeSession(next), cookieOpts);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { product?: ProductKey; finalizePaymentIntentId?: string };
    const jar = await cookies();
    const session = parseSession(jar.get(FUNNEL_COOKIE)?.value);
    if (!session || !session.stripeCustomerId) {
      return NextResponse.json({ status: 'failed', message: 'No saved card on file.' }, { status: 400 });
    }

    // Finalize branch: called by the client after completing a 3-DS challenge.
    if (body.finalizePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(body.finalizePaymentIntentId);
      if (pi.status === 'succeeded') {
        await markPurchased(session, String(pi.metadata.product ?? ''));
        return NextResponse.json({ status: 'succeeded' }, { status: 200 });
      }
      return NextResponse.json({ status: 'failed', message: 'Payment not completed.' }, { status: 200 });
    }

    // Create branch.
    const product = body.product;
    if (!product || !UPSELL_PRODUCTS.includes(product)) {
      return NextResponse.json({ status: 'failed', message: 'Unknown product.' }, { status: 400 });
    }
    if (session.purchased.includes(product)) {
      return NextResponse.json({ status: 'failed', message: 'Already purchased.' }, { status: 409 });
    }

    let paymentMethodId = session.paymentMethodId;
    if (!paymentMethodId) {
      paymentMethodId = await resolveCustomerPaymentMethod(session.stripeCustomerId);
    }
    if (!paymentMethodId) {
      return NextResponse.json({ status: 'failed', message: 'No saved card on file.' }, { status: 400 });
    }

    const pi = await stripe.paymentIntents.create(
      {
        amount: PRODUCTS[product].amount,
        currency: CURRENCY,
        customer: session.stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true,
        // On-session: buyer is present, so 3-DS can complete. No redirects (server-side confirm).
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        metadata: { ghlContactId: session.ghlContactId ?? '', product },
      },
      { idempotencyKey: `${session.stripeCustomerId}:${product}` },
    );

    if (pi.status === 'succeeded') {
      await markPurchased(session, product);
      return NextResponse.json({ status: 'succeeded' }, { status: 200 });
    }
    if (pi.status === 'requires_action') {
      return NextResponse.json({ status: 'requires_action', clientSecret: pi.client_secret }, { status: 200 });
    }
    return NextResponse.json({ status: 'failed', message: 'Payment could not be completed.' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment failed.';
    console.error('upsell error:', error);
    return NextResponse.json({ status: 'failed', message }, { status: 200 });
  }
}
