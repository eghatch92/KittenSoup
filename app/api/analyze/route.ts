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
  return Math.max(30, Math.min(96, Math.round(value)));
}

function calculateRoastScore(summary: {
  pageType: 'personal' | 'company';
  recentPosts: string[];
  visibleEmployeeCount?: number | null;
  avgVisiblePostInteractions?: number | null;
  fetchQuality: 'full' | 'partial';
}) {
  let score = 50;

  const postCount = summary.recentPosts.length;
  const interactions = summary.avgVisiblePostInteractions ?? null;
  const employees = summary.visibleEmployeeCount ?? null;

  if (postCount >= 10) score += 12;
  else if (postCount >= 5) score += 8;
  else if (postCount >= 3) score += 4;
  else if (postCount >= 1) score -= 2;

  if (interactions !== null) {
    if (interactions >= 20) score += 18;
    else if (interactions >= 10) score += 12;
    else if (interactions >= 5) score += 6;
    else if (interactions >= 2) score += 1;
    else score -= 6;
  }

  if (summary.pageType === 'company' && employees !== null) {
    if (employees >= 200) score += 6;
    else if (employees >= 50) score += 4;
    else if (employees >= 10) score += 2;
  }

  if (summary.fetchQuality === 'partial') score -= 4;

  return clampScore(score);
}

function calculateConfidence(summary: {
  recentPosts: string[];
  avgVisiblePostInteractions?: number | null;
  visibleEmployeeCount?: number | null;
  fetchQuality: 'full' | 'partial';
  pageType: 'personal' | 'company';
}) {
  let confidencePoints = 0;

  if (summary.fetchQuality === 'full') confidencePoints += 2;

  if (summary.recentPosts.length >= 3) confidencePoints += 2;
  else if (summary.recentPosts.length >= 1) confidencePoints += 1;

  if (summary.avgVisiblePostInteractions != null) confidencePoints += 2;

  if (summary.pageType === 'company' && summary.visibleEmployeeCount != null) {
    confidencePoints += 1;
  }

  if (confidencePoints >= 5) return 'high' as const;
  if (confidencePoints >= 3) return 'medium' as const;
  return 'low' as const;
}

function getRoastLabel(score: number) {
  if (score >= 85) return 'Jungle King';
  if (score >= 70) return 'Laser Focused';
  if (score >= 55) return 'Scratching Post';
  if (score >= 40) return 'Dead Fish';
  return 'Hairball Emergency';
}

function getVerdictLine(
  score: number,
  pageType: 'personal' | 'company',
  confidence: 'high' | 'medium' | 'low',
) {
  if (confidence === 'low') {
    return pageType === 'company'
      ? 'The cats only got a limited peek at this company page, so this roast is more vibe check than courtroom evidence.'
      : 'The cats only got a limited peek at this profile, so this roast is more spicy estimate than final verdict.';
  }

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
      ? 'Your company page is functional, but still giving forgotten litter box in Q4.'
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
    const confidence = calculateConfidence(summary);
    const roastLabel = getRoastLabel(roastScore);
    const roastVerdict = getVerdictLine(roastScore, summary.pageType, confidence);

    const leaderboardEligible =
      confidence !== 'low' &&
      (summary.recentPosts.length >= 3 || summary.avgVisiblePostInteractions != null);

    if (ipAddress !== 'unknown') {
      await recordAnalysisAttempt({
        ipAddress,
        linkedinUrl: summary.url,
        displayName: summary.displayName,
        pageType: summary.pageType,
        roastScore: leaderboardEligible ? roastScore : null,
        confidence,
      });
    }

    return NextResponse.json({
      ...analysis,
      roastScore,
      roastLabel,
      roastVerdict,
      confidence,
      leaderboardEligible,
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
