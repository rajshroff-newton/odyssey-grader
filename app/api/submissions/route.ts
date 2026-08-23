import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Next.js caches GET route handlers by default unless told otherwise - this
// route needs a fresh Supabase query on every request, since the whole
// point is showing new submissions as they come in.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/submissions
//
// Lists every row in report_submissions, most recent first, plus whatever
// grade (if any) already exists for each.
export async function GET() {
  const { data: submissions, error: subError } = await supabaseAdmin
    .from("report_submissions")
    .select(
      "id, created_at, attempter_name, attempter_email, task_id, attempt_number, rewrite_portrait, rewrite_word_count, original_word_count, eval_seconds, rewrite_seconds, total_seconds"
    )
    .order("created_at", { ascending: false });

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  const ids = (submissions ?? []).map((s) => s.id);
  const { data: grades, error: gradeError } = await supabaseAdmin
    .from("submission_grades")
    .select("*")
    .in("submission_id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);

  if (gradeError) {
    return NextResponse.json({ error: gradeError.message }, { status: 500 });
  }

  const gradeBySubmission = new Map((grades ?? []).map((g) => [g.submission_id, g]));
  const merged = (submissions ?? []).map((s) => ({
    ...s,
    grade: gradeBySubmission.get(s.id) ?? null,
  }));

  return NextResponse.json(
    { submissions: merged },
    { headers: { "Cache-Control": "no-store" } }
  );
}

