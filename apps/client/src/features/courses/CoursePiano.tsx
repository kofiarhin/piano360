import { forwardRef, useCallback, useEffect, useRef } from "react";
import type { CSSProperties, PointerEvent } from "react";

import { keyboardKeys } from "./courseKeyboard";
import type { NoteId } from "./courseTypes";

export type KeyVisualState = "idle" | "target" | "active" | "correct" | "wrong";
export type PianoInputSource = `pointer:${number}`;
export type PianoSize = "compact" | "standard" | "large";
export type PianoOrientationMode = "responsive" | "mobile-landscape";

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
  size?: PianoSize;
  orientationMode?: PianoOrientationMode;
  onInput: (noteId: NoteId) => void;
  onPress?: (noteId: NoteId, source: PianoInputSource) => void;
  onRelease?: (noteId: NoteId, source: PianoInputSource) => void;
  onPrepareAudio?: () => void;
};

const whiteKeys = keyboardKeys.filter((key) => key.tone === "white");
const blackKeys = keyboardKeys.filter((key) => key.tone === "black");
type PianoSizeConfig = {
  keyboardHeightClass: string;
  whiteKeyHeightClass: string;
  blackKeyHeightPercent: number;
  blackKeyWidthPercent: number;
  minimumWhiteKeyWidth: number;
  keyGapClass: string;
  whiteKeyPaddingClass: string;
  blackKeyPaddingClass: string;
  noteLabelClass: string;
  whiteShortcutBadgeClass: string;
  blackShortcutBadgeClass: string;
  shellPaddingClass: string;
  innerShellPaddingClass: string;
  scrollPaddingClass: string;
  railHeightClass: string;
};

const pianoSizeConfigs: Record<PianoSize, PianoSizeConfig> = {
  compact: {
    keyboardHeightClass: "h-36",
    whiteKeyHeightClass: "h-32",
    blackKeyHeightPercent: 58,
    blackKeyWidthPercent: 5.8,
    minimumWhiteKeyWidth: 34,
    keyGapClass: "gap-[2px]",
    whiteKeyPaddingClass: "px-0.5 pb-2 pt-20",
    blackKeyPaddingClass: "px-0.5 pt-5",
    noteLabelClass: "text-sm",
    whiteShortcutBadgeClass:
      "bottom-7 h-5 min-w-5 border-zinc-300 bg-white/70 text-[0.62rem] text-zinc-700",
    blackShortcutBadgeClass: "top-2 h-4 min-w-4 border-white/20 bg-white/15 text-[0.55rem]",
    shellPaddingClass: "p-1",
    innerShellPaddingClass: "p-1",
    scrollPaddingClass: "p-1",
    railHeightClass: "h-2"
  },
  standard: {
    keyboardHeightClass: "h-64 sm:h-72",
    whiteKeyHeightClass: "h-56 sm:h-64",
    blackKeyHeightPercent: 60,
    blackKeyWidthPercent: 6.2,
    minimumWhiteKeyWidth: 44,
    keyGapClass: "gap-[3px]",
    whiteKeyPaddingClass: "px-1 pb-4 pt-36 sm:pt-44",
    blackKeyPaddingClass: "px-1 pt-8",
    noteLabelClass: "text-2xl",
    whiteShortcutBadgeClass:
      "bottom-10 h-7 min-w-7 border-zinc-300 bg-white/70 text-xs text-zinc-700",
    blackShortcutBadgeClass: "top-3 h-6 min-w-6 border-white/20 bg-white/15 text-[0.68rem]",
    shellPaddingClass: "p-2",
    innerShellPaddingClass: "p-2",
    scrollPaddingClass: "p-2",
    railHeightClass: "h-3"
  },
  large: {
    keyboardHeightClass: "h-72 sm:h-80",
    whiteKeyHeightClass: "h-64 sm:h-72",
    blackKeyHeightPercent: 61,
    blackKeyWidthPercent: 6.6,
    minimumWhiteKeyWidth: 52,
    keyGapClass: "gap-1",
    whiteKeyPaddingClass: "px-1.5 pb-5 pt-44 sm:pt-52",
    blackKeyPaddingClass: "px-1.5 pt-10",
    noteLabelClass: "text-3xl",
    whiteShortcutBadgeClass:
      "bottom-12 h-8 min-w-8 border-zinc-300 bg-white/70 text-sm text-zinc-700",
    blackShortcutBadgeClass: "top-4 h-7 min-w-7 border-white/20 bg-white/15 text-xs",
    shellPaddingClass: "p-3",
    innerShellPaddingClass: "p-3",
    scrollPaddingClass: "p-3",
    railHeightClass: "h-4"
  }
};

const whiteIndexBefore = (noteId: NoteId) => {
  const index = keyboardKeys.findIndex((key) => key.noteId === noteId);
  return keyboardKeys.slice(0, index).filter((key) => key.tone === "white").length - 1;
};

