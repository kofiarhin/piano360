import { useEffect } from "react";

import { keyboardMap } from "../courseKeyboard";
import type { NoteId } from "../courseTypes";

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"));

export const useTimelineInput = (onInput: (note: NoteId) => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target)) return;
      const note = keyboardMap[event.key.toLowerCase()];
      if (!note) return;
      event.preventDefault();
      onInput(note);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onInput]);
};
