import { BrowserRouter } from "react-router-dom";

import { AppRouter } from "./app/router";
import { ProgressProvider } from "./app/ProgressProvider";

export const App = () => (
  <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
    <ProgressProvider>
      <AppRouter />
    </ProgressProvider>
  </BrowserRouter>
);
