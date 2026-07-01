import crypto from 'crypto';

export const FUNNEL_COOKIE = 'funnel_session';

export interface FunnelSession {
  stripeCustomerId: string;
  paymentMethodId: string | null;
  ghlContactId: string | null;
  email: string;
  purchased: string[];
}

function secret(): string {
  const s = process.env.FUNNEL_SESSION_SECRET;
  if (!s) throw new Error('FUNNEL_SESSION_SECRET is not set');
  return s;
}

function hmac(body: string): string {
  return crypto.createHmac('sha256', secret()).update(body).digest('base64url');
}

export function serializeSession(s: FunnelSession): string {
  const body = Buffer.from(JSON.stringify(s)).toString('base64url');
  return `${body}.${hmac(body)}`;
}

export function parseSession(raw: string | undefined | null): FunnelSession | null {
  if (!raw || !raw.includes('.')) return null;
  const [body, sig] = raw.split('.');
  if (!body || !sig) return null;
  const expected = hmac(body);
  // constant-time compare; lengths must match first
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as FunnelSession;
  } catch {
    return null;
  }
}
