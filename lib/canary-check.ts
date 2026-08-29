import { REPORTS, TaskKey } from "@/data/reports";

function findTaskKey(taskId: string): TaskKey | null {
  const entry = (Object.entries(REPORTS) as [TaskKey, (typeof REPORTS)[TaskKey]][]).find(
    ([, r]) => r.taskId === taskId
  );
  return entry ? entry[0] : null;
}

// Pulls just the distinctive number out of a canary phrase - e.g. "0.62"
// out of "options put/call ratio near 0.62, lowest in three weeks", or
// "61,940.15" out of "worth watching if price slips toward $61,940.15".
// Every canary in data/reports.ts is built around exactly one such number,
// so one generic regex covers all of them - no per-report special-casing
// needed, now or when new reports get added.
function extractCanaryNumber(canary: string): string | null {
  const match = canary.match(/[\d,]+\.\d+/);
  return match ? match[0] : null;
}

// Escapes a string for safe use inside a RegExp. The only special regex
// character a canary number can contain is the decimal point.
function escapeForRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Checks for the canary's distinctive number specifically, not the whole
// original sentence. The task is a rewrite - the entire point is that
// every sentence gets reworded - so requiring the exact original phrasing
// to survive intact would miss the common case where someone folds the
// number into their own sentence ("our positioning gauge sits around
// 0.62") while the wording around it changes completely. The number is
// the actual unreproducible part; the sentence around it never was.
//
// Also still checks for the full original phrase verbatim, since a
// word-for-word match (rarer, but it happens) is an even stronger signal
// and costs nothing extra to check for alongside the number.
//
// The number match requires it not to be immediately preceded or followed
// by another digit, so "0.62" doesn't false-positive inside an unrelated
// number like "10.62" or "30.625".
export function checkCanary(taskId: string, rewriteText: string): boolean {
  const key = findTaskKey(taskId);
  if (!key) return false;

  const canary = REPORTS[key].canary;

  if (rewriteText.toLowerCase().includes(canary.toLowerCase())) {
    return true;
  }

  const number = extractCanaryNumber(canary);
  if (!number) return false;

  const pattern = new RegExp(`(?<!\\d)${escapeForRegex(number)}(?!\\d)`);
  return pattern.test(rewriteText);
}
