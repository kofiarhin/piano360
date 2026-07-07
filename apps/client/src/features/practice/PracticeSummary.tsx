import { Link } from "react-router-dom";

import type { PracticeSummary as PracticeSummaryType } from "./types";

export const PracticeSummary = ({ summary }: { summary: PracticeSummaryType }) => (
  <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/10" aria-labelledby="summary-title">
    <p className="text-sm font-bold uppercase tracking-wide text-clay">Complete</p>
    <h2 id="summary-title" className="mt-1 text-3xl font-black">
      Practice summary
    </h2>
    <dl className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div>
        <dt className="text-sm text-ink/60">Attempts</dt>
        <dd className="text-2xl font-black">{summary.attempts}</dd>
      </div>
      <div>
        <dt className="text-sm text-ink/60">Correct</dt>
        <dd className="text-2xl font-black">{summary.correctAttempts}</dd>
      </div>
      <div>
        <dt className="text-sm text-ink/60">Retries</dt>
        <dd className="text-2xl font-black">{summary.retryAttempts}</dd>
      </div>
      <div>
        <dt className="text-sm text-ink/60">Skipped</dt>
        <dd className="text-2xl font-black">{summary.skippedSteps}</dd>
      </div>
    </dl>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link className="rounded-md bg-ink px-4 py-2 font-bold text-white" to="/lessons">
        Back to lessons
      </Link>
      <Link className="rounded-md bg-paper px-4 py-2 font-bold text-ink ring-1 ring-ink/10" to="/progress">
        View progress
      </Link>
    </div>
  </section>
);
