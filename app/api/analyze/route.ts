import { NextRequest, NextResponse } from 'next/server';
import { scrapeLinkedInPublicPage } from '@/lib/linkedin';
import { generateAnalysis } from '@/lib/openai';
import { getRecentAnalysisCount, recordAnalysisAttempt } from '@/lib/db';

function isValidLinkedInUrl(input: string) {
  try {
    const url = new URL(input);
    return url.hostname.includes('linkedin.com');
  } catch {
    return false;
  }
}

function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
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

    const ipAddress = getRequestIp(request);
    const maxPerHour = Number(process.env.ANALYZE_LIMIT_PER_HOUR || '10');

    if (ipAddress !== 'unknown') {
      const recentCount = await getRecentAnalysisCount(ipAddress);

      if (recentCount >= maxPerHour) {
        return NextResponse.json(
          {
            error:
              'This IP has already burned through its hourly kitten budget. Try again in a bit.',
          },
          { status: 429 },
        );
      }

      await recordAnalysisAttempt(ipAddress);
    }

    const summary = await scrapeLinkedInPublicPage(url);
    const analysis = await generateAnalysis(summary);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          'The kittens got distracted by a laser pointer and could not finish that read. Try again in a minute.',
      },
      { status: 500 },
    );
  }
}
