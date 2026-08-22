import { REPORTS, fullReportText, TaskKey } from "@/data/reports";
import { PORTRAITS } from "@/data/portraits";

export type GradeVerdict = "better" | "worse" | "about_the_same";

export type Grade = {
  verdict: GradeVerdict;
  confidence: "high" | "medium" | "low";
  original_portrait_fit: number; // 1-5
  rewrite_portrait_fit: number; // 1-5
  summary: string;
  strengths: string[];
  weaknesses: string[];
  compliance_concerns: string[];
  hallucination_check: string;
};

function findTaskKey(taskId: string): TaskKey | null {
  const entry = (Object.entries(REPORTS) as [TaskKey, (typeof REPORTS)[TaskKey]][]).find(
    ([, r]) => r.taskId === taskId
  );
  return entry ? entry[0] : null;
}

function buildPrompt(params: {
  taskId: string;
  portraitKey: string;
  rewriteText: string;
}): { system: string; user: string } | { error: string } {
  const taskKey = findTaskKey(params.taskId);
  if (!taskKey) return { error: `No hardcoded report matches task_id "${params.taskId}".` };
  const report = REPORTS[taskKey];

  const portrait = PORTRAITS.find((p) => p.key === params.portraitKey);
  if (!portrait) return { error: `No hardcoded portrait matches "${params.portraitKey}".` };

  const system = `You are grading whether an expert's rewrite of a financial market report is an improvement over the original, strictly from the point of view of one specific target reader. You are not grading writing quality in the abstract — a rewrite that reads beautifully but doesn't serve this reader's actual needs is not an improvement, and a rewrite that reads plainly but is exactly what this reader needs is.

Judge only against the reader profile you're given. Do not apply your own general sense of good financial writing where it conflicts with what this specific reader wants.

Also flag, separately from the portrait-fit judgment:
- Any invented data — numbers, prices, or claims that don't appear in the original and aren't clearly framed as the writer's own analysis (as opposed to a fact).
- Any compliance problem — unconditional buy/sell instructions, promised returns, or advice with no stated condition attached. Conditional scenario reasoning ("if X then Y, target Z, invalidated below W") is fine and is not a violation.

Respond with ONLY a JSON object — no markdown code fences, no preamble, no text outside the JSON. Match this exact shape:

{
  "verdict": "better" | "worse" | "about_the_same",
  "confidence": "high" | "medium" | "low",
  "original_portrait_fit": <integer 1-5, how well the ORIGINAL report serves this reader>,
  "rewrite_portrait_fit": <integer 1-5, how well the REWRITE serves this reader>,
  "summary": "<2-3 sentences giving your overall verdict and why>",
  "strengths": ["<specific thing the rewrite does better, citing the actual line or change>", ...],
  "weaknesses": ["<specific thing the rewrite does worse or is missing>", ...],
  "compliance_concerns": ["<specific compliance issue, quoting the phrase>", ...],
  "hallucination_check": "<one sentence: does the rewrite appear to invent data not present in or derivable from the original? Name the specific figure if so, or state that none was found>"
}

strengths, weaknesses, and compliance_concerns should be empty arrays if there's nothing to report — do not pad them with generic filler.`;

  const user = `TARGET READER PROFILE (${portrait.label}, ${portrait.band})

In their own words: "${portrait.script}"

What they want: ${portrait.wants}
What loses them: ${portrait.loses}
What must be explained to them: ${portrait.mustExplain}
Actionability ceiling (what the content is allowed to give them): ${portrait.actionCeiling}
Risk framing expectation: ${portrait.riskFraming}
What a good rewrite for this reader must do: ${portrait.rewriteMust}

---

ORIGINAL REPORT (${report.title}, ${report.ticker})

${fullReportText(report)}

---

EXPERT'S REWRITE, WRITTEN FOR THIS READER

${params.rewriteText}

---

Judge whether the rewrite is better, worse, or about the same as the original for this specific reader, and respond with the JSON object described in your instructions.`;

  return { system, user };
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

export async function gradeSubmission(params: {
  taskId: string;
  portraitKey: string;
  rewriteText: string;
}): Promise<{ grade: Grade; raw: string } | { error: string }> {
  const prompt = buildPrompt(params);
  if ("error" in prompt) return { error: prompt.error };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "ANTHROPIC_API_KEY is not configured." };

  const model = process.env.GRADER_MODEL || "claude-opus-4-8";

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      }),
    });
  } catch (e) {
    return { error: `Network error calling Anthropic API: ${(e as Error).message}` };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { error: `Anthropic API error (${response.status}): ${text.slice(0, 500)}` };
  }

  const data = await response.json();
  const text: string | undefined = data?.content?.find(
    (c: { type: string }) => c.type === "text"
  )?.text;

  if (!text) return { error: "No text content in the model's response." };

  try {
    const parsed = JSON.parse(stripCodeFences(text));
    return { grade: parsed as Grade, raw: text };
  } catch {
    return { error: `Could not parse the model's response as JSON. Raw response: ${text.slice(0, 500)}` };
  }
}
