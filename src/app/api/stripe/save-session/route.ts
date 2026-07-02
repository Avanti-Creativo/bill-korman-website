import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { parseSession, serializeSession, FUNNEL_COOKIE } from '@/lib/funnel-session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { paymentIntentId } = (await request.json()) as { paymentIntentId?: string };
    if (!paymentIntentId) return NextResponse.json({ message: 'Missing paymentIntentId' }, { status: 400 });

    const jar = await cookies();
    const session = parseSession(jar.get(FUNNEL_COOKIE)?.value);
    if (!session) return NextResponse.json({ message: 'No funnel session' }, { status: 400 });

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const paymentMethodId = typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id;
    if (pi.status !== 'succeeded' || !paymentMethodId) {
      return NextResponse.json({ message: 'Payment not completed' }, { status: 400 });
    }

    // Make the saved card the customer default so installments and upsells use it.
    await stripe.customers.update(session.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    jar.set(FUNNEL_COOKIE, serializeSession({ ...session, paymentMethodId }), {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 2,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('save-session error:', error);
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
  }
}
