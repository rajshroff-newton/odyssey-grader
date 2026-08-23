-- Odyssey Grader: run this in the SAME Supabase project as the main
-- odyssey-eval-task app (SQL Editor -> New query). This table only stores
-- LLM grading verdicts; it has no anon policies at all, so - unlike every
-- other table in the main app - nothing here is reachable by any anon key.
-- Only the service role key (used server-side by this grader app) can
-- touch it.

create table if not exists public.submission_grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.report_submissions(id),
  created_at timestamptz not null default now(),

  verdict text not null,              -- 'better' | 'worse' | 'about_the_same'
  confidence text not null,           -- 'high' | 'medium' | 'low'
  original_portrait_fit int not null, -- 1-5, how well the ORIGINAL served this reader
  rewrite_portrait_fit int not null,  -- 1-5, how well the REWRITE serves this reader
  summary text not null,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  compliance_concerns jsonb not null default '[]'::jsonb,
  hallucination_check text,

  model text not null,                -- which Claude model produced this grade
  raw_response text                   -- the model's raw text, kept for audit/debugging
);

alter table public.submission_grades enable row level security;

-- Deliberately no policies added. RLS is on with zero grants, so this
-- table is unreachable by the anon key (or any other role) - only the
-- service role key, which bypasses RLS, can read or write it. That's the
-- correct default: nothing about this table should ever be public.

-- One index since the grader looks up "is there already a grade for this
-- submission" before deciding whether to call the model again.
create index if not exists submission_grades_submission_id_idx
  on public.submission_grades (submission_id);

-- The exact system and user prompts sent to the model for this grade -
-- lets you directly verify (in Supabase's Table Editor, or via the "View
-- prompt sent" toggle in the app) exactly what content and instructions
-- the model actually saw, rather than having to trust the code from memory.
alter table public.submission_grades
  add column if not exists prompt_system text,
  add column if not exists prompt_user text;
