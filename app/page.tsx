"use client";

import { useEffect, useState } from "react";
import { REPORTS, TaskKey } from "@/data/reports";
import { PORTRAITS } from "@/data/portraits";

type GradeRow = {
  submission_id?: string;
  verdict: string;
  confidence: string;
  original_portrait_fit: number;
  rewrite_portrait_fit: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  compliance_concerns?: string[];
  hallucination_check?: string;
  created_at?: string;
};

type SubmissionRow = {
  id: string;
  created_at: string;
  attempter_name: string;
  attempter_email: string;
  task_id: string;
  attempt_number: number | null;
  rewrite_portrait: string;
  rewrite_word_count: number;
  original_word_count: number;
  eval_seconds: number | null;
  rewrite_seconds: number | null;
  total_seconds: number | null;
  grade: GradeRow | null;
};

type SortKey = "user" | "task" | "time";
type SortDir = "asc" | "desc";

function findTaskKey(taskId: string): TaskKey | null {
  const entry = (Object.entries(REPORTS) as [TaskKey, (typeof REPORTS)[TaskKey]][]).find(
    ([, r]) => r.taskId === taskId
  );
  return entry ? entry[0] : null;
}

function reportLabel(taskId: string): string {
  const key = findTaskKey(taskId);
  return key ? REPORTS[key].label : taskId;
}

