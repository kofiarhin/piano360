import { useCallback, useEffect, useRef } from "react";
import type { CSSProperties, PointerEvent } from "react";

import { keyboardKeys } from "./courseKeyboard";
import type { NoteId } from "./courseTypes";

export type KeyVisualState = "idle" | "target" | "active" | "correct" | "wrong";
export type PianoInputSource = `pointer:${number}`;

type CoursePianoProps = {
  targetNotes: NoteId[];
  activeNotes?: NoteId[];
  correctNotes?: NoteId[];
  wrongNotes?: NoteId[];
  activeVariant?: "lesson" | "freestyle";
  disabled?: boolean;
  autoScrollNotes?: NoteId[];
  className?: string;
  fitToContainer?: boolean;
  onInput: (noteId: NoteId) => void;
  onPress?: (noteId: NoteId, source: PianoInputSource) => void;
  onRelease?: (noteId: NoteId, source: PianoInputSource) => void;
  onPrepareAudio?: () => void;
};

const whiteKeys = keyboardKeys.filter((key) => key.tone === "white");
const blackKeys = keyboardKeys.filter((key) => key.tone === "black");
const BLACK_KEY_WIDTH_PERCENT = 6.2;

const whiteIndexBefore = (noteId: NoteId) => {
  const index = keyboardKeys.findIndex((key) => key.noteId === noteId);
  return keyboardKeys.slice(0, index).filter((key) => key.tone === "white").length - 1;
};

const blackKeyLeft = (noteId: NoteId) => {
  const boundaryPercent = ((whiteIndexBefore(noteId) + 1) / whiteKeys.length) * 100;
  return `calc(${boundaryPercent}% - ${BLACK_KEY_WIDTH_PERCENT / 2}%)`;
};

const getVisualState = (
  noteId: NoteId,
  targetNotes: NoteId[],
  activeNotes: NoteId[],
  correctNotes: NoteId[],
  wrongNotes: NoteId[]
): KeyVisualState => {
  if (wrongNotes.includes(noteId)) {
    return "wrong";
  }

  if (correctNotes.includes(noteId) || activeNotes.includes(noteId)) {
    return "active";
  }

  if (targetNotes.includes(noteId)) {
    return "target";
  }

  return "idle";
};

const whiteStateClasses: Record<KeyVisualState, string> = {
  idle: "bg-[linear-gradient(180deg,#fff_0%,#f2f2f0_55%,#dbd7cf_100%)] text-zinc-900",
  target:
    "bg-[#F59E0B] text-zinc-950 ring-4 ring-[#F59E0B]/75 outline outline-2 outline-offset-[-5px] outline-amber-100 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.42),0_0_22px_rgba(245,158,11,0.42)]",
  active:
    "bg-[#10B981] text-zinc-950 ring-4 ring-[#10B981]/60 outline outline-2 outline-offset-[-5px] outline-zinc-950 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.6)]",
  correct:
    "bg-[#10B981] text-zinc-950 ring-4 ring-[#10B981]/60 outline outline-2 outline-offset-[-5px] outline-zinc-950 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.6)]",
  wrong:
    "bg-[#EF4444] text-zinc-950 ring-4 ring-[#EF4444]/60 outline outline-2 outline-offset-[-5px] outline-zinc-950 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.68)]"
};

const blackStateClasses: Record<KeyVisualState, string> = {
  idle: "bg-[linear-gradient(90deg,#050505,#242424_40%,#050505)] text-zinc-100",
  target:
    "bg-[#F59E0B] text-zinc-950 ring-4 ring-[#F59E0B]/80 outline outline-2 outline-offset-2 outline-amber-100 shadow-[0_0_0_2px_rgba(24,24,27,0.95),0_0_24px_rgba(245,158,11,0.55)]",
  active:
    "bg-[#10B981] text-zinc-950 ring-4 ring-[#10B981]/70 outline outline-2 outline-offset-2 outline-emerald-100 shadow-[0_0_0_2px_rgba(24,24,27,0.95),0_0_22px_rgba(16,185,129,0.55)]",
  correct:
    "bg-[#10B981] text-zinc-950 ring-4 ring-[#10B981]/70 outline outline-2 outline-offset-2 outline-emerald-100 shadow-[0_0_0_2px_rgba(24,24,27,0.95),0_0_22px_rgba(16,185,129,0.55)]",
  wrong:
    "bg-[#EF4444] text-zinc-950 ring-4 ring-[#EF4444]/70 outline outline-2 outline-offset-2 outline-red-100 shadow-[0_0_0_2px_rgba(24,24,27,0.95),0_0_22px_rgba(239,68,68,0.55)]"
};

