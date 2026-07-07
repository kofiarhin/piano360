import { createContext, useContext, type ReactNode } from "react";

import { useProgress } from "../features/progress/useProgress";

type ProgressContextValue = ReturnType<typeof useProgress>;

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const progress = useProgress();

  return <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>;
};

export const useProgressContext = () => {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error("useProgressContext must be used inside ProgressProvider.");
  }

  return context;
};
