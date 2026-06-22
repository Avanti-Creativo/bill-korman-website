import { NextRequest, NextResponse } from 'next/server';
import {
  isGHLConfigured,
  upsertContact,
  createOpportunity,
  addNote,
} from '@/lib/ghl';

// NOTE: Payment fields (card number, expiry, CVC) are intentionally NOT part
// of this payload and must never be sent here.
interface FunnelCheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  orderBump?: boolean;
  total?: number;
}

function validateCheckout(data: FunnelCheckoutData): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please provide a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: FunnelCheckoutData = await request.json();

    const { isValid, errors } = validateCheckout(body);
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (!isGHLConfigured()) {
      console.error('GHL integration not configured — missing GHL_API_KEY or GHL_LOCATION_ID');
      return NextResponse.json(
        { success: false, message: 'Something went wrong. Please try again later.' },
        { status: 500 }
      );
    }

    // 1. Create or update the contact with shipping address + tags
    const tags = ['funnel-checkout', 'book-order', '168-game'];
    if (body.orderBump) {
      tags.push('order-bump-quickstart');
    }

    const contactId = await upsertContact({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      address1: body.address,
      city: body.city,
      state: body.state,
      postalCode: body.zip,
      country: body.country,
      tags,
      source: 'Funnel Checkout — Free Book',
    });

    // 2. Create the opportunity in the Book Ordered pipeline (best-effort)
    const pipelineId = process.env.GHL_FUNNEL_PIPELINE_ID;
    const pipelineStageId = process.env.GHL_FUNNEL_PIPELINE_STAGE_ID;
    if (pipelineId && pipelineStageId) {
      await createOpportunity({
        pipelineId,
        pipelineStageId,
        contactId,
        name: `Book Order — ${body.firstName.trim()} ${body.lastName.trim()}`,
        monetaryValue: typeof body.total === 'number' ? body.total : undefined,
        status: 'open',
      });
    } else {
      console.warn('GHL funnel pipeline not configured — skipping opportunity creation');
    }

    // 3. Add an order-summary note (best-effort)
    const items = ['The 168 Game (Book) — Free + $5.95 shipping'];
    if (body.orderBump) {
      items.push('Quick Start Implementation Guide — $47');
    }
    const shippingAddress = [body.address, body.city, body.state, body.zip, body.country]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(', ');
    await addNote(
      contactId,
      `**Book Funnel Checkout**\n\nOrder:\n- ${items.join('\n- ')}\n\nOrder bump: ${
        body.orderBump ? 'Yes' : 'No'
      }\nTotal: $${(typeof body.total === 'number' ? body.total : 0).toFixed(2)}\nShipping address: ${
        shippingAddress || 'N/A'
      }`
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Funnel checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
