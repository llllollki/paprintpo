@AGENTS.md

## Claude Code Notes

Stack (fixed): Next.js 15 App Router · Supabase Postgres · Drizzle ORM · Stripe · Tailwind + shadcn · Supabase Storage. No changes without explicit approval.

Key paths: `/lib` business logic · `/lib/fulfillment` fulfillment · `/lib/fulfillment/router.ts` routing engine · `/lib/fulfillment/adapters/` vendor adapters · `/lib/templates/` template logic · `/components` UI · `/docs` docs

All env vars in `.env.example`. Architecture decisions → `docs/decision-log.md`. No deployment or config edits unless asked.

Done = works locally + edge cases handled + docs updated + files summarized.
