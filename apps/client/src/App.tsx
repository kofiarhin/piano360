import { BrowserRouter } from "react-router-dom";

import { AppRouter } from "./app/router";
import { ProgressProvider } from "./app/ProgressProvider";

export const App = () => (
  <BrowserRouter>
    <ProgressProvider>
      <AppRouter />
    </ProgressProvider>
  </BrowserRouter>
);
