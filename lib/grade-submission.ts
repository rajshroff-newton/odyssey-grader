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

Write every text field below - strengths, weaknesses, compliance_concerns, hallucination_check, and score_rationale - in plain, everyday language, the way a person would actually talk about someone's work out loud, not the way an AI model typically writes. Say what you mean directly instead of hedging into it.

Specifically avoid: "it's important to note," "it's worth noting/mentioning," "delve into," "underscores," "highlights," "showcases," "robust," "seamless," "leverage" used as a verb, "overall" as a rationale-opener, "not only... but also" constructions, and unnecessary hedges like "could potentially" or "it seems that" when you actually mean yes or no. If a sentence you're about to write would sound at home in a typical AI-generated summary, say the same thing in plainer words instead - short, direct sentences, no throat-clearing before the actual point.

Clarification for G1's checklist specifically, on "affects their money" and "why it moved their coin": read these asset-agnostically, as referring to whatever asset THIS report actually covers - not as a requirement to bridge the report's asset back to some other asset class mentioned in the portrait's background script. G1's script describes someone who holds crypto, but the reports this portrait reads cover many asset classes (crypto, equity indices, individual stocks, ETFs), and the checklist's job is the same regardless: does the report clearly tell the reader whether the asset it's actually about is a reason to be relieved or concerned. A Nasdaq report satisfies this by giving clear, calm orientation on Nasdaq itself - "is Nasdaq doing something I should worry about" - not by additionally explaining how Nasdaq affects the reader's separate crypto holdings. Do not fail a submission on this basis alone; apply the identical standard you would to a crypto report.

Work through the checklist and write out your strengths and weaknesses BEFORE you decide on a score - the score is a conclusion you draw from that breakdown, not a separate first impression. The JSON shape below is ordered that way on purpose; fill it in top to bottom in that order.

Score on this exact 1-5 scale:

1 - Spam entry. Zero use; could not be used for any portrait at all. Not a genuine attempt.
2 - Does not understand the portrait. Most of the content is irrelevant to what this specific reader needs, even if the writing itself is competent.
3 - Understands what needs to be done but didn't execute it properly. The right idea, meaningfully flawed or incomplete execution against the checklist.
4 - Good job. Serves the portrait well, but your weaknesses list below is not empty - there is at least one real, non-trivial gap against the checklist.
5 - Perfect. Your weaknesses list below must be empty. If you have written down even one substantive weakness, the score cannot be a 5 - it is at most a 4. This is a hard rule, not a judgment call: score and weaknesses must agree.

Also flag, separately from the checklist score:
- Any invented data - numbers, prices, or claims that don't appear in the original and aren't clearly framed as the writer's own analysis (as opposed to a fact).
- Any compliance problem - unconditional buy/sell instructions, promised returns, or advice with no stated condition attached. Conditional scenario reasoning ("if X then Y, target Z, invalidated below W") is fine and is not a violation.

Respond with ONLY a JSON object - no markdown code fences, no preamble, no text outside the JSON. Match this exact shape, in this exact field order:

{
  "strengths": ["<specific checklist item the rewrite satisfies, citing the actual line>", ...],
  "weaknesses": ["<specific checklist item the rewrite fails or only partially meets, citing what's missing>", ...],
  "compliance_concerns": ["<specific compliance issue, quoting the phrase>", ...],
  "hallucination_check": "<one sentence: does the rewrite appear to invent data not present in or derivable from the original? Name the specific figure if so, or state that none was found>",
  "score": <integer 1-5, consistent with the weaknesses list above per the hard rule>,
  "score_rationale": "<2-4 sentences explaining the score, grounded in the specific checklist items above>"
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
    const parsed = JSON.parse(stripCodeFences(text)) as Grade;

    // Hard rule, enforced in code rather than trusted to the model: a score
    // of 5 requires an empty weaknesses list. If the model still produces
    // both a 5 and a non-empty weaknesses array despite the prompt asking
    // it to reason in that order, cap it at 4 here rather than let the
    // inconsistency reach the grader. This is a backstop, not the primary
    // fix - the prompt itself now asks for strengths/weaknesses before the
    // score specifically to make this less likely to happen in the first
    // place.
    if (parsed.score === 5 && Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0) {
      parsed.score = 4;
      parsed.score_rationale = `[Auto-corrected from 5 to 4: the model listed ${parsed.weaknesses.length} weakness(es) below, which is inconsistent with a perfect score.] ${parsed.score_rationale}`;
    }

    return { grade: parsed, raw: text, promptUser: prompt.user, promptSystem: prompt.system };
  } catch {
    return { error: `Could not parse the model's response as JSON. Raw response: ${text.slice(0, 500)}` };
  }
}
