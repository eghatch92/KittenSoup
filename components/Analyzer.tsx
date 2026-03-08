'use client';

import { useEffect, useMemo, useState } from 'react';

type AnalysisResult = {
  summary: {
    url: string;
    pageType: 'personal' | 'company';
    displayName: string;
    headlineOrTagline: string;
    about: string;
    recentPosts: string[];
    visibleEmployeeCount?: number | null;
    avgVisiblePostInteractions?: number | null;
    fetchQuality: 'full' | 'partial';
    troubleshooting: string[];
  };
  pageRecommendations: string[];
  contentRecommendations: string[];
  roastScore: number;
  roastLabel: string;
  roastVerdict: string;
};

type PublicStats = {
  totalAnalyses: number;
  leaderboard: Array<{
    display_name: string;
    page_type: string;
    roast_score: number;
    created_at: string;
  }>;
};

const kittenFacts = [
  'Your LinkedIn is currently being judged by a cat wearing sunglasses.',
  'A tiny cat CEO just audited your LinkedIn strategy.',
  'Three kittens and one intern are reviewing your posts.',
  'A cat in a tiny suit is evaluating your personal brand.',
  'The kittens have entered the boardroom.',
];

const catGifs = [
  'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
  'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
  'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
  'https://media.giphy.com/media/13borq7Zo2kulO/giphy.gif',
];

function formatScoreLabel(score: number, label: string) {
  return `${score}/100 · ${label}`;
}

