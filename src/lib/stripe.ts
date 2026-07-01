import Stripe from 'stripe';

// Restricted key (rk_) in test mode first, live at launch. Never a raw sk_.
const secretKey = process.env.STRIPE_SECRET_KEY;

// Do NOT override apiVersion — the installed SDK pins the latest supported version.
// Fall back to a placeholder so the module can be imported in test environments
// where STRIPE_SECRET_KEY is not set. Call isStripeConfigured() before using the
// stripe client in production paths.
export const stripe = new Stripe(secretKey ?? 'sk_test_placeholder_not_configured');

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const CURRENCY = 'usd';

export type ProductKey =
  | 'book-shipping'
  | 'order-bump'
  | 'mastery'
  | 'convention-regular'
  | 'convention-vip'
  | 'course';

// Single source of truth for amounts (cents). The client never sends a price.
export const PRODUCTS: Record<ProductKey, { amount: number; label: string }> = {
  'book-shipping':      { amount: 595,    label: 'The 168 Game — Shipping & Handling' },
  'order-bump':         { amount: 4700,   label: 'Quick Start Implementation Guide' },
  'mastery':            { amount: 750000, label: 'Time Ownership Accelerator (6-Month)' },
  'convention-regular': { amount: 99700,  label: 'Convention — Regular Ticket' },
  'convention-vip':     { amount: 149700, label: 'Convention — VIP Ticket' },
  'course':             { amount: 49700,  label: 'On-Demand Mastery Course' },
};

export function checkoutAmountCents(orderBump: boolean): number {
  return PRODUCTS['book-shipping'].amount + (orderBump ? PRODUCTS['order-bump'].amount : 0);
}
