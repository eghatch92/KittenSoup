import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function ensureSchema() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        linkedin_url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    client.release();
  }
}

export async function saveLead(email: string, linkedinUrl: string) {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query(
      'INSERT INTO leads (email, linkedin_url) VALUES ($1, $2)',
      [email, linkedinUrl],
    );
  } finally {
    client.release();
  }
}

export async function getLeadRows() {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const result = await client.query(
      'SELECT id, email, linkedin_url, created_at FROM leads ORDER BY created_at DESC LIMIT 500',
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getAnalytics() {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const [totalResult, domainsResult, todayResult] = await Promise.all([
      client.query('SELECT COUNT(*)::int AS count FROM leads'),
      client.query(`
        SELECT
          COALESCE(split_part(email, '@', 2), 'unknown') AS domain,
          COUNT(*)::int AS count
        FROM leads
        GROUP BY 1
        ORDER BY count DESC, domain ASC
        LIMIT 10
      `),
      client.query(`
        SELECT COUNT(*)::int AS count
        FROM leads
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `),
    ]);

    return {
      totalLeads: totalResult.rows[0]?.count ?? 0,
      last24Hours: todayResult.rows[0]?.count ?? 0,
      topDomains: domainsResult.rows,
    };
  } finally {
    client.release();
  }
}
