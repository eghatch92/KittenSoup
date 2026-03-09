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
  confidence: 'high' | 'medium' | 'low';
  leaderboardEligible: boolean;
};

type PublicStats = {
  totalAnalyses: number;
  leaderboard: Array<{
    display_name: string;
    page_type: string;
    roast_score: number;
    confidence?: string;
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

const loadingSteps = [
  '🐾 sniffing the profile',
  '🐾 reading the public bits',
  '🐾 judging the engagement',
  '🐾 writing the roast',
  '🐾 checking for suspiciously low likes',
  '🐾 counting the visible posts',
  '🐾 investigating headline energy',
  '🐾 evaluating your thought leadership',
  '🐾 consulting the senior kitten board',
  '🐾 measuring organic reach vibes',
  '🐾 scanning for abandoned content strategy',
  '🐾 checking for marketing cat approval',
  '🐾 investigating engagement crumbs',
  '🐾 reviewing recent post behavior',
  '🐾 consulting the cat CEO',
  '🐾 inspecting brand presence',
  '🐾 detecting dormant LinkedIn energy',
  '🐾 reviewing audience reactions',
  '🐾 analyzing professional catnip levels',
  '🐾 evaluating post consistency',
  '🐾 investigating algorithm friendliness',
  '🐾 inspecting engagement patterns',
  '🐾 preparing the judgment scroll',
  '🐾 sharpening the roast claws',
  '🐾 warming up the verdict',
  '🐾 compiling the kitten report',
  '🐾 double-checking the cat math',
  '🐾 reviewing the final roast',
  '🐾 printing the kitten verdict',
  '🐾 finishing the analysis',
];

function formatScoreLabel(score: number, label: string) {
  return `${score}/100 · ${label}`;
}

function formatConfidenceLabel(confidence: 'high' | 'medium' | 'low') {
  if (confidence === 'high') return 'high confidence';
  if (confidence === 'medium') return 'medium confidence';
  return 'low confidence';
}

export default function Analyzer() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [stats, setStats] = useState<PublicStats>({ totalAnalyses: 0, leaderboard: [] });
  const [unlockedRecommendations, setUnlockedRecommendations] = useState<string[] | null>(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

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

  useEffect(() => {
    if (!loading) {
      setLoadingStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStepIndex((current) => (current + 1) % loadingSteps.length);
    }, 1400);

    return () => window.clearInterval(interval);
  }, [loading]);

  async function handleAnalyze() {
    const cleanedUrl = url.trim();

    if (!cleanedUrl) {
      setError('Paste a LinkedIn URL first, tiny goblin.');
      return;
    }

    setLoading(true);
    setLoadingStepIndex(0);
    setError(null);
    setResult(null);
    setUnlockedRecommendations(null);
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

  async function handleCopyRoastCard() {
    if (!result) return;

    const siteUrl =
      typeof window !== 'undefined' ? window.location.origin : 'https://your-site-url.com';

    const cardText = `🐱 KITTEN SOUP REPORT

${result.summary.displayName}
${result.summary.pageType === 'company' ? 'Company Page' : 'Personal Profile'}

LinkedIn Score
${formatScoreLabel(result.roastScore, result.roastLabel)}

Confidence
${formatConfidenceLabel(result.confidence)}

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

        {loading ? (
          <div className="loading-card" aria-live="polite">
            <div className="loading-dots">
              <span />
              <span />
              <span />
            </div>
            <p>{loadingSteps[loadingStepIndex]}</p>
          </div>
        ) : null}
      </section>

      {error ? <div className="error-card">{error}</div> : null}

      {result ? (
        <div className="results-grid">
          <section className="result-card summary-card">
            <div className="pill-row">
              <span className="pill">{result.summary.pageType}</span>
              <span className="pill">{result.summary.fetchQuality} public read</span>
              <span className="pill">{formatScoreLabel(result.roastScore, result.roastLabel)}</span>
              <span className="pill">{formatConfidenceLabel(result.confidence)}</span>
              {result.summary.visibleEmployeeCount ? (
                <span className="pill">{result.summary.visibleEmployeeCount} employees</span>
              ) : null}
              {result.summary.avgVisiblePostInteractions ? (
                <span className="pill">~{result.summary.avgVisiblePostInteractions} avg interactions</span>
              ) : null}
            </div>
            <h2>{result.summary.displayName}</h2>
            <p className="roast-verdict">{result.roastVerdict}</p>
            {result.confidence === 'low' ? (
              <p className="confidence-note">
                Limited public LinkedIn data means this score is more estimate than gospel.
              </p>
            ) : null}
          </section>

          <section className="result-card full-width">
            <div className="share-row">
              <h3>2 page fixes the kittens would make</h3>
              <div className="button-cluster">
                <button type="button" className="secondary-button" onClick={handleCopyRoastCard}>
                  {copiedCard ? 'copied 😼 now post it on LinkedIn' : 'copy my roast card and post to LinkedIn'}
                </button>
              </div>
            </div>

            <ol className="recommendation-list">
              {result.pageRecommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>

            <p className="share-note">
              Copy the roast card, paste it into LinkedIn, and send more humans into the soup.
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
