import { Link } from "react-router-dom";

import type { CourseSummary } from "./courseTypes";

type CourseCardProps = {
  course: CourseSummary;
  completedCount?: number;
  compact?: boolean;
};

const labelForContentType = (value: CourseSummary["contentType"]) =>
  ({
    "single-note": "Single notes",
    chord: "Chords",
    mixed: "Mixed"
  })[value];

export const CourseCard = ({ course, completedCount, compact = false }: CourseCardProps) => (
  <Link
    to={`/courses/${course.slug}`}
    className={[
      "group flex h-full min-h-72 flex-col rounded-lg border border-stone-300/80 bg-[#f6f2ea] p-5 text-stone-950 shadow-[0_18px_60px_-44px_rgba(0,0,0,0.95)] transition hover:-translate-y-1 hover:border-amber-700/40 hover:bg-white active:translate-y-0",
      compact ? "min-h-64" : ""
    ].join(" ")}
  >
    <div className="mb-5 grid h-16 grid-cols-12 overflow-hidden rounded-md border border-stone-300 bg-white">
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className={[
            "border-r border-stone-300 last:border-r-0",
            [1, 3, 6, 8, 10].includes(index) ? "bg-stone-950" : "bg-[#f9f5ed]"
          ].join(" ")}
        />
      ))}
    </div>

    <div className="flex flex-wrap gap-2">
      <span className="rounded-md border border-stone-300 bg-white/70 px-2 py-1 font-mono text-[0.68rem] font-black uppercase tracking-[0.12em] text-stone-600">
        {labelForContentType(course.contentType)}
      </span>
      <span className="rounded-md border border-stone-300 bg-white/70 px-2 py-1 font-mono text-[0.68rem] font-black uppercase tracking-[0.12em] text-stone-600">
        {course.hand} hand
      </span>
    </div>

    <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight text-stone-950">
      {course.title}
    </h2>
    <p className="course-card-description mt-3 text-sm leading-relaxed text-stone-700">
      {course.description}
    </p>

    <div className="mt-auto flex items-end justify-between gap-3 pt-6">
      <span className="font-mono text-xs font-black uppercase tracking-[0.14em] text-stone-500">
        {course.lessonCount} lessons
      </span>
      {completedCount !== undefined && (
        <span className="rounded-md bg-stone-950 px-3 py-2 font-mono text-xs font-black text-stone-50">
          {completedCount}/{course.lessonCount}
        </span>
      )}
    </div>
  </Link>
);
