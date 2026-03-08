import { cookies } from 'next/headers';
import { getAnalytics, getLeadRows } from '@/lib/db';

export const dynamic = 'force-dynamic';

type AdminSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: AdminSearchParams;
}) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get('kitten-soup-admin')?.value === 'yes';
  const params = (searchParams ? await searchParams : {}) || {};
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;
  const setupParam = Array.isArray(params.setup) ? params.setup[0] : params.setup;

  if (!isAuthed) {
    return (
      <main className="admin-shell">
        <div className="admin-wrap">
          <h1>Kitten Soup Lead Litter Box</h1>
          <p className="admin-sub">Now protected by a password because chaos has limits.</p>

          <section className="admin-card admin-auth-card">
            <h2>Enter the admin password</h2>
            <p className="muted">
              This page shows captured leads and basic analytics. Tiny paws only.
            </p>

            {setupParam === '1' ? (
              <div className="error-card">
                Add an <strong>ADMIN_PASSWORD</strong> environment variable in Render first.
              </div>
            ) : null}

            {errorParam === '1' ? (
              <div className="error-card">Wrong password. The kittens hissed.</div>
            ) : null}

            <form action="/api/admin/login" method="POST" className="gate-row">
              <input
                type="password"
                name="password"
                placeholder="admin password"
                autoComplete="current-password"
                required
              />
              <button type="submit">enter the litter box</button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  const [analytics, leads] = await Promise.all([getAnalytics(), getLeadRows()]);

  return (
    <main className="admin-shell">
      <div className="admin-wrap">
        <div className="admin-actions">
          <div>
            <h1>Kitten Soup Lead Litter Box</h1>
            <p className="admin-sub">Password protected and mildly less feral.</p>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="secondary-button">
              log out
            </button>
          </form>
        </div>

        <section className="admin-grid">
          <div className="admin-card">
            <h2>Total emails captured</h2>
            <div className="admin-stat">{analytics.totalLeads}</div>
          </div>
          <div className="admin-card">
            <h2>Leads in last 24 hours</h2>
            <div className="admin-stat">{analytics.last24Hours}</div>
          </div>
          <div className="admin-card">
            <h2>Analyses in last 24 hours</h2>
            <div className="admin-stat">{analytics.last24HourAnalyses}</div>
          </div>
        </section>

        <section className="admin-card">
          <h2>Top email domains</h2>
          <ul className="domain-list">
            {analytics.topDomains.map((row: { domain: string; count: number }) => (
              <li key={row.domain}>
                <span>{row.domain}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="table-card">
          <h2>Captured leads</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>LinkedIn URL</th>
                  <th>Captured</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: { id: number; email: string; linkedin_url: string; created_at: string }) => (
                  <tr key={lead.id}>
                    <td>{lead.email}</td>
                    <td>
                      <a href={lead.linkedin_url} target="_blank" rel="noreferrer">
                        {lead.linkedin_url}
                      </a>
                    </td>
                    <td>{new Date(lead.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
