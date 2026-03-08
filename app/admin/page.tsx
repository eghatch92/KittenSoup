import { getAnalytics, getLeadRows } from '../../lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [analytics, leads] = await Promise.all([getAnalytics(), getLeadRows()]);

  return (
    <main className="admin-shell">
      <div className="admin-wrap">
        <h1>Kitten Soup Lead Litter Box</h1>
        <p className="admin-sub">Totally unprotected by design. Do not share this URL with random goblins.</p>

        <section className="admin-grid">
          <div className="admin-card">
            <h2>Total emails captured</h2>
            <div className="admin-stat">{analytics.totalLeads}</div>
          </div>
          <div className="admin-card">
            <h2>Last 24 hours</h2>
            <div className="admin-stat">{analytics.last24Hours}</div>
          </div>
          <div className="admin-card">
            <h2>Top email domains</h2>
            <ul className="domain-list">
              {analytics.topDomains.map((row: { domain: string; count: number }) => (
                <li key={row.domain}>
                  <span>{row.domain}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </div>
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
