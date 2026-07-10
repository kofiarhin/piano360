import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { LessonScreen } from "./features/lessons/LessonScreen";

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

  return (
    <QueryClientProvider client={queryClient}>
      <LessonScreen />
    </QueryClientProvider>
  );
};
