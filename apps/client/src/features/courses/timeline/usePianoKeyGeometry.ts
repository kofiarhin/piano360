import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";

import { isNoteId } from "../courseTypes";
import type { PianoKeyGeometry } from "./fallingNotesTypes";

export const measurePianoKeyGeometry = (root: HTMLElement): PianoKeyGeometry[] => {
  const rootRect = root.getBoundingClientRect();
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-note-id]"));

  return buttons.flatMap((button) => {
    const note = button.dataset.noteId;
    const tone = button.dataset.tone;
    if (!isNoteId(note) || (tone !== "white" && tone !== "black")) {
      return [];
    }

    const rect = button.getBoundingClientRect();
    const left = rect.left - rootRect.left;
    return {
      note,
      tone,
      left,
      width: rect.width,
      centerX: left + rect.width / 2
    };
  });
};

export const usePianoKeyGeometry = (rootRef: RefObject<HTMLElement | null>) => {
  const [geometry, setGeometry] = useState<PianoKeyGeometry[]>([]);

  const recompute = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    setGeometry(measurePianoKeyGeometry(root));
  }, [rootRef]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    recompute();
    const scrollRoot = root.querySelector<HTMLElement>(".piano-scroll");
    scrollRoot?.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);

    const Observer = window.ResizeObserver;
    const observer = Observer ? new Observer(recompute) : undefined;
    observer?.observe(root);
    if (scrollRoot) observer?.observe(scrollRoot);

    return () => {
      scrollRoot?.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
      observer?.disconnect();
    };
  }, [recompute, rootRef]);

  return geometry;
};
