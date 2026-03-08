# Kitten Soup

Kitten Soup is a kitten-chaos single-page LinkedIn analyzer built as a lead magnet for Little Post Manager.

## What it does

- Accepts a LinkedIn personal or company URL
- Reads whatever public page information is visible
- Generates 2 page-level recommendations immediately
- Gates 3 content recommendations behind an email unlock
- Stores only `email` and `linkedin_url`
- Provides a public `/admin` page with lead and analytics visibility

## Stack

- Next.js App Router
- OpenAI Responses API
- PostgreSQL via `pg`
- Render blueprint for app + database

## Local setup

1. Copy `.env.example` to `.env.local`
2. Add your OpenAI API key
3. Point `DATABASE_URL` at Postgres
4. Install packages
5. Run the app

```bash
npm install
npm run dev
```

## Routes

- `/` main analyzer
- `/admin` lead table and basic analytics
- `/api/analyze` analyzes a public LinkedIn URL
- `/api/unlock` saves lead and reveals gated content recommendations

## Notes

- This MVP intentionally avoids LinkedIn login and SSI handling.
- If a page is only partly readable, Kitten Soup still returns lighter recommendations and troubleshooting tips.
- The admin page is intentionally open because that is what was requested. Add auth before using in a broader real-world setup.

## Render deployment

This repo includes `render.yaml` so you can deploy as a Blueprint.

You will still need to add your `OPENAI_API_KEY` in Render.