function sortSubmissions(rows: SubmissionRow[], key: SortKey, dir: SortDir): SubmissionRow[] {
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (key === "user") {
      cmp =
        a.attempter_name.localeCompare(b.attempter_name) ||
        a.attempter_email.localeCompare(b.attempter_email);
    } else if (key === "task") {
      cmp = reportLabel(a.task_id).localeCompare(reportLabel(b.task_id));
    } else {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

function verdictColor(verdict: string) {
  if (verdict === "better") return "border-ok bg-ok/10 text-ok";
  if (verdict === "worse") return "border-warn bg-warn/10 text-warn";
  return "border-line bg-paper text-ink/60";
}

export default function GraderPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [rewriteTexts, setRewriteTexts] = useState<Record<string, string>>({});
  const [rewriteLoading, setRewriteLoading] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "time" ? "desc" : "asc");
    }
  }

  const visibleSubmissions = sortSubmissions(submissions, sortKey, sortDir);

  async function loadSubmissions() {
    setLoadingList(true);
    setListError(null);
    const res = await fetch("/api/submissions");
    const body = await res.json();
    setLoadingList(false);

    if (!res.ok) {
      setListError(body.error ?? "Failed to load submissions.");
      return;
    }
    setSubmissions(body.submissions ?? []);
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function grade(submissionId: string, regrade: boolean) {
    setGradingId(submissionId);
    const res = await fetch("/api/grade", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ submissionId, regrade }),
    });
    const body = await res.json();
    setGradingId(null);

    if (!res.ok) {
      alert(body.error ?? "Grading failed.");
      return;
    }

    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, grade: body.grade } : s))
    );
  }

  async function toggleExpand(s: SubmissionRow) {
    const next = expandedId === s.id ? null : s.id;
    setExpandedId(next);

    if (next && rewriteTexts[s.id] === undefined) {
      setRewriteLoading(s.id);
      const res = await fetch(`/api/submissions/${s.id}`);
      const body = await res.json();
      setRewriteLoading(null);
      if (res.ok) {
        setRewriteTexts((prev) => ({ ...prev, [s.id]: body.rewrite_text ?? "" }));
      } else {
        setRewriteTexts((prev) => ({ ...prev, [s.id]: `Error: ${body.error}` }));
      }
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <header className="border-b border-line pb-4">
        <p className="font-mono text-xs uppercase tracking-wider text-brass">
          Internal · LLM grading
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Odyssey Grader</h1>
        <p className="mt-1 text-sm text-ink/60">
          Judges each rewrite against the original report, strictly through
          the lens of the portrait it was written for.
        </p>
      </header>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={loadSubmissions}
          disabled={loadingList}
          className="focus-ring rounded border border-line px-3 py-1.5 text-xs font-medium hover:border-brass hover:text-brass"
        >
          {loadingList ? "Refreshing…" : "↻ Refresh"}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/40">Sort by</span>
          {(
            [
              ["user", "User"],
              ["task", "Task"],
              ["time", "Time submitted"],
            ] as [SortKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`focus-ring rounded border px-3 py-1.5 text-xs font-medium ${
                sortKey === key
                  ? "border-brass bg-brass/10 text-brass"
                  : "border-line text-ink/60 hover:border-ink/30"
              }`}
            >
              {label}
              {sortKey === key && (sortDir === "asc" ? " ↑" : " ↓")}
            </button>
          ))}
        </div>

        <p className="text-xs text-ink/50">{submissions.length} submissions</p>
      </div>

      {listError && <p className="mt-3 text-sm text-warn">{listError}</p>}

      <div className="mt-4 space-y-3">
        {visibleSubmissions.map((s) => {
          const report = REPORTS[findTaskKey(s.task_id) ?? "sol"];
          const portrait = PORTRAITS.find((p) => p.key === s.rewrite_portrait);
          const expanded = expandedId === s.id;

          return (
            <div key={s.id} className="rounded-lg border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {s.attempter_name}{" "}
                    <span className="font-normal text-ink/50">({s.attempter_email})</span>
                  </p>
                  <p className="text-xs text-ink/50">
                    {report.label} · portrait {s.rewrite_portrait} · attempt{" "}
                    {s.attempt_number ?? "?"} · {new Date(s.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {s.grade && (
                    <span
                      className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${verdictColor(
                        s.grade.verdict
                      )}`}
                    >
                      {s.grade.verdict.replace(/_/g, " ")}
                    </span>
                  )}
                  <button
                    onClick={() => toggleExpand(s)}
                    className="focus-ring rounded border border-line px-3 py-1.5 text-xs font-medium hover:border-brass hover:text-brass"
                  >
                    {expanded ? "Hide" : "View"}
                  </button>
                  <button
                    onClick={() => grade(s.id, !!s.grade)}
                    disabled={gradingId === s.id}
                    className="focus-ring rounded bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {gradingId === s.id
                      ? "Grading…"
                      : s.grade
                        ? "Re-grade"
                        : "Grade with AI"}
                  </button>
                </div>
              </div>

              {s.grade && (
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div>
                    <p className="text-ink/40">Original fit</p>
                    <p className="font-semibold">{s.grade.original_portrait_fit} / 5</p>
                  </div>
                  <div>
                    <p className="text-ink/40">Rewrite fit</p>
                    <p className="font-semibold">{s.grade.rewrite_portrait_fit} / 5</p>
                  </div>
                  <div>
                    <p className="text-ink/40">Confidence</p>
                    <p className="font-semibold capitalize">{s.grade.confidence}</p>
                  </div>
                  <div>
                    <p className="text-ink/40">Word count</p>
                    <p className="font-semibold">
                      {s.rewrite_word_count} (orig {s.original_word_count})
                    </p>
                  </div>
                </div>
              )}

              {expanded && (
                <div className="mt-4 space-y-4 border-t border-line pt-4">
                  {portrait && (
                    <div className="rounded border border-line bg-paper px-3 py-2 text-xs text-ink/70">
                      <p className="font-semibold text-ink">
                        {portrait.label} · {portrait.band}
                      </p>
                      <p className="mt-1">
                        <span className="font-medium">Wants:</span> {portrait.wants}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                        Original report
                      </p>
                      <div className="mt-1 max-h-96 overflow-y-auto rounded border border-line px-3 py-2">
                        {report.sections.map((sec) => (
                          <div key={sec.heading} className="mb-3 last:mb-0">
                            <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-brass">
                              {sec.heading}
                            </p>
                            <p className="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-ink/90">
                              {sec.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                        Rewrite
                      </p>
                      <div className="mt-1 max-h-96 overflow-y-auto whitespace-pre-line rounded border border-line px-3 py-2 text-[13px] leading-relaxed text-ink/90">
                        {rewriteLoading === s.id && (
                          <p className="text-ink/40">Loading…</p>
                        )}
                        {rewriteTexts[s.id]}
                      </div>
                    </div>
                  </div>

                  {s.grade && (
                    <div className="rounded border border-line bg-paper px-3 py-3 text-sm">
                      <p className="font-medium text-ink">{s.grade.summary}</p>

                      {!!s.grade.strengths?.length && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-ok">
                            Strengths
                          </p>
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-ink/80">
                            {s.grade.strengths.map((s2, i) => (
                              <li key={i}>{s2}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!!s.grade.weaknesses?.length && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-warn">
                            Weaknesses
                          </p>
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-ink/80">
                            {s.grade.weaknesses.map((s2, i) => (
                              <li key={i}>{s2}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!!s.grade.compliance_concerns?.length && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-warn">
                            Compliance concerns
                          </p>
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-ink/80">
                            {s.grade.compliance_concerns.map((s2, i) => (
                              <li key={i}>{s2}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {s.grade.hallucination_check && (
                        <p className="mt-2 text-xs text-ink/60">
                          <span className="font-semibold">Data check:</span>{" "}
                          {s.grade.hallucination_check}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
