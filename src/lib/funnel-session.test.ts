import { describe, it, expect, beforeAll } from 'vitest';
import { serializeSession, parseSession, type FunnelSession } from './funnel-session';

const sample: FunnelSession = {
  stripeCustomerId: 'cus_123',
  paymentMethodId: 'pm_123',
  ghlContactId: 'ghl_123',
  email: 'a@b.com',
  purchased: ['mastery'],
};

beforeAll(() => {
  process.env.FUNNEL_SESSION_SECRET = 'test-secret-please-change';
});

describe('funnel session cookie', () => {
  it('round-trips a session through sign + verify', () => {
    const raw = serializeSession(sample);
    expect(parseSession(raw)).toEqual(sample);
  });

  it('rejects a tampered payload', () => {
    const raw = serializeSession(sample);
    const sig = raw.split('.')[1];
    const tampered = Buffer.from(JSON.stringify({ ...sample, purchased: [] })).toString('base64url');
    expect(parseSession(`${tampered}.${sig}`)).toBeNull();
  });

  it('returns null for missing or malformed input', () => {
    expect(parseSession(undefined)).toBeNull();
    expect(parseSession('')).toBeNull();
    expect(parseSession('not-a-cookie')).toBeNull();
  });
});
