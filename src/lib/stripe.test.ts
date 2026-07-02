import { describe, it, expect } from 'vitest';
import { PRODUCTS, checkoutAmountCents } from './stripe';

describe('product catalog', () => {
  it('prices every funnel product in cents', () => {
    expect(PRODUCTS['book-shipping'].amount).toBe(595);
    expect(PRODUCTS['order-bump'].amount).toBe(4700);
    expect(PRODUCTS['mastery'].amount).toBe(750000);
    expect(PRODUCTS['convention-regular'].amount).toBe(99700);
    expect(PRODUCTS['convention-vip'].amount).toBe(149700);
    expect(PRODUCTS['course'].amount).toBe(49700);
  });

  it('sums checkout to shipping only when the bump is off', () => {
    expect(checkoutAmountCents(false)).toBe(595);
  });

  it('adds the order bump when on', () => {
    expect(checkoutAmountCents(true)).toBe(595 + 4700);
  });
});
