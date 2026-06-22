// Shared GoHighLevel (GHL / LeadConnector v2) API helpers.
// Used by the contact, playbook, and funnel-checkout route handlers.

export const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

export function isGHLConfigured(): boolean {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

export function getGHLHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    'Content-Type': 'application/json',
    Version: '2021-07-28',
  };
}

export interface UpsertContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  tags: string[];
  source: string;
}

// Creates a contact, or updates the existing one when GHL reports a duplicate.
// Returns the contactId.
export async function upsertContact(input: UpsertContactInput): Promise<string> {
  const locationId = process.env.GHL_LOCATION_ID;

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = input.phone?.trim() || undefined;
  const address1 = input.address1?.trim() || undefined;
  const city = input.city?.trim() || undefined;
  const state = input.state?.trim() || undefined;
  const postalCode = input.postalCode?.trim() || undefined;
  const country = input.country?.trim() || undefined;

  const createRes = await fetch(`${GHL_BASE_URL}/contacts/`, {
    method: 'POST',
    headers: getGHLHeaders(),
    body: JSON.stringify({
      firstName,
      lastName,
      email: input.email.trim().toLowerCase(),
      phone,
      address1,
      city,
      state,
      postalCode,
      country,
      locationId,
      tags: input.tags,
      source: input.source,
    }),
  });

  if (createRes.ok) {
    const result = await createRes.json();
    return result.contact.id;
  }

  // GHL returns 400/422/409 for duplicate contacts with the existing
  // contactId in meta. Update that contact instead.
  const errorResult = await createRes.json().catch(() => null);

  if (errorResult?.meta?.contactId) {
    const contactId = errorResult.meta.contactId;
    await fetch(`${GHL_BASE_URL}/contacts/${contactId}`, {
      method: 'PUT',
      headers: getGHLHeaders(),
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        address1,
        city,
        state,
        postalCode,
        country,
        tags: input.tags,
      }),
    });
    return contactId;
  }

  throw new Error(
    `Failed to create GHL contact: ${createRes.status} ${JSON.stringify(errorResult)}`
  );
}

export interface CreateOpportunityInput {
  pipelineId: string;
  pipelineStageId: string;
  contactId: string;
  name: string;
  monetaryValue?: number;
  status?: string;
}

// Creates a pipeline opportunity. Returns the opportunity, or null on failure
// (logged, non-throwing) so callers never break on a deal-creation error.
export async function createOpportunity(
  input: CreateOpportunityInput
): Promise<unknown | null> {
  const locationId = process.env.GHL_LOCATION_ID;

  const res = await fetch(`${GHL_BASE_URL}/opportunities/`, {
    method: 'POST',
    headers: getGHLHeaders(),
    body: JSON.stringify({
      pipelineId: input.pipelineId,
      pipelineStageId: input.pipelineStageId,
      locationId,
      contactId: input.contactId,
      name: input.name,
      monetaryValue: input.monetaryValue,
      status: input.status ?? 'open',
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Failed to create GHL opportunity:', res.status, errorBody);
    return null;
  }

  const result = await res.json();
  return result.opportunity;
}

// Adds a note to a contact. Best-effort: logs on failure, never throws.
export async function addNote(contactId: string, body: string): Promise<void> {
  const res = await fetch(`${GHL_BASE_URL}/contacts/${contactId}/notes`, {
    method: 'POST',
    headers: getGHLHeaders(),
    body: JSON.stringify({ body }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Failed to add GHL note:', res.status, errorBody);
  }
}
