'use client';

import { useMemo, useState } from 'react';

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
};

const kittenFacts = [
  'Tiny paws. Ruthless opinions.',
  'This analyzer has never respected a dress code.',
  'Your LinkedIn is being judged by a cat in sunglasses.',
  'Professional polish. Goblin delivery.',
];

export default function Analyzer() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [unlockedRecommendations, setUnlockedRecommendations] = useState<string[] | null>(null);

  const randomFact = useMemo(
    () => kittenFacts[Math.floor(Math.random() * kittenFacts.length)],
    [],
  );

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

  return (
    <div className="page-shell">
      <section className="hero-card">
        <div className="floating-kittens" aria-hidden="true">
          <span>🐈</span>
          <span>🐾</span>
          <span>🐱</span>
          <span>✨</span>
        </div>
        <p className="eyebrow">viral linkedin fixer for humans and brands</p>
        <h1>Kitten Soup</h1>
        <p className="hero-copy">
          Paste your LinkedIn page. Tiny internet cats inspect the public bits, roast the weak spots,
          and hand back visibility tips with suspicious confidence.
        </p>
        <p className="hero-sub">{randomFact}</p>

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
              {result.summary.visibleEmployeeCount ? (
                <span className="pill">{result.summary.visibleEmployeeCount} employees</span>
              ) : null}
              {result.summary.avgVisiblePostInteractions ? (
                <span className="pill">~{result.summary.avgVisiblePostInteractions} avg interactions</span>
              ) : null}
            </div>
            <h2>{result.summary.displayName}</h2>
            <p className="headline">{result.summary.headlineOrTagline}</p>
            <p className="about">{result.summary.about}</p>
          </section>

          <section className="result-card">
            <h3>2 page fixes the kittens would make</h3>
            <ol className="recommendation-list">
              {result.pageRecommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>

          <section className="result-card full-width">
            <h3>Recent post sniff test</h3>
            <div className="post-list">
              {result.summary.recentPosts.length ? (
                result.summary.recentPosts.slice(0, 8).map((post, index) => (
                  <article key={`${index}-${post.slice(0, 20)}`} className="post-chip">
                    <span>post {index + 1}</span>
                    <p>{post}</p>
                  </article>
                ))
              ) : (
                <p className="muted">
                  The cats found very few public posts. You will still get lighter recommendations, but more
                  visible recent posts will make the analysis sharper.
                </p>
              )}
            </div>
          </section>

          <section className="result-card full-width gated-card">
            <div className="gated-header">
              <div>
                <h3>3 content recommendations hiding in the cardboard box</h3>
                <p>
                  Enter your email to unlock the content advice. The tiny cats may occasionally send Little Post
                  Manager updates and mildly useful internet business things.
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
