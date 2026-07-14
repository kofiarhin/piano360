import { useEffect } from "react";

import { keyboardMap } from "../courseKeyboard";
import type { NoteAttempt, NoteInputPhase } from "./noteInput";

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"));

const now = () => performance.now();

export const useTimelineInput = (onInput: (attempt: NoteAttempt) => void) => {
  useEffect(() => {
    const emitAttempt = (event: KeyboardEvent, phase: NoteInputPhase) => {
      if (isEditableTarget(event.target)) return;
      const note = keyboardMap[event.key.toLowerCase()];
      if (!note) return;
      event.preventDefault();
      onInput({ note, source: "computer-keyboard", timestampMs: now(), phase });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      emitAttempt(event, "press");
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      emitAttempt(event, "release");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [onInput]);
};
