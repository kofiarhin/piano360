import { Navigate, Route, Routes } from "react-router-dom";

import { HomeRoute } from "../features/home/HomeRoute";
import { LessonsRoute } from "../features/lessons/LessonsRoute";
import { LibraryRoute } from "../features/library/LibraryRoute";
import { FreePracticeRoute } from "../features/practice/FreePracticeRoute";
import { PracticeRoute } from "../features/practice/PracticeRoute";
import { ProgressRoute } from "../features/progress/ProgressRoute";
import { AppShell } from "./AppShell";

export const AppRouter = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route index element={<HomeRoute />} />
      <Route path="lessons" element={<LessonsRoute />} />
      <Route path="practice/free" element={<FreePracticeRoute />} />
      <Route path="practice/:exerciseId" element={<PracticeRoute />} />
      <Route path="library" element={<LibraryRoute />} />
      <Route path="progress" element={<ProgressRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
