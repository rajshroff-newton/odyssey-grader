import { REPORTS, TaskKey } from "@/data/reports";

function findTaskKey(taskId: string): TaskKey | null {
  const entry = (Object.entries(REPORTS) as [TaskKey, (typeof REPORTS)[TaskKey]][]).find(
    ([, r]) => r.taskId === taskId
  );
  return entry ? entry[0] : null;
}

// Case-insensitive substring match against the report's hidden canary
// phrase. A human working only from the visible page has no way to
// reproduce this text; if it shows up in a submitted rewrite, that's
// strong evidence the page was read programmatically (DOM text or an
// accessibility-tree snapshot, the way most browser-automation agents
// work) rather than visually by a person.
export function checkCanary(taskId: string, rewriteText: string): boolean {
  const key = findTaskKey(taskId);
  if (!key) return false;
  const canary = REPORTS[key].canary.toLowerCase();
  return rewriteText.toLowerCase().includes(canary);
}
