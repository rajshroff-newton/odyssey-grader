import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { gradeSubmission } from "@/lib/grade-submission";

// POST /api/grade  body: { submissionId, regrade?: boolean }
//
// Looks up the actual stored submission server-side (never trusts a
// client-supplied report/rewrite), grades it, and persists the result.
// If a grade already exists and `regrade` isn't set, returns the cached
// grade instead of calling the model again.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const submissionId = body.submissionId ?? "";
  const regrade = body.regrade === true;

  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required." }, { status: 400 });
  }

  if (!regrade) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("submission_grades")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ grade: existing, cached: true });
    }
  }

  const { data: submission, error: subError } = await supabaseAdmin
    .from("report_submissions")
    .select("id, task_id, rewrite_portrait, rewrite_text")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }
  if (!submission) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  const result = await gradeSubmission({
    taskId: submission.task_id,
    portraitKey: submission.rewrite_portrait,
    rewriteText: submission.rewrite_text,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const model = process.env.GRADER_MODEL || "claude-opus-4-8";
  const { data: saved, error: saveError } = await supabaseAdmin
    .from("submission_grades")
    .insert({
      submission_id: submissionId,
      verdict: result.grade.verdict,
      confidence: result.grade.confidence,
      original_portrait_fit: result.grade.original_portrait_fit,
      rewrite_portrait_fit: result.grade.rewrite_portrait_fit,
      summary: result.grade.summary,
      strengths: result.grade.strengths ?? [],
      weaknesses: result.grade.weaknesses ?? [],
      compliance_concerns: result.grade.compliance_concerns ?? [],
      hallucination_check: result.grade.hallucination_check ?? null,
      model,
      raw_response: result.raw,
    })
    .select()
    .single();

  if (saveError) {
    // The grade itself succeeded even if saving it didn't — still return it,
    // just flagged as unsaved, rather than throwing the result away.
    return NextResponse.json({ grade: result.grade, cached: false, saveError: saveError.message });
  }

  return NextResponse.json({ grade: saved, cached: false });
}
