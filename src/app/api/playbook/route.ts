import { NextRequest, NextResponse } from 'next/server';
import { isGHLConfigured, upsertContact } from '@/lib/ghl';

interface PlaybookFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

function validatePlaybookForm(data: PlaybookFormData): {
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
    const body: PlaybookFormData = await request.json();

    const { isValid, errors } = validatePlaybookForm(body);
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (!isGHLConfigured()) {
      console.error('GHL integration not configured — missing GHL_API_KEY or GHL_LOCATION_ID');
      return NextResponse.json(
        {
          success: false,
          message: 'Something went wrong. Please try again later.',
        },
        { status: 500 }
      );
    }

    await upsertContact({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      tags: ['playbook-request', 'lead-magnet'],
      source: 'Playbook Form',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your playbook is ready for download!',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Playbook form error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong. Please try again later.',
      },
      { status: 500 }
    );
  }
}
