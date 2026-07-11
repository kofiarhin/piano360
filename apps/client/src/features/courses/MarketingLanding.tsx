import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { SiteHeader } from "../../shared/SiteHeader";
import { CourseCard } from "./CourseCard";
import { courseQueryKeys, getCourses } from "./courseQueries";

const features = [
  {
    title: "Lessons unlock in order",
    body: "Move through a clear beginner path instead of guessing what to practice next."
  },
  {
    title: "Practice in the browser",
    body: "Use the fixed A3-C5 keyboard and get immediate feedback without installing a separate app."
  },
  {
    title: "Progress stays local",
    body: "Completed lessons and practice stats are stored on your device for quick return sessions."
  }
];

export const MarketingLanding = () => {
  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.courses({}),
    queryFn: () => getCourses({})
  });
  const featuredCourses = coursesQuery.data?.slice(0, 4) ?? [];

  return (
    <main className="min-h-[100dvh] bg-[#12110f] text-stone-100">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto grid min-h-[calc(100dvh-73px)] max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
          <div className="relative">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-amber-200/80">
              Beginner piano, structured for steady practice
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-none tracking-tight text-stone-50 md:text-7xl">
              Piano practice that stays practical.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-300">
              Piano360 turns beginner drills into short, ordered lessons with browser-based
              playback, focused feedback, and a course path you can return to any time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="rounded-lg bg-amber-200 px-5 py-3 font-black text-stone-950 transition hover:bg-amber-100 active:translate-y-0.5"
              >
                Start Learning
              </Link>
              <Link
                to="/courses"
                className="rounded-lg border border-white/15 px-5 py-3 font-black text-stone-50 transition hover:bg-white/10 active:translate-y-0.5"
              >
                Browse courses
              </Link>
            </div>
          </div>

          <div className="relative grid gap-4 lg:translate-y-6">
            <div className="rounded-lg border border-amber-200/20 bg-[#f6f2ea] p-4 text-stone-950 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)]">
              <div className="grid h-56 grid-cols-[repeat(16,minmax(0,1fr))] overflow-hidden rounded-md border border-stone-300 bg-white">
                {Array.from({ length: 16 }, (_, index) => (
                  <span
                    key={index}
                    className={[
                      "relative border-r border-stone-300 last:border-r-0",
                      [1, 3, 6, 8, 10, 13, 15].includes(index) ? "bg-stone-950" : "bg-[#fbf7ef]"
                    ].join(" ")}
                  />
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-stone-500">
                    Today&apos;s focus
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-tight">Middle C anchor</p>
                </div>
                <div className="rounded-md bg-stone-950 px-3 py-2 font-mono text-sm font-black text-stone-50">
                  7 min
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="font-mono text-xl font-black text-amber-100">A3-C5</p>
                <p className="mt-1 text-xs font-bold text-stone-400">fixed keyboard</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="font-mono text-xl font-black text-amber-100">local</p>
                <p className="mt-1 text-xs font-bold text-stone-400">progress</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="font-mono text-xl font-black text-amber-100">short</p>
                <p className="mt-1 text-xs font-bold text-stone-400">lessons</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-amber-200/80">
            Why it works
          </p>
          <h2 className="mt-3 max-w-lg text-4xl font-black leading-tight tracking-tight text-white">
            A course path built around doing, not reading.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className={[
                "rounded-lg border border-white/10 bg-white/[0.04] p-5",
                index === 0 ? "md:col-span-2" : ""
              ].join(" ")}
            >
              <h3 className="text-xl font-black tracking-tight text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-amber-200/80">
                Featured courses
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
                Start with these drills
              </h2>
            </div>
            <Link
              className="font-black text-amber-100 underline-offset-4 hover:underline"
              to="/courses"
            >
              View all courses
            </Link>
          </div>

          {coursesQuery.isLoading && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-lg border border-white/10 bg-white/[0.05]"
                />
              ))}
            </div>
          )}

          {coursesQuery.isError && (
            <div className="mt-8 rounded-lg border border-rose-200/30 bg-rose-950/30 p-5 font-bold text-rose-100">
              Could not load featured courses.
            </div>
          )}

          {featuredCourses.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCourses.map((course) => (
                <CourseCard key={course.slug} course={course} compact />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-6 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-3">
            {["Warm up", "Play the target", "Review accuracy", "Continue"].map((item, index) => (
              <div key={item} className="grid grid-cols-[auto_1fr] items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-amber-200 font-mono font-black text-stone-950">
                  {index + 1}
                </span>
                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-amber-200"
                    style={{ width: `${92 - index * 17}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-amber-200/80">
            Practice loop
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight tracking-tight text-white">
            Pick up where you stopped.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-stone-300">
            Progress is saved in local storage, so returning to a course keeps completed lessons
            visible and lets you replay drills when a hand pattern needs more time.
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-14 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">
              Ready for the first course?
            </h2>
            <p className="mt-2 text-stone-300">
              Start small, listen closely, and build a reliable keyboard map.
            </p>
          </div>
          <Link
            to="/courses"
            className="w-fit rounded-lg bg-amber-200 px-5 py-3 font-black text-stone-950 transition hover:bg-amber-100 active:translate-y-0.5"
          >
            Start Learning
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-6 text-sm font-bold text-stone-400 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3">
          <span>Piano360</span>
          <span>Structured beginner piano practice in the browser.</span>
        </div>
      </footer>
    </main>
  );
};
