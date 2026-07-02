import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { addNote } from '@/lib/ghl';

export const runtime = 'nodejs';

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

async function noteFromMetadata(meta: Stripe.Metadata | undefined, amount: number, verb: string) {
  const ghlContactId = meta?.ghlContactId;
  const product = meta?.product ?? 'purchase';
  if (!ghlContactId) return;
  try {
    await addNote(ghlContactId, `**Stripe ${verb}** — ${dollars(amount)} for ${product}`);
  } catch (err) {
    console.error('GHL note from webhook failed (best-effort):', err);
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get('stripe-signature');
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? '', secret ?? '');
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await noteFromMetadata(pi.metadata, pi.amount, 'payment');
      break;
    }
    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice;
      await noteFromMetadata(inv.subscription_details?.metadata, inv.amount_paid, 'installment paid');
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      await noteFromMetadata(inv.subscription_details?.metadata, inv.amount_due, 'installment FAILED');
      break;
    }
    case 'charge.refunded': {
      const ch = event.data.object as Stripe.Charge;
      await noteFromMetadata(ch.metadata, ch.amount_refunded, 'refund');
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