export default function Analyzer() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [stats, setStats] = useState<PublicStats>({ totalAnalyses: 0, leaderboard: [] });
  const [unlockedRecommendations, setUnlockedRecommendations] = useState<string[] | null>(null);

  const randomFact = useMemo(
    () => kittenFacts[Math.floor(Math.random() * kittenFacts.length)],
    [],
  );

  const randomCatGif = useMemo(
    () => catGifs[Math.floor(Math.random() * catGifs.length)],
    [],
  );

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/stats', { cache: 'no-store' });
        const data = await response.json();
        if (response.ok) {
          setStats({
            totalAnalyses: data.totalAnalyses ?? 0,
            leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
          });
        }
      } catch {
        // ignore stats load failures
      }
    }

    loadStats();
  }, []);

  async function handleAnalyze() {
    const cleanedUrl = url.trim();

    if (!cleanedUrl) {
      setError('Paste a LinkedIn URL first, tiny goblin.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setUnlockedRecommendations(null);
    setCopiedShare(false);
    setCopiedCard(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: cleanedUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);

      try {
        const statsResponse = await fetch('/api/stats', { cache: 'no-store' });
        const statsData = await statsResponse.json();
        if (statsResponse.ok) {
          setStats({
            totalAnalyses: statsData.totalAnalyses ?? 0,
            leaderboard: Array.isArray(statsData.leaderboard) ? statsData.leaderboard : [],
          });
        }
      } catch {
        // ignore
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock() {
    if (!result) return;

    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      setError('Drop in an email so the kittens can open the box.');
      return;
    }

    setUnlocking(true);
    setError(null);

    try {
      const response = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: cleanedEmail,
          linkedinUrl: result.summary.url,
          recommendations: result.contentRecommendations,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unlock failed');
      }

      setUnlockedRecommendations(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUnlocking(false);
    }
  }

  async function handleCopyShare() {
    if (!result) return;

    const siteUrl =
      typeof window !== 'undefined' ? window.location.origin : 'https://your-site-url.com';

    const subject =
      result.summary.pageType === 'company' ? 'our LinkedIn company page' : 'my LinkedIn profile';

    const interactionLine =
      result.summary.avgVisiblePostInteractions != null
        ? `Apparently ${subject} averages about ${result.summary.avgVisiblePostInteractions} visible interactions per post.`
        : `Apparently the kittens found a few visibility problems on ${subject}.`;

    const shareText = `Kitten Soup just audited ${subject}.

Score: ${result.roastScore}/100 (${result.roastLabel})
${interactionLine}

Verdict: ${result.roastVerdict}

Try it here: ${siteUrl}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'Kitten Soup',
          text: shareText,
          url: siteUrl,
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      } else {
        throw new Error('Clipboard is not available');
      }

      setCopiedShare(true);
      window.setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      setError('The kittens failed to copy your share text. Try again.');
    }
  }

  async function handleCopyRoastCard() {
    if (!result) return;

    const siteUrl =
      typeof window !== 'undefined' ? window.location.origin : 'https://your-site-url.com';

    const cardText = `🐱 KITTEN SOUP REPORT

${result.summary.displayName}
${result.summary.pageType === 'company' ? 'Company Page' : 'Personal Profile'}

LinkedIn Score
${formatScoreLabel(result.roastScore, result.roastLabel)}

Average Engagement
${
  result.summary.avgVisiblePostInteractions != null
    ? `~${result.summary.avgVisiblePostInteractions} visible interactions`
    : 'Limited public engagement data'
}

Verdict
${result.roastVerdict}

Try it:
${siteUrl}`;

    try {
      await navigator.clipboard.writeText(cardText);
      setCopiedCard(true);
      window.setTimeout(() => setCopiedCard(false), 2200);
    } catch {
      setError('The kittens failed to copy your roast card. Try again.');
    }
  }

  return (
    <div className="page-shell">
      <section className="hero-card" style={{ position: 'relative' }}>
        <div className="cat-gif" aria-hidden="true">
          <img src={randomCatGif} alt="chaotic business cat" />
        </div>

        <p className="eyebrow">LINKEDIN FIXER FOR HUMANS, BRANDS, AND FELINES</p>
        <h1>Kitten Soup</h1>
        <p className="hero-copy">
          Paste your LinkedIn page. Tiny internet cats inspect the public bits, roast the weak spots,
          and hand back visibility tips with suspicious confidence.
        </p>
        <p className="hero-sub">{randomFact}</p>
        <p className="hero-meta">
          {stats.totalAnalyses.toLocaleString()} LinkedIn profiles judged by cats
        </p>

        <div className="input-row">
          <input
            type="url"
            placeholder="Paste a LinkedIn personal or company URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <button onClick={handleAnalyze} disabled={loading}>
            {loading ? 'cats are investigating…' : 'analyze my linkedin'}
          </button>
        </div>
      </section>

      {error ? <div className="error-card">{error}</div> : null}

      {result ? (
        <div className="results-grid">
          <section className="result-card summary-card">
            <div className="pill-row">
              <span className="pill">{result.summary.pageType}</span>
              <span className="pill">{result.summary.fetchQuality} public read</span>
              <span className="pill">{formatScoreLabel(result.roastScore, result.roastLabel)}</span>
              {result.summary.visibleEmployeeCount ? (
                <span className="pill">{result.summary.visibleEmployeeCount} employees</span>
              ) : null}
              {result.summary.avgVisiblePostInteractions ? (
                <span className="pill">~{result.summary.avgVisiblePostInteractions} avg interactions</span>
              ) : null}
            </div>
            <h2>{result.summary.displayName}</h2>
            <p className="roast-verdict">{result.roastVerdict}</p>
            <div className="score-bar-wrap" aria-hidden="true">
              <div
                className="score-bar-fill"
                style={{ width: `${Math.max(8, Math.min(result.roastScore, 100))}%` }}
              />
            </div>
          </section>

          <section className="result-card full-width">
            <div className="share-row">
              <h3>2 page fixes the kittens would make</h3>
              <div className="button-cluster">
                <button type="button" className="secondary-button" onClick={handleCopyShare}>
                  {copiedShare ? 'copied 😼' : 'copy my LinkedIn roast'}
                </button>
                <button type="button" className="secondary-button" onClick={handleCopyRoastCard}>
                  {copiedCard ? 'card copied 🐾' : 'copy roast card'}
                </button>
              </div>
            </div>

            <ol className="recommendation-list">
              {result.pageRecommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>

            <p className="share-note">
              Copy the roast or the roast card and post it on LinkedIn to summon more humans into the soup.
            </p>
          </section>

          <section className="result-card full-width gated-card">
            <div className="gated-header">
              <div>
                <h3>3 content recommendations hiding in the cardboard box</h3>
                <p>
                  Enter your email to unlock the content advice. The tiny cats may occasionally send
                  Little Post Manager updates and mildly useful internet business things.
                </p>
              </div>
            </div>

            {unlockedRecommendations ? (
              <ol className="recommendation-list unlocked">
                {unlockedRecommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : (
              <>
                <div className="gate-row">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <button onClick={handleUnlock} disabled={unlocking}>
                    {unlocking ? 'unlocking…' : 'unlock the kitten stash'}
                  </button>
                </div>
                <div className="blur-stack" aria-hidden="true">
                  {result.contentRecommendations.map((item, index) => (
                    <div key={`${item}-${index}`} className="blur-line">
                      {item}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {stats.leaderboard.length ? (
            <section className="result-card full-width leaderboard-card">
              <h3>Top roast scores today</h3>
              <div className="leaderboard-list">
                {stats.leaderboard.map((entry, index) => (
                  <div
                    key={`${entry.display_name}-${entry.created_at}-${index}`}
                    className="leaderboard-row"
                  >
                    <span className="leaderboard-rank">#{index + 1}</span>
                    <div className="leaderboard-main">
                      <strong>{entry.display_name}</strong>
                      <span>{entry.page_type}</span>
                    </div>
                    <span className="leaderboard-score">{entry.roast_score}/100</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {result.summary.fetchQuality === 'partial' ? (
            <section className="result-card full-width tips-card">
              <h3>The kittens want a better read next time</h3>
              <ul>
                {result.summary.troubleshooting.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
