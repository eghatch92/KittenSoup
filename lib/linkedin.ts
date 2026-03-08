import * as cheerio from 'cheerio';
import { PageType, PublicPageSummary } from '@/lib/types';

function cleanText(input: string | undefined | null) {
  return (input ?? '').replace(/\s+/g, ' ').trim();
}

function dedupe(items: string[]) {
  return [...new Set(items.map((item) => cleanText(item)).filter(Boolean))];
}

function detectPageType(url: string, html: string): PageType {
  const lowerUrl = url.toLowerCase();
  const lowerHtml = html.toLowerCase();
  if (lowerUrl.includes('/company/') || lowerHtml.includes('company page')) {
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

export async function scrapeLinkedInPublicPage(url: string): Promise<PublicPageSummary> {
  const normalizedUrl = url.trim();
  const troubleshooting = [
    'Try the public profile or company URL, not an internal LinkedIn share link.',
    'Make sure the profile or page has public visibility turned on for headline, about text, and posts.',
    'Try again with a company page or personal profile that has recent public posts visible.',
  ];

  const response = await fetch(normalizedUrl, {
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

  if (!response.ok) {
    throw new Error(`LinkedIn page fetch failed with ${response.status}`);
  }

  const html = await response.text();
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
    (pageType === 'company' ? 'This LinkedIn company page' : 'This LinkedIn profile');

  const headlineOrTagline =
    ogDescription || description || cleanText(mainText.slice(0, 240)) || 'No public headline found';

  const about = cleanText(mainText.slice(0, 1400));
  const employeeCount = extractEmployeeCount(`${description} ${ogDescription} ${mainText}`);
  const avgVisiblePostInteractions = extractInteractions(recentPosts);

  const metadataHints = dedupe([
    title,
    description,
    ogTitle,
    ogDescription,
  ]);

  const fetchQuality = recentPosts.length >= 3 && about.length > 120 ? 'full' : 'partial';

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
    troubleshooting,
  };
}
