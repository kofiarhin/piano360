import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";

import { isNoteId } from "../courseTypes";
import type { PianoKeyGeometry } from "./fallingNotesTypes";

export const measurePianoKeyGeometry = (root: HTMLElement): PianoKeyGeometry[] => {
  const rootRect = root.getBoundingClientRect();
  return measurePianoKeyGeometryRelativeTo(root, rootRect);
};

export const measurePianoKeyGeometryRelativeTo = (
  root: HTMLElement,
  referenceRect: Pick<DOMRect, "left">
): PianoKeyGeometry[] => {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-note-id]"));

  return buttons.flatMap((button) => {
    const note = button.dataset.noteId;
    const tone = button.dataset.tone;
    if (!isNoteId(note) || (tone !== "white" && tone !== "black")) {
      return [];
    }

    const rect = button.getBoundingClientRect();
    const left = rect.left - referenceRect.left;
    return {
      note,
      tone,
      left,
      width: rect.width,
      centerX: left + rect.width / 2
    };
  });
};

export const usePianoKeyGeometry = (
  rootRef: RefObject<HTMLElement | null>,
  stageRef?: RefObject<HTMLElement | null>
) => {
  const [geometry, setGeometry] = useState<PianoKeyGeometry[]>([]);

  const recompute = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const referenceRect =
      stageRef?.current?.getBoundingClientRect() ?? root.getBoundingClientRect();
    setGeometry(measurePianoKeyGeometryRelativeTo(root, referenceRect));
  }, [rootRef, stageRef]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    recompute();
    const scrollRoot = root.querySelector<HTMLElement>(".piano-scroll");
    scrollRoot?.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    window.addEventListener("orientationchange", recompute);

    const Observer = window.ResizeObserver;
    const observer = Observer ? new Observer(recompute) : undefined;
    observer?.observe(root);
    if (stageRef?.current) observer?.observe(stageRef.current);
    if (scrollRoot) observer?.observe(scrollRoot);

    return () => {
      scrollRoot?.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
      window.removeEventListener("orientationchange", recompute);
      observer?.disconnect();
    };
  }, [recompute, rootRef, stageRef]);

  return geometry;
};
