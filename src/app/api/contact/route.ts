import { NextRequest, NextResponse } from 'next/server';
import {
  isGHLConfigured,
  upsertContact,
  createOpportunity,
  addNote,
} from '@/lib/ghl';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Subject mapping for display labels and GHL tags
const subjectLabels: Record<string, string> = {
  'coaching-intensive': '1:1 Coaching Intensive',
  'coaching-basic': '1:1 Basic Coaching',
  'group-training': 'Group Training for Teams',
  'course': 'On-Demand Course',
  'speaking': 'Speaking Engagement',
  'media': 'Media/Press Inquiry',
  'other': 'General Question',
};

const subjectTags: Record<string, string[]> = {
  'coaching-intensive': ['contact-form', 'coaching-intensive', 'high-intent'],
  'coaching-basic': ['contact-form', 'coaching-basic'],
  'group-training': ['contact-form', 'group-training', 'corporate'],
  'course': ['contact-form', 'course-interest'],
  'speaking': ['contact-form', 'speaking-inquiry'],
  'media': ['contact-form', 'media-inquiry'],
  'other': ['contact-form', 'general-inquiry'],
};

function validateContactForm(data: ContactFormData): {
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
  if (!data.subject) {
    errors.subject = 'Please select a topic';
  }
  if (!data.message || data.message.trim().length < 20) {
    errors.message = 'Message must be at least 20 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    const { isValid, errors } = validateContactForm(body);
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (!isGHLConfigured()) {
      console.error('GHL integration not configured — missing GHL_API_KEY or GHL_LOCATION_ID');
      return NextResponse.json(
        {
          success: false,
          message: 'Something went wrong. Please try again or email us directly.',
        },
        { status: 500 }
      );
    }

    // 1. Create or update contact in GHL
    const contactId = await upsertContact({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      tags: subjectTags[body.subject] || ['contact-form'],
      source: 'Website Contact Form',
    });

    // 2. Create pipeline opportunity (skipped if pipeline not configured)
    const pipelineId = process.env.GHL_PIPELINE_ID;
    const pipelineStageId = process.env.GHL_PIPELINE_STAGE_ID;
    if (pipelineId && pipelineStageId) {
      const topicLabel = subjectLabels[body.subject] || body.subject;
      await createOpportunity({
        pipelineId,
        pipelineStageId,
        contactId,
        name: `${topicLabel} — ${body.firstName} ${body.lastName}`,
        status: 'open',
      });
    } else {
      console.warn('GHL pipeline not configured — skipping opportunity creation');
    }

    // 3. Add a note with the full message to the contact
    await addNote(
      contactId,
      `**Website Contact Form Submission**\n\nTopic: ${subjectLabels[body.subject] || body.subject}\n\nMessage:\n${body.message}`
    );

    return NextResponse.json(
      {
        success: true,
        message:
          'Thank you for your message. We will get back to you within 24-48 hours.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong. Please try again or email us directly.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Contact API endpoint. Use POST to submit a form.' },
    { status: 405 }
  );
}
