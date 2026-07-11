import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { SiteHeader } from "../../shared/SiteHeader";
import { CourseCard } from "./CourseCard";
import type { ContentType, CourseFilters, CourseSummary, Difficulty, Hand } from "./courseTypes";
import { courseQueryKeys, getCourses } from "./courseQueries";
import { loadProgress, resetStoredProgress } from "./progressStorage";

const COURSES_PER_PAGE = 8;

const contentTypeOptions: Array<{ label: string; value: ContentType }> = [
  { label: "Single notes", value: "single-note" },
  { label: "Chords", value: "chord" },
  { label: "Mixed", value: "mixed" }
];
const handOptions: Array<{ label: string; value: Hand }> = [
  { label: "Left", value: "left" },
  { label: "Right", value: "right" }
];
const difficultyOptions: Array<{ label: string; value: Difficulty }> = [
  { label: "Beginner", value: "beginner" }
];

const validContentTypes = new Set<ContentType>(contentTypeOptions.map((option) => option.value));
const validHands = new Set<Hand>(handOptions.map((option) => option.value));
const validDifficulties = new Set<Difficulty>(difficultyOptions.map((option) => option.value));

type CatalogueState = CourseFilters & {
  q: string;
  page: number;
};

type FilterSelectProps<T extends string> = {
  label: string;
  value: T | "";
  options: Array<{ label: string; value: T }>;
  onChange: (value: T | "") => void;
};

const isValidContentType = (value: string | null): value is ContentType =>
  value !== null && validContentTypes.has(value as ContentType);
const isValidHand = (value: string | null): value is Hand =>
  value !== null && validHands.has(value as Hand);
const isValidDifficulty = (value: string | null): value is Difficulty =>
  value !== null && validDifficulties.has(value as Difficulty);

const parsePage = (value: string | null) => {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const parseCatalogueState = (searchParams: URLSearchParams): CatalogueState => ({
  q: searchParams.get("q")?.trim() ?? "",
  contentType: isValidContentType(searchParams.get("contentType"))
    ? (searchParams.get("contentType") as ContentType)
    : undefined,
  hand: isValidHand(searchParams.get("hand")) ? (searchParams.get("hand") as Hand) : undefined,
  difficulty: isValidDifficulty(searchParams.get("difficulty"))
    ? (searchParams.get("difficulty") as Difficulty)
    : undefined,
  page: parsePage(searchParams.get("page"))
});

const buildSearchParams = (state: CatalogueState) => {
  const params = new URLSearchParams();

  if (state.q.trim()) {
    params.set("q", state.q.trim());
  }

  if (state.contentType) {
    params.set("contentType", state.contentType);
  }

  if (state.hand) {
    params.set("hand", state.hand);
  }

  if (state.difficulty) {
    params.set("difficulty", state.difficulty);
  }

  if (state.page > 1) {
    params.set("page", String(state.page));
  }

  return params;
};

const filterCourses = (courses: CourseSummary[], state: CatalogueState) => {
  const query = state.q.toLowerCase();

  return courses.filter((course) => {
    const matchesSearch =
      !query ||
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query);
    const matchesContentType = !state.contentType || course.contentType === state.contentType;
    const matchesHand = !state.hand || course.hand === state.hand;
    const matchesDifficulty = !state.difficulty || course.difficulty === state.difficulty;

    return matchesSearch && matchesContentType && matchesHand && matchesDifficulty;
  });
};

const FilterSelect = <T extends string>({
  label,
  value,
  options,
  onChange
}: FilterSelectProps<T>) => (
  <label className="grid gap-2 text-sm font-bold text-stone-200">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T | "")}
      className="min-h-11 rounded-lg border border-white/10 bg-stone-950 px-3 py-2 text-stone-100 outline-none transition focus:border-amber-300"
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
  onProgressReset: () => void;
};

