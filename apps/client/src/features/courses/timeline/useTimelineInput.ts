import { useEffect } from "react";

import { keyboardMap } from "../courseKeyboard";
import type { NoteAttempt } from "./noteInput";

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"));

const now = () => performance.now();

export const useTimelineInput = (onInput: (attempt: NoteAttempt) => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target)) return;
      const note = keyboardMap[event.key.toLowerCase()];
      if (!note) return;
      event.preventDefault();
      onInput({ note, source: "computer-keyboard", timestampMs: now() });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onInput]);
};
