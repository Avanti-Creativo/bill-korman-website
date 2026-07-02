import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe, isStripeConfigured, checkoutAmountCents, CURRENCY } from '@/lib/stripe';
import { serializeSession, FUNNEL_COOKIE } from '@/lib/funnel-session';
import { isGHLConfigured, upsertContact } from '@/lib/ghl';

export const runtime = 'nodejs';

interface Body {
  firstName: string; lastName: string; email: string;
  address?: string; city?: string; state?: string; zip?: string; country?: string;
  orderBump?: boolean;
}

function validate(b: Body) {
  const errors: Record<string, string> = {};
  if (!b.firstName || b.firstName.trim().length < 2) errors.firstName = 'First name required';
  if (!b.lastName || b.lastName.trim().length < 2) errors.lastName = 'Last name required';
  if (!b.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) errors.email = 'Valid email required';
  return errors;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const errors = validate(body);
    if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

    if (!isStripeConfigured()) {
      console.error('Stripe not configured');
      return NextResponse.json({ message: 'Payment temporarily unavailable.' }, { status: 500 });
    }

    const email = body.email.trim().toLowerCase();
    const orderBump = Boolean(body.orderBump);

    // 1. GHL lead capture (best-effort — never blocks payment).
    let ghlContactId: string | null = null;
    if (isGHLConfigured()) {
      try {
        const tags = ['funnel-checkout', 'book-order', '168-game', 'contact-form'];
        if (orderBump) tags.push('order-bump-quickstart');
        ghlContactId = await upsertContact({
          firstName: body.firstName, lastName: body.lastName, email,
          address1: body.address, city: body.city, state: body.state,
          postalCode: body.zip, country: body.country,
          tags, source: 'Funnel Checkout — Free Book',
        });
      } catch (err) {
        console.error('GHL lead capture failed (best-effort):', err);
      }
    }

    // 2. Reuse an existing Stripe customer for this email, else create one.
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0]
      ?? await stripe.customers.create({
        email,
        name: `${body.firstName.trim()} ${body.lastName.trim()}`,
        // Funnel ships US-only (the checkout country field is disabled/defaulted to
        // the display name "United States"). Stripe's address.country requires an ISO
        // 3166-1 alpha-2 code, so 'US' is intentional here — never body.country.
        address: body.address
          ? { line1: body.address, city: body.city, state: body.state, postal_code: body.zip, country: 'US' }
          : undefined,
      });

    // 3. PaymentIntent that charges shipping (+bump) and saves the card.
    const pi = await stripe.paymentIntents.create({
      amount: checkoutAmountCents(orderBump),
      currency: CURRENCY,
      customer: customer.id,
      setup_future_usage: 'off_session',
      metadata: { ghlContactId: ghlContactId ?? '', email, step: 'book', orderBump: String(orderBump) },
      // No payment_method_types — dynamic payment methods.
    });

    // 4. Persist funnel state in a signed httpOnly cookie.
    const cookie = serializeSession({
      stripeCustomerId: customer.id,
      paymentMethodId: null,
      ghlContactId,
      email,
      purchased: [],
    });
    (await cookies()).set(FUNNEL_COOKIE, cookie, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 2,
    });

    return NextResponse.json({ clientSecret: pi.client_secret }, { status: 200 });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