const freestyleWhiteActiveClass =
  "bg-[#8B5CF6] text-zinc-950 ring-4 ring-[#8B5CF6]/60 outline outline-2 outline-offset-[-5px] outline-violet-100 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.62)]";

const freestyleBlackActiveClass =
  "bg-[#8B5CF6] text-zinc-950 ring-4 ring-[#8B5CF6]/70 outline outline-2 outline-offset-2 outline-violet-100 shadow-[0_0_0_2px_rgba(24,24,27,0.95),0_0_22px_rgba(139,92,246,0.48)]";

const stateClassFor = (
  tone: "white" | "black",
  visualState: KeyVisualState,
  activeVariant: CoursePianoProps["activeVariant"]
) => {
  if (visualState === "active" && activeVariant === "freestyle") {
    return tone === "black" ? freestyleBlackActiveClass : freestyleWhiteActiveClass;
  }

  return tone === "black" ? blackStateClasses[visualState] : whiteStateClasses[visualState];
};

type PianoKeyButtonProps = {
  noteId: NoteId;
  tone: "white" | "black";
  keyboardKey: string;
  visualState: KeyVisualState;
  activeVariant: CoursePianoProps["activeVariant"];
  disabled: boolean;
  style?: CSSProperties;
  onInput: (noteId: NoteId) => void;
  onPress?: (noteId: NoteId, source: PianoInputSource) => void;
  onRelease?: (noteId: NoteId, source: PianoInputSource) => void;
};

const PianoKeyButton = ({
  noteId,
  tone,
  keyboardKey,
  visualState,
  activeVariant,
  disabled,
  style,
  onInput,
  onPress,
  onRelease
}: PianoKeyButtonProps) => {
  const isBlack = tone === "black";
  const sourceForPointer = (event: PointerEvent<HTMLButtonElement>): PianoInputSource =>
    `pointer:${event.pointerId ?? 1}`;

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
    onInput(noteId);
    onPress?.(noteId, sourceForPointer(event));
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!disabled) {
      onRelease?.(noteId, sourceForPointer(event));
    }
  };

  return (
    <button
      type="button"
      aria-label={`${noteId}, ${tone} key, keyboard ${keyboardKey}`}
      data-note-id={noteId}
      data-tone={tone}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(event) => event.preventDefault()}
      style={style}
      className={[
        "touch-none select-none border text-center font-black shadow-sm transition active:translate-y-1 focus-visible:z-30",
        disabled ? "cursor-not-allowed opacity-75 active:translate-y-0" : "",
        isBlack
          ? "absolute top-2 z-20 h-[60%] rounded-b-md border-zinc-950 px-1 pt-8 text-xs"
          : "relative h-56 flex-1 rounded-b-lg border-zinc-300 px-1 pb-4 pt-36 text-sm sm:h-64 sm:pt-44",
        stateClassFor(tone, visualState, activeVariant)
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-1/2 grid -translate-x-1/2 place-items-center rounded-md border font-mono font-black",
          isBlack
            ? "top-3 h-6 min-w-6 border-white/20 bg-white/15 text-[0.68rem]"
            : "bottom-10 h-7 min-w-7 border-zinc-300 bg-white/70 text-xs text-zinc-700"
        ].join(" ")}
      >
        {keyboardKey}
      </span>
      <span className={isBlack ? "text-base" : "text-2xl"}>{noteId}</span>
    </button>
  );
};

