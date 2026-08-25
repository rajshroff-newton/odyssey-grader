import { REPORTS, fullReportText, TaskKey } from "@/data/reports";
import { PORTRAITS, RISK_APPETITE_NOTE } from "@/data/portraits";

export type Grade = {
  score: number; // 1-5, per the fixed scale defined in the prompt
  score_rationale: string;
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

  const system = `You are grading how well an expert's rewrite of a financial market report executes for one specific target reader (portrait). This is not a comparison to the original report - you are scoring the rewrite's execution against that portrait's own checklist, on its own merits.

Do not weigh typos, spelling, or minor grammatical slips heavily. Focus entirely on substance: did the rewrite understand and serve this portrait's actual needs. A rewrite with a few typos but genuinely correct portrait execution should score well; a clean, typo-free rewrite that misunderstands the portrait should not.

You will be given a fixed checklist for this specific portrait. Go through it item by item as your primary grading mechanism - each item is a real pass/fail (or partial) test, not a vague suggestion. Your strengths and weaknesses should be directly grounded in specific checklist items, citing the actual line or omission in the rewrite, not generic writing-quality observations.

Score on this exact 1-5 scale:

1 - Spam entry. Zero use; could not be used for any portrait at all. Not a genuine attempt.
2 - Does not understand the portrait. Most of the content is irrelevant to what this specific reader needs, even if the writing itself is competent.
3 - Understands what needs to be done but didn't execute it properly. The right idea, meaningfully flawed or incomplete execution against the checklist.
4 - Good job. Serves the portrait well, with some real areas for improvement against the checklist.
5 - Perfect. Fully satisfies the checklist for this portrait with no meaningful gaps.

Also flag, separately from the checklist score:
- Any invented data - numbers, prices, or claims that don't appear in the original and aren't clearly framed as the writer's own analysis (as opposed to a fact).
- Any compliance problem - unconditional buy/sell instructions, promised returns, or advice with no stated condition attached. Conditional scenario reasoning ("if X then Y, target Z, invalidated below W") is fine and is not a violation.

Respond with ONLY a JSON object - no markdown code fences, no preamble, no text outside the JSON. Match this exact shape:

{
  "score": <integer 1-5, per the scale above>,
  "score_rationale": "<2-4 sentences explaining the score, grounded in specific checklist items>",
  "strengths": ["<specific checklist item the rewrite satisfies, citing the actual line>", ...],
  "weaknesses": ["<specific checklist item the rewrite fails or only partially meets, citing what's missing>", ...],
  "compliance_concerns": ["<specific compliance issue, quoting the phrase>", ...],
  "hallucination_check": "<one sentence: does the rewrite appear to invent data not present in or derivable from the original? Name the specific figure if so, or state that none was found>"
}

strengths, weaknesses, and compliance_concerns should be empty arrays if there's nothing to report - do not pad them with generic filler.`;

  const glossSection = portrait.glossRule
    ? `\n\nThe gloss-vs-teach rule for this portrait (read carefully, this is a primary scoring mechanism):\n${portrait.glossRule}`
    : "";

  const checklistSection = portrait.rewriteChecklist
    .map((item, i) => `${i + 1}. ${item}`)
    .join("\n\n");

  const user = `TARGET READER PROFILE (${portrait.label}, ${portrait.band})

In their own words: "${portrait.script}"

Platform behavior: ${portrait.platformBehavior}
Portfolio: ${portrait.portfolio}
Cross-asset posture: ${portrait.crossAssetPosture}

What they open a report to find out: ${portrait.wants}
What loses them: ${portrait.loses}

Vocabulary already assumed known (explaining this is padding, a real weakness): ${portrait.assumedKnown}
Vocabulary that must be handled (explained plainly for G1, or inline-glossed for G2 - see below): ${portrait.mustExplain}
${glossSection}
Actionability ceiling (what the content is allowed to give them): ${portrait.actionCeiling}
Risk framing expectation: ${portrait.riskFraming}

Note on risk appetite: ${RISK_APPETITE_NOTE}

---

THE REWRITE CHECKLIST FOR THIS PORTRAIT (your primary grading rubric)

${checklistSection}

---

ORIGINAL REPORT (${report.title}, ${report.ticker}) - for context on the underlying facts only, not for comparison scoring

${fullReportText(report)}

---

EXPERT'S REWRITE, WRITTEN FOR THIS READER

${params.rewriteText}

---

Grade the rewrite against the checklist above for this specific portrait, and respond with the JSON object described in your instructions.`;

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
}): Promise<{ grade: Grade; raw: string; promptUser: string; promptSystem: string } | { error: string }> {
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
    return { grade: parsed as Grade, raw: text, promptUser: prompt.user, promptSystem: prompt.system };
  } catch {
    return { error: `Could not parse the model's response as JSON. Raw response: ${text.slice(0, 500)}` };
  }
}
