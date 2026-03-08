import { NextRequest, NextResponse } from 'next/server';
import { saveLead } from '../../../../lib/db';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      linkedinUrl?: string;
      recommendations?: string[];
    };

    const email = body.email?.trim() || '';
    const linkedinUrl = body.linkedinUrl?.trim() || '';
    const recommendations = body.recommendations || [];

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'That email looks a little too feral. Try a valid one.' },
        { status: 400 },
      );
    }

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'Missing LinkedIn URL.' },
        { status: 400 },
      );
    }

    await saveLead(email, linkedinUrl);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'The kittens failed to unlock the content crate. Please try again.' },
      { status: 500 },
    );
  }
}
