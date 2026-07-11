import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { CourseLibrary } from "./features/courses/CourseLibrary";
import { CourseOverview } from "./features/courses/CourseOverview";
import { FreestyleMode } from "./features/courses/FreestyleMode";
import { LessonPlayer } from "./features/courses/LessonPlayer";
import { MarketingLanding } from "./features/courses/MarketingLanding";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

export const App = () => {
  const [queryClient] = useState(createQueryClient);
  const [progressVersion, setProgressVersion] = useState(0);
  const bumpProgressVersion = () => setProgressVersion((current) => current + 1);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MarketingLanding />} />
          <Route
            path="/courses"
            element={<CourseLibrary onProgressReset={bumpProgressVersion} />}
          />
          <Route path="/freestyle" element={<FreestyleMode />} />
          <Route
            path="/courses/:courseSlug"
            element={<CourseOverview key={progressVersion} onProgressReset={bumpProgressVersion} />}
          />
          <Route
            path="/courses/:courseSlug/lessons/:lessonSlug"
            element={<LessonPlayer onProgressSaved={bumpProgressVersion} />}
          />
          <Route
            path="*"
            element={
              <main className="grid min-h-[100dvh] place-items-center bg-[#12110f] px-4 text-stone-100">
                <section className="max-w-lg rounded-xl border border-white/10 bg-white/[0.04] p-6">
                  <h1 className="text-3xl font-black">Page not found</h1>
                </section>
              </main>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
