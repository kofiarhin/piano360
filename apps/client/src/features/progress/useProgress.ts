import { useCallback, useEffect, useMemo, useState } from "react";

import type { PracticeSummary } from "../practice/types";
import {
  createEmptyProgress,
  loadProgress,
  recordActiveExercise,
  recordExerciseCompletion,
  resetStoredProgress,
  saveProgress
} from "./storage";
import type { ProgressSnapshot, ProgressStorageState } from "./types";

export const useProgress = () => {
  const [state, setState] = useState<ProgressStorageState>(() => {
    if (typeof window === "undefined") {
      return { progress: createEmptyProgress(), storageAvailable: false };
    }

    return loadProgress();
  });

  useEffect(() => {
    setState(loadProgress());
  }, []);

  const setProgress = useCallback((progress: ProgressSnapshot) => {
    setState(saveProgress(progress));
  }, []);

  const recordCompletion = useCallback(
    (summary: PracticeSummary) => {
      setState((current) => saveProgress(recordExerciseCompletion(current.progress, summary)));
    },
    []
  );

  const markActiveExercise = useCallback((exerciseId: string) => {
    setState((current) => {
      if (current.progress.lastActiveExerciseId === exerciseId) {
        return current;
      }

      return saveProgress(recordActiveExercise(current.progress, exerciseId));
    });
  }, []);

  const resetProgress = useCallback(() => {
    setState(resetStoredProgress());
  }, []);

  return useMemo(
    () => ({
      ...state,
      setProgress,
      recordCompletion,
      markActiveExercise,
      resetProgress
    }),
    [markActiveExercise, recordCompletion, resetProgress, setProgress, state]
  );
};
