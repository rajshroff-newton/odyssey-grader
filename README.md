# Odyssey Grader

A separate app from the main Odyssey task app. Reads `report_submissions`
from the **same Supabase project**, and for each submission, asks Claude to
judge whether the expert's rewrite is better than the original report —
strictly through the lens of the portrait (G1/G2/G3) it was written for.

The three reports and the three portraits are hardcoded in `data/` (copied
from the main app), not fetched — the grading judge always compares against
the fixed, known-correct source text, never against something read back out
of the database.

## How grading works

1. `/api/submissions` lists every row in `report_submissions`, plus any
   existing grade for each (from `submission_grades`).
2. Clicking **Grade with AI** calls `/api/grade`, which:
   - Looks up the real submission server-side (task id, chosen portrait,
     rewrite text) — never trusts anything the browser sends about *what*
     to grade, only *which* submission id.
   - Builds a prompt from the hardcoded report + portrait data plus that
     submission's rewrite, and calls the Anthropic API.
   - Parses the model's structured JSON verdict and saves it to
     `submission_grades`.
3. If a submission's already been graded, clicking the button again reuses
   the saved grade instead of calling the model again — there's a separate
   **Re-grade** action (same button, it relabels once a grade exists) for
   when you actually want a fresh judgment.

The grade includes a verdict (`better` / `worse` / `about_the_same`), a
1–5 portrait-fit score for *both* the original and the rewrite (so you can
see the actual delta, not just a verdict), a summary, concrete
strengths/weaknesses, any compliance concerns, and a specific check for
invented data not present in the original.

## Local setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from the **same** Supabase
  project as the main app (Project Settings → API). The service role key
  bypasses Row Level Security entirely, which is the point: this app is the
  only thing (besides your own Supabase login) that can read submissions
  back out.
- `ANTHROPIC_API_KEY` — from console.anthropic.com.

```bash
npm run dev
```

Open http://localhost:3000.

## Supabase setup

Run `supabase/schema.sql` in the **same Supabase project's** SQL Editor —
this is a different repo from the main app, but the same database. It adds
one table, `submission_grades`, with RLS enabled and **zero policies** —
meaning, unlike every table in the main app, it isn't reachable by any anon
key at all. Only the service role key (used server-side here) can touch it.

## Deploying

Deploy this as its own separate Vercel project, pointed at this repo. Set
the same three env vars in Vercel's project settings (Settings →
Environment Variables) — same as local, but for production. Env var
changes only apply to the *next* deployment, not one already live, so
redeploy after setting them.

No login screen on this one — it's a small internal tool for a handful of
people, so anyone with the deployed URL can open it and see submissions.
That's a deliberate simplification, not an oversight: if this ever needs to
be locked down (e.g. handling a larger or more sensitive batch later), the
place to add that back is a simple check in the three files under
`app/api/`.

## Editing the hardcoded reports/portraits

`data/reports.ts` and `data/portraits.ts` are direct copies of the same
data from the main app (`odyssey-eval-task/data/task.ts`). If the reports
or portraits change there, copy the update over here too — there's no
shared package between the two repos, so they can drift if one changes
without the other.
