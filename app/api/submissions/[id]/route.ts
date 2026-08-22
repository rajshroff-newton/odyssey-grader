import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/submissions/:id
//
// Returns just the rewrite_text for one submission. Split out from the list
// endpoint so loading the whole submissions table doesn't pull every full
// rewrite over the wire before anyone's asked to see it.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from("report_submissions")
    .select("rewrite_text")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  return NextResponse.json({ rewrite_text: data.rewrite_text });
}
