import { NextRequest, NextResponse } from 'next/server';
import { scrapeLinkedInPublicPage } from '@/lib/linkedin';
import { generateAnalysis } from '@/lib/openai';

function isValidLinkedInUrl(input: string) {
  try {
    const url = new URL(input);
    return url.hostname.includes('linkedin.com');
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim() || '';

    if (!isValidLinkedInUrl(url)) {
      return NextResponse.json(
        { error: 'Please paste a real LinkedIn URL so the kittens have something to inspect.' },
        { status: 400 },
      );
    }

    const summary = await scrapeLinkedInPublicPage(url);
    const analysis = await generateAnalysis(summary);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          'The kittens got distracted by a laser pointer and could not read that page. Try a more public LinkedIn URL or a page with visible posts.',
      },
      { status: 500 },
    );
  }
}
