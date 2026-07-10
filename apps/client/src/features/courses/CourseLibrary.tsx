import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import type { ContentType, CourseFilters, Difficulty, Hand } from "./courseTypes";
import { courseQueryKeys, getCourses } from "./courseQueries";
import { loadProgress, resetStoredProgress } from "./progressStorage";

type FilterSelectProps<T extends string> = {
  label: string;
  value: T | "";
  options: Array<{ label: string; value: T }>;
  onChange: (value: T | "") => void;
};

const FilterSelect = <T extends string>({ label, value, options, onChange }: FilterSelectProps<T>) => (
  <label className="grid gap-2 text-sm font-bold text-stone-200">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T | "")}
      className="rounded-lg border border-white/10 bg-stone-950 px-3 py-2 text-stone-100 outline-none transition focus:border-amber-300"
    >
      <option value="">All</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

type CourseLibraryProps = {
  filters: CourseFilters;
  setFilters: (filters: CourseFilters) => void;
  onProgressReset: () => void;
};

export const CourseLibrary = ({ filters, setFilters, onProgressReset }: CourseLibraryProps) => {
  const progressState = loadProgress();
  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.courses(filters),
    queryFn: () => getCourses(filters)
  });

  return (
    <main className="min-h-[100dvh] bg-[#12110f] text-stone-100">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-6 md:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-10">
        <section className="lg:sticky lg:top-8 lg:self-start">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-amber-200/80">
            Course Library
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-black leading-none tracking-tight text-stone-50 md:text-6xl">
            Piano360
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-stone-300">
            Choose a course, unlock lessons in order, and practice with the fixed A3-C5 keyboard.
          </p>

          <div className="mt-6 grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <FilterSelect<ContentType>
              label="Content type"
              value={filters.contentType ?? ""}
              options={[
                { label: "Single notes", value: "single-note" },
                { label: "Chords", value: "chord" },
                { label: "Mixed", value: "mixed" }
              ]}
              onChange={(contentType) => setFilters({ ...filters, contentType: contentType || undefined })}
            />
            <FilterSelect<Hand>
              label="Hand"
              value={filters.hand ?? ""}
              options={[
                { label: "Left", value: "left" },
                { label: "Right", value: "right" }
              ]}
              onChange={(hand) => setFilters({ ...filters, hand: hand || undefined })}
            />
            <FilterSelect<Difficulty>
              label="Difficulty"
              value={filters.difficulty ?? ""}
              options={[{ label: "Beginner", value: "beginner" }]}
              onChange={(difficulty) => setFilters({ ...filters, difficulty: difficulty || undefined })}
            />
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => {
                  resetStoredProgress();
                  onProgressReset();
                }}
                className="rounded-lg border border-rose-200/30 bg-rose-950/40 px-3 py-2 text-left text-sm font-black text-rose-100 transition active:translate-y-0.5"
              >
                Reset local progress
              </button>
            )}
          </div>

          {progressState.storageIssue && (
            <p className="mt-4 rounded-lg border border-amber-200/30 bg-amber-950/30 px-3 py-2 text-sm font-bold text-amber-100">
              {progressState.storageIssue}
            </p>
          )}
        </section>

        <section className="grid content-start gap-4" aria-label="Courses">
          {coursesQuery.isLoading &&
            Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-xl border border-white/10 bg-white/[0.05]"
              />
            ))}

          {coursesQuery.isError && (
            <div className="rounded-xl border border-rose-200/30 bg-rose-950/30 p-5 font-bold text-rose-100">
              Could not load courses.
            </div>
          )}

          {coursesQuery.data?.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-black text-white">No courses match these filters</h2>
              <p className="mt-2 text-stone-300">Clear one filter to return to the course list.</p>
            </div>
          )}

          {coursesQuery.data?.map((course) => {
            const completedCount = progressState.progress.completedLessons[course.slug]?.length ?? 0;

            return (
              <Link
                key={course.slug}
                to={`/courses/${course.slug}`}
                className="group rounded-xl border border-white/10 bg-[#f6f2ea] p-5 text-stone-950 shadow-[0_18px_60px_-44px_rgba(0,0,0,0.95)] transition hover:-translate-y-0.5 hover:border-amber-700/30 active:translate-y-0"
              >
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                      {course.contentType} / {course.hand} hand / {course.difficulty}
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-stone-950">
                      {course.title}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-700">
                      {course.description}
                    </p>
                  </div>
                  <div className="rounded-lg border border-stone-300 bg-white/60 px-3 py-2 font-mono text-sm font-black">
                    {completedCount}/{course.lessonCount} complete
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
};