export const CoursePiano = ({
  targetNotes,
  activeNotes = [],
  correctNotes = [],
  wrongNotes = [],
  activeVariant = "lesson",
  disabled = false,
  autoScrollNotes = [],
  className,
  fitToContainer = false,
  onInput,
  onPress,
  onRelease,
  onPrepareAudio
}: CoursePianoProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserInteractingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const resumeAutoScrollTimerRef = useRef<number | undefined>(undefined);
  const programmaticScrollTimerRef = useRef<number | undefined>(undefined);
  const autoScrollNotesRef = useRef(autoScrollNotes);
  const visualStateFor = (noteId: NoteId) =>
    getVisualState(noteId, targetNotes, activeNotes, correctNotes, wrongNotes);

  const centerAutoScrollNote = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || fitToContainer || isUserInteractingRef.current) {
      return;
    }

    const noteButtons = Array.from(
      scrollContainer.querySelectorAll<HTMLButtonElement>("[data-note-id]")
    );
    const targetButton =
      autoScrollNotesRef.current
        .map((noteId) => noteButtons.find((button) => button.dataset.noteId === noteId))
        .find((button) => {
          if (!button) {
            return false;
          }

          const start = button.offsetLeft;
          const end = start + button.offsetWidth;
          return (
            start < scrollContainer.scrollLeft ||
            end > scrollContainer.scrollLeft + scrollContainer.clientWidth
          );
        }) ??
      autoScrollNotesRef.current
        .map((noteId) => noteButtons.find((button) => button.dataset.noteId === noteId))
        .find(Boolean);

    if (!targetButton) {
      return;
    }

    const maxScrollLeft = Math.max(0, scrollContainer.scrollWidth - scrollContainer.clientWidth);
    const targetScrollLeft = Math.min(
      maxScrollLeft,
      Math.max(
        0,
        targetButton.offsetLeft + targetButton.offsetWidth / 2 - scrollContainer.clientWidth / 2
      )
    );

    if (Math.abs(targetScrollLeft - scrollContainer.scrollLeft) < 2) {
      return;
    }

    window.clearTimeout(programmaticScrollTimerRef.current);
    isProgrammaticScrollRef.current = true;
    scrollContainer.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
    programmaticScrollTimerRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 450);
  }, [fitToContainer]);

  const scheduleAutoScrollResume = useCallback(() => {
    window.clearTimeout(resumeAutoScrollTimerRef.current);
    resumeAutoScrollTimerRef.current = window.setTimeout(() => {
      isUserInteractingRef.current = false;
      centerAutoScrollNote();
    }, 700);
  }, [centerAutoScrollNote]);

  useEffect(() => {
    autoScrollNotesRef.current = autoScrollNotes;
    centerAutoScrollNote();
  }, [autoScrollNotes, centerAutoScrollNote]);

  useEffect(
    () => () => {
      window.clearTimeout(resumeAutoScrollTimerRef.current);
      window.clearTimeout(programmaticScrollTimerRef.current);
    },
    []
  );

  return (
    <section
      aria-label="Virtual piano"
      aria-disabled={disabled}
      className={[
        "relative min-w-0 rounded-2xl border border-stone-800 bg-stone-950 p-2 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.95)]",
        className ?? ""
      ].join(" ")}
    >
      <div className="min-w-0 rounded-xl border border-stone-700 bg-[#191511] p-2">
        <div className="h-3 rounded-t-lg bg-[linear-gradient(90deg,#2f261f,#6f3f2d,#2f261f)]" />
        <div
          ref={scrollContainerRef}
          className={[
            "piano-scroll relative rounded-b-xl bg-zinc-950 p-2",
            fitToContainer ? "overflow-x-hidden" : "overflow-x-auto"
          ].join(" ")}
          onPointerDown={() => {
            isUserInteractingRef.current = true;
            window.clearTimeout(resumeAutoScrollTimerRef.current);
          }}
          onPointerUp={scheduleAutoScrollResume}
          onPointerCancel={scheduleAutoScrollResume}
          onTouchEnd={scheduleAutoScrollResume}
          onScroll={() => {
            if (!isProgrammaticScrollRef.current) {
              isUserInteractingRef.current = true;
              scheduleAutoScrollResume();
            }
          }}
        >
          <div
            className={[
              "relative mx-auto h-64 w-full sm:h-72",
              fitToContainer ? "min-w-0" : "min-w-[30.25rem]"
            ].join(" ")}
            style={
              fitToContainer ? undefined : { minWidth: `max(100%, ${whiteKeys.length * 44}px)` }
            }
          >
            <div className="flex h-full gap-[3px]">
              {whiteKeys.map((key) => (
                <PianoKeyButton
                  key={key.noteId}
                  noteId={key.noteId}
                  tone={key.tone}
                  keyboardKey={key.keyboardKey}
                  visualState={visualStateFor(key.noteId)}
                  activeVariant={activeVariant}
                  disabled={disabled}
                  onInput={onInput}
                  onPress={onPress}
                  onRelease={onRelease}
                />
              ))}
            </div>
            {blackKeys.map((key) => (
              <PianoKeyButton
                key={key.noteId}
                noteId={key.noteId}
                tone={key.tone}
                keyboardKey={key.keyboardKey}
                visualState={visualStateFor(key.noteId)}
                activeVariant={activeVariant}
                disabled={disabled}
                style={{ left: blackKeyLeft(key.noteId), width: `${BLACK_KEY_WIDTH_PERCENT}%` }}
                onInput={onInput}
                onPress={onPress}
                onRelease={onRelease}
              />
            ))}
          </div>
        </div>
      </div>
      {disabled ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-30 cursor-wait rounded-2xl"
          onPointerDown={onPrepareAudio}
        />
      ) : null}
    </section>
  );
};
