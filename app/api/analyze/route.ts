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

function clampScore(value: number) {
  return Math.max(18, Math.min(96, Math.round(value)));
}

function calculateRoastScore(summary: {
  pageType: 'personal' | 'company';
  recentPosts: string[];
  visibleEmployeeCount?: number | null;
  avgVisiblePostInteractions?: number | null;
  fetchQuality: 'full' | 'partial';
}) {
  let score = 62;

  if (summary.fetchQuality === 'partial') score -= 12;
  if (!summary.recentPosts.length) score -= 16;
  else if (summary.recentPosts.length < 3) score -= 8;
  else if (summary.recentPosts.length >= 10) score += 6;

  const interactions = summary.avgVisiblePostInteractions ?? null;
  if (interactions === null) score -= 8;
  else if (interactions <= 1) score -= 16;
  else if (interactions <= 3) score -= 10;
  else if (interactions <= 8) score -= 4;
  else if (interactions >= 20) score += 8;
  else if (interactions >= 10) score += 4;

  if (summary.pageType === 'company') {
    const employees = summary.visibleEmployeeCount ?? null;
    if (employees !== null) {
      if (employees <= 5) score -= 4;
      else if (employees >= 50) score += 4;
      else if (employees >= 200) score += 6;
    }
  }

  return clampScore(score);
}

function getRoastLabel(score: number) {
  if (score >= 85) return 'Jungle King';
  if (score >= 70) return 'Laser Focused';
  if (score >= 55) return 'Scratching Post';
  if (score >= 40) return 'Dead Fish';
  return 'Hairball Emergency';
}

function getVerdictLine(score: number, pageType: 'personal' | 'company') {
  if (score >= 85) {
    return pageType === 'company'
      ? 'Your company page is annoyingly competent. The cats are suspicious.'
      : 'Your profile is alarmingly polished. A cat in finance approved it.';
  }

  if (score >= 70) {
    return pageType === 'company'
      ? 'This company page has real signs of life. Keep feeding it.'
      : 'This profile is doing better than most humans on LinkedIn. Mildly unsettling.';
  }

  if (score >= 55) {
    return pageType === 'company'
      ? 'Your company page is functional, but still giving “forgotten litter box in Q4.”'
      : 'Your profile is decent, but the cats think it could stop coasting.';
  }

  if (score >= 40) {
    return pageType === 'company'
      ? 'Your company page is currently posting like a sleepy intern lost the login.'
      : 'Your profile has potential, but right now it is whispering into the void.';
  }

  return pageType === 'company'
    ? 'This company page has the online energy of a haunted break room microwave.'
    : 'Your LinkedIn presence is currently performing like a cat walking across a keyboard.';
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
    }

    const summary = await scrapeLinkedInPublicPage(url);
    const analysis = await generateAnalysis(summary);

    const roastScore = calculateRoastScore(summary);
    const roastLabel = getRoastLabel(roastScore);
    const roastVerdict = getVerdictLine(roastScore, summary.pageType);

    if (ipAddress !== 'unknown') {
      await recordAnalysisAttempt({
        ipAddress,
        linkedinUrl: summary.url,
        displayName: summary.displayName,
        pageType: summary.pageType,
        roastScore,
      });
    }

    return NextResponse.json({
      ...analysis,
      roastScore,
      roastLabel,
      roastVerdict,
    });
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