export const CourseLibrary = ({ onProgressReset }: CourseLibraryProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const progressState = loadProgress();
  const catalogueState = useMemo(() => parseCatalogueState(searchParams), [searchParams]);
  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.courses({}),
    queryFn: () => getCourses({})
  });
  const filteredCourses = useMemo(
    () => filterCourses(coursesQuery.data ?? [], catalogueState),
    [catalogueState, coursesQuery.data]
  );
  const pageCount = Math.max(1, Math.ceil(filteredCourses.length / COURSES_PER_PAGE));
  const page = Math.min(catalogueState.page, pageCount);
  const visibleCourses = filteredCourses.slice(
    (page - 1) * COURSES_PER_PAGE,
    page * COURSES_PER_PAGE
  );
  const hasActiveFilters = Boolean(
    catalogueState.q ||
    catalogueState.contentType ||
    catalogueState.hand ||
    catalogueState.difficulty
  );

  useEffect(() => {
    if (!coursesQuery.data) {
      return;
    }

    const normalizedParams = buildSearchParams({
      ...catalogueState,
      page
    });

    if (normalizedParams.toString() !== searchParams.toString()) {
      setSearchParams(normalizedParams, { replace: true });
    }
  }, [catalogueState, coursesQuery.data, page, searchParams, setSearchParams]);

  const updateCatalogueState = (updates: Partial<CatalogueState>, replace = false) => {
    setSearchParams(
      buildSearchParams({
        ...catalogueState,
        ...updates,
        page: updates.page ?? 1
      }),
      { replace }
    );
  };

  return (
    <main className="min-h-[100dvh] bg-[#12110f] text-stone-100">
      <SiteHeader />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 lg:py-10">
        <header className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-amber-200/80">
              Course library
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
              Course catalogue
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-300">
              Search beginner courses, narrow by hand or drill type, and jump into the next lesson.
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <label className="grid gap-2 text-sm font-bold text-stone-200">
              Search courses
              <input
                type="search"
                value={catalogueState.q}
                onChange={(event) => updateCatalogueState({ q: event.target.value }, true)}
                placeholder="Search title or description"
                className="min-h-11 rounded-lg border border-white/10 bg-stone-950 px-3 py-2 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              <FilterSelect<ContentType>
                label="Content type"
                value={catalogueState.contentType ?? ""}
                options={contentTypeOptions}
                onChange={(contentType) =>
                  updateCatalogueState({ contentType: contentType || undefined })
                }
              />
              <FilterSelect<Hand>
                label="Hand"
                value={catalogueState.hand ?? ""}
                options={handOptions}
                onChange={(hand) => updateCatalogueState({ hand: hand || undefined })}
              />
              <FilterSelect<Difficulty>
                label="Difficulty"
                value={catalogueState.difficulty ?? ""}
                options={difficultyOptions}
                onChange={(difficulty) =>
                  updateCatalogueState({ difficulty: difficulty || undefined })
                }
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-stone-300">
                {filteredCourses.length} {filteredCourses.length === 1 ? "result" : "results"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateCatalogueState({
                      q: "",
                      contentType: undefined,
                      hand: undefined,
                      difficulty: undefined
                    })
                  }
                  disabled={!hasActiveFilters}
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm font-black text-stone-100 transition hover:bg-white/10 active:translate-y-0.5 disabled:opacity-45"
                >
                  Clear Filters
                </button>
                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={() => {
                      resetStoredProgress();
                      onProgressReset();
                    }}
                    className="rounded-lg border border-rose-200/30 bg-rose-950/40 px-3 py-2 text-sm font-black text-rose-100 transition active:translate-y-0.5"
                  >
                    Reset local progress
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {progressState.storageIssue && (
          <p className="rounded-lg border border-amber-200/30 bg-amber-950/30 px-3 py-2 text-sm font-bold text-amber-100">
            {progressState.storageIssue}
          </p>
        )}

        <section className="grid content-start gap-5" aria-label="Courses">
          {coursesQuery.isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-lg border border-white/10 bg-white/[0.05]"
                />
              ))}
            </div>
          )}

          {coursesQuery.isError && (
            <div className="rounded-lg border border-rose-200/30 bg-rose-950/30 p-5 font-bold text-rose-100">
              Could not load courses.
            </div>
          )}

          {coursesQuery.data && filteredCourses.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-black text-white">No courses match these filters</h2>
              <p className="mt-2 text-stone-300">
                Clear search or filters to return to the course list.
              </p>
            </div>
          )}

          {visibleCourses.length > 0 && (
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visibleCourses.map((course) => (
                <CourseCard
                  key={course.slug}
                  course={course}
                  completedCount={progressState.progress.completedLessons[course.slug]?.length ?? 0}
                />
              ))}
            </div>
          )}
        </section>

        {filteredCourses.length > COURSES_PER_PAGE && (
          <nav
            className="flex flex-wrap items-center justify-center gap-2"
            aria-label="Course catalogue pagination"
          >
            <button
              type="button"
              onClick={() => updateCatalogueState({ page: page - 1 })}
              disabled={page === 1}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm font-black text-stone-100 transition hover:bg-white/10 active:translate-y-0.5 disabled:opacity-45"
            >
              Previous
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => updateCatalogueState({ page: pageNumber })}
                aria-current={page === pageNumber ? "page" : undefined}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-black transition active:translate-y-0.5",
                  page === pageNumber
                    ? "bg-amber-200 text-stone-950"
                    : "border border-white/15 text-stone-100 hover:bg-white/10"
                ].join(" ")}
              >
                Page {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => updateCatalogueState({ page: page + 1 })}
              disabled={page === pageCount}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm font-black text-stone-100 transition hover:bg-white/10 active:translate-y-0.5 disabled:opacity-45"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </main>
  );
};