const blackKeyStyle = (noteId: NoteId, config: PianoSizeConfig): CSSProperties => {
  const boundaryPercent = ((whiteIndexBefore(noteId) + 1) / whiteKeys.length) * 100;

  return {
    left: `calc(${boundaryPercent}% - ${config.blackKeyWidthPercent / 2}%)`,
    width: `${config.blackKeyWidthPercent}%`,
    height: `${config.blackKeyHeightPercent}%`
  };
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
  sizeConfig: PianoSizeConfig;
  onInput: (noteId: NoteId) => void;
  onPress?: (noteId: NoteId, source: PianoInputSource) => void;
  onRelease?: (noteId: NoteId, source: PianoInputSource) => void;
  onPrepareAudio?: () => void;
};

const PianoKeyButton = ({
  noteId,
  tone,
  keyboardKey,
  visualState,
  activeVariant,
  disabled,
  style,
  sizeConfig,
  onInput,
  onPress,
  onRelease,
  onPrepareAudio
}: PianoKeyButtonProps) => {
  const isBlack = tone === "black";
  const sourceForPointer = (event: PointerEvent<HTMLButtonElement>): PianoInputSource =>
    `pointer:${event.pointerId ?? 1}`;

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onPrepareAudio?.();

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
          ? [
              "absolute top-2 z-20 rounded-b-md border-zinc-950",
              sizeConfig.blackKeyPaddingClass
            ].join(" ")
          : [
              "relative flex-1 rounded-b-lg border-zinc-300",
              sizeConfig.whiteKeyHeightClass,
              sizeConfig.whiteKeyPaddingClass
            ].join(" "),
        stateClassFor(tone, visualState, activeVariant)
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-1/2 grid -translate-x-1/2 place-items-center rounded-md border font-mono font-black",
          isBlack ? sizeConfig.blackShortcutBadgeClass : sizeConfig.whiteShortcutBadgeClass
        ].join(" ")}
      >
        {keyboardKey}
      </span>
      <span className={isBlack ? "text-base" : sizeConfig.noteLabelClass}>{noteId}</span>
    </button>
  );
};

export const CoursePiano = forwardRef<HTMLElement, CoursePianoProps>(function CoursePiano(
  {
  targetNotes,
  activeNotes = [],
  correctNotes = [],
  wrongNotes = [],
  activeVariant = "lesson",
  disabled = false,
  autoScrollNotes = [],
  className,
  fitToContainer = false,
  size = "standard",
  orientationMode = "responsive",
  onInput,
  onPress,
  onRelease,
  onPrepareAudio
},
  forwardedRef
) {
  const sizeConfig = pianoSizeConfigs[size];
  const rootRef = useRef<HTMLElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserInteractingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const resumeAutoScrollTimerRef = useRef<number | undefined>(undefined);
  const programmaticScrollTimerRef = useRef<number | undefined>(undefined);
  const autoScrollNotesRef = useRef(autoScrollNotes);
  const visualStateFor = (noteId: NoteId) =>
    getVisualState(noteId, targetNotes, activeNotes, correctNotes, wrongNotes);
  const setRootRef = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef]
  );

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
      ref={setRootRef}
      aria-label="Virtual piano"
      aria-disabled={disabled}
      className={[
        "relative min-w-0 rounded-2xl border border-stone-800 bg-stone-950 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.95)]",
        sizeConfig.shellPaddingClass,
        orientationMode === "mobile-landscape" ? "piano-mobile-landscape" : "",
        className ?? ""
      ].join(" ")}
    >
      <div
        className={[
          "min-w-0 rounded-xl border border-stone-700 bg-[#191511]",
          sizeConfig.innerShellPaddingClass
        ].join(" ")}
      >
        <div
          className={[
            "rounded-t-lg bg-[linear-gradient(90deg,#2f261f,#6f3f2d,#2f261f)]",
            sizeConfig.railHeightClass
          ].join(" ")}
        />
        <div
          ref={scrollContainerRef}
          className={[
            "piano-scroll relative rounded-b-xl bg-zinc-950",
            sizeConfig.scrollPaddingClass,
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
              "relative mx-auto w-full",
              sizeConfig.keyboardHeightClass,
              fitToContainer ? "min-w-0" : "min-w-[30.25rem]"
            ].join(" ")}
            style={
              fitToContainer
                ? undefined
                : { minWidth: `max(100%, ${whiteKeys.length * sizeConfig.minimumWhiteKeyWidth}px)` }
            }
          >
            <div className={["flex h-full", sizeConfig.keyGapClass].join(" ")}>
              {whiteKeys.map((key) => (
                <PianoKeyButton
                  key={key.noteId}
                  noteId={key.noteId}
                  tone={key.tone}
                  keyboardKey={key.keyboardKey}
                  visualState={visualStateFor(key.noteId)}
                  activeVariant={activeVariant}
                  disabled={disabled}
                  sizeConfig={sizeConfig}
                  onInput={onInput}
                  onPress={onPress}
                  onRelease={onRelease}
                  onPrepareAudio={onPrepareAudio}
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
                style={blackKeyStyle(key.noteId, sizeConfig)}
                sizeConfig={sizeConfig}
                onInput={onInput}
                onPress={onPress}
                onRelease={onRelease}
                onPrepareAudio={onPrepareAudio}
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
});
