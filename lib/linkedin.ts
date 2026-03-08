import * as cheerio from 'cheerio';
import { PageType, PublicPageSummary } from '../lib/types';

function cleanText(input: string | undefined | null) {
  return (input ?? '').replace(/\s+/g, ' ').trim();
}

function dedupe(items: string[]) {
  return [...new Set(items.map((item) => cleanText(item)).filter(Boolean))];
}

function detectPageType(url: string, html: string): PageType {
  const lowerUrl = url.toLowerCase();
  const lowerHtml = html.toLowerCase();

  if (
    lowerUrl.includes('/company/') ||
    lowerUrl.includes('/showcase/') ||
    lowerHtml.includes('company page')
  ) {
    return 'company';
  }

  return 'personal';
}

function extractEmployeeCount(text: string) {
  const match = text.match(/(\d{1,3}(?:,\d{3})*|\d+)\s+employees/i);
  if (!match) return null;
  return Number(match[1].replace(/,/g, ''));
}

function extractInteractions(posts: string[]) {
  const values = posts
    .map((post) => {
      const match = post.match(/(\d+)\s+(?:reactions?|likes?|comments?)/i);
      return match ? Number(match[1]) : null;
    })
    .filter((value): value is number => value !== null);

  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function inferDisplayNameFromUrl(url: string, pageType: PageType) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const slug = parts[parts.length - 1] || '';

    if (!slug) {
      return pageType === 'company'
        ? 'This LinkedIn company page'
        : 'This LinkedIn profile';
    }

    const cleaned = slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return cleaned || (pageType === 'company'
      ? 'This LinkedIn company page'
      : 'This LinkedIn profile');
  } catch {
    return pageType === 'company'
      ? 'This LinkedIn company page'
      : 'This LinkedIn profile';
  }
}

function buildFallbackSummary(url: string, pageType: PageType, reason?: string): PublicPageSummary {
  const displayName = inferDisplayNameFromUrl(url, pageType);

  return {
    url,
    pageType,
    displayName,
    headlineOrTagline:
      pageType === 'company'
        ? 'Public company details were limited, so the kittens are working with a lighter read.'
        : 'Public profile details were limited, so the kittens are working with a lighter read.',
    about:
      reason
        ? `Kitten Soup could not fully read the public LinkedIn page. Reason: ${reason}. It will still generate lighter recommendations based on the page type and any visible hints.`
        : 'Kitten Soup could not fully read the public LinkedIn page, but it can still generate lighter recommendations based on limited visible hints.',
    recentPosts: [],
    metadataHints: [],
    visibleEmployeeCount: null,
    avgVisiblePostInteractions: null,
    fetchQuality: 'partial',
    troubleshooting: [
      'Use the direct public LinkedIn profile or company URL, not a share link, search result, or sales link.',
      'Open the page in an incognito browser window. If key sections are visible there, the kittens have a better shot.',
      'Make sure the profile or company page has public headline, about text, and recent posts visible.',
      'Try a company page or a profile with recent public posts if your own profile is sparse.',
      'If LinkedIn serves a login wall, Kitten Soup can only do a lighter read.',
    ],
  };
}

export async function scrapeLinkedInPublicPage(url: string): Promise<PublicPageSummary> {
  const normalizedUrl = url.trim();
  const guessedPageType = normalizedUrl.toLowerCase().includes('/company/')
    ? 'company'
    : 'personal';

  let response: Response | null = null;
  let html = '';

  try {
    response = await fetch(normalizedUrl, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        pragma: 'no-cache',
        'cache-control': 'no-cache',
      },
      redirect: 'follow',
      cache: 'no-store',
    });
  } catch (error) {
    return buildFallbackSummary(
      normalizedUrl,
      guessedPageType,
      error instanceof Error ? error.message : 'network fetch failed',
    );
  }

  if (!response || !response.ok) {
    return buildFallbackSummary(
      normalizedUrl,
      guessedPageType,
      response ? `fetch failed with status ${response.status}` : 'no response received',
    );
  }

  try {
    html = await response.text();
  } catch (error) {
    return buildFallbackSummary(
      normalizedUrl,
      guessedPageType,
      error instanceof Error ? error.message : 'could not read response body',
    );
  }

  if (!html || html.length < 200) {
    return buildFallbackSummary(normalizedUrl, guessedPageType, 'very little HTML was returned');
  }

  const lowerHtml = html.toLowerCase();

  const obviousLoginWall =
    lowerHtml.includes('join linkedin') ||
    lowerHtml.includes('sign in to linkedin') ||
    lowerHtml.includes('sign up | linkedin') ||
    lowerHtml.includes('authwall') ||
    lowerHtml.includes('login') && lowerHtml.includes('linkedin');

  if (obviousLoginWall) {
    return buildFallbackSummary(
      normalizedUrl,
      detectPageType(normalizedUrl, html),
      'linkedin returned a login wall instead of full public content',
    );
  }

  const $ = cheerio.load(html);
  const pageType = detectPageType(normalizedUrl, html);

  const title = cleanText($('title').first().text());
  const description = cleanText($('meta[name="description"]').attr('content'));
  const ogTitle = cleanText($('meta[property="og:title"]').attr('content'));
  const ogDescription = cleanText($('meta[property="og:description"]').attr('content'));
  const mainText = cleanText($('main').text()) || cleanText($('body').text());

  const recentPosts = dedupe([
    ...$('article').toArray().map((el) => $(el).text()),
    ...$('section').toArray().map((el) => $(el).text()),
    ...$('li').toArray().map((el) => $(el).text()),
  ])
    .map((text) => text.slice(0, 400))
    .filter((text) => text.length > 50)
    .slice(0, 25);

  const displayName =
    cleanText(ogTitle.split('|')[0]) ||
    cleanText(title.split('|')[0]) ||
    inferDisplayNameFromUrl(normalizedUrl, pageType);

  const headlineOrTagline =
    ogDescription ||
    description ||
    cleanText(mainText.slice(0, 240)) ||
    'No clear public headline was found, so the kittens are improvising.';

  const about =
    cleanText(mainText.slice(0, 1400)) ||
    'Very little public body text was visible on this page.';

  const employeeCount = extractEmployeeCount(`${description} ${ogDescription} ${mainText}`);
  const avgVisiblePostInteractions = extractInteractions(recentPosts);

  const metadataHints = dedupe([title, description, ogTitle, ogDescription]);

  const fetchQuality =
    recentPosts.length >= 3 && about.length > 120 ? 'full' : 'partial';

  return {
    url: normalizedUrl,
    pageType,
    displayName,
    headlineOrTagline,
    about,
    recentPosts,
    metadataHints,
    visibleEmployeeCount: employeeCount,
    avgVisiblePostInteractions,
    fetchQuality,
    troubleshooting: [
      'Use the direct public LinkedIn profile or company URL, not a share link, search result, or sales link.',
      'Open the page in an incognito browser window. If key sections are visible there, the kittens have a better shot.',
      'Profiles with visible about text and recent public posts produce much better recommendations.',
      'If LinkedIn limits the read, Kitten Soup will still generate lighter recommendations.',
    ],
  };
}
