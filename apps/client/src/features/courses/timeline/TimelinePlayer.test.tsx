import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { LessonDetail } from "../courseTypes";
import { PROGRESS_STORAGE_KEY } from "../progressStorage";
import { TimelinePlayer } from "./TimelinePlayer";
import type { ResolvedGuidedTimeline } from "./resolveGuidedTimeline";

const { playNote, warmAudio } = vi.hoisted(() => ({
  playNote: vi.fn(),
  warmAudio: vi.fn()
}));

const STOP_WAIT_ADVANCE_MS = 320;

vi.mock("../../../audio/NotePlayer", () => ({
  playNote: (...args: unknown[]) => playNote(...args),
  warmAudio: (...args: unknown[]) => warmAudio(...args)
}));

const lesson: LessonDetail = {
  slug: "middle-c-anchor",
  title: "Middle C Anchor",
  description: "Find C4.",
  order: 1,
  isFinal: false,
  mode: "timeline",
  contentKind: "foundational-drill",
  defaultPracticeMode: "guided",
  availablePracticeModes: ["guided"],
  behaviour: {
    defaultPracticeMode: "guided",
    pauseOnMiss: false,
    enableTimingScore: true,
    timingProfile: "standard",
    allowPerformanceMode: false
  },
  timeline: undefined as never,
  courseSlug: "finger-placement",
  courseTitle: "Finger Placement",
  courseHand: "right"
};

const baseTimeline: ResolvedGuidedTimeline = {
  lessonId: "middle-c-anchor",
  source: "authored",
  timingSource: "instructional",
  originalBpm: 60,
  timeSignature: { numerator: 4, denominator: 4 },
  countInBeats: 0,
  totalBeats: 2,
  events: [{ id: "c4", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 1 }]
};

const renderPlayer = (timeline: ResolvedGuidedTimeline = baseTimeline) =>
  render(
    <MemoryRouter>
      <TimelinePlayer lesson={lesson} timeline={timeline} onProgressSaved={vi.fn()} />
    </MemoryRouter>
  );

const stopWaitLesson: LessonDetail = {
  ...lesson,
  behaviour: {
    defaultPracticeMode: "guided",
    guidedInteractionMode: "stop-and-wait",
    pauseOnMiss: true,
    enableTimingScore: false,
    timingProfile: "generous",
    allowPerformanceMode: false
  }
};

const assistedLesson: LessonDetail = {
  ...lesson,
  behaviour: {
    defaultPracticeMode: "guided",
    guidedInteractionMode: "assisted",
    pauseOnMiss: true,
    enableTimingScore: true,
    timingProfile: "standard",
    allowPerformanceMode: false
  }
};

const performanceLesson: LessonDetail = {
  ...lesson,
  defaultPracticeMode: "performance",
  availablePracticeModes: ["guided", "performance"],
  behaviour: {
    defaultPracticeMode: "performance",
    pauseOnMiss: false,
    enableTimingScore: true,
    timingProfile: "standard",
    allowPerformanceMode: true
  }
};

const renderStopWaitPlayer = (
  timeline: ResolvedGuidedTimeline = baseTimeline,
  onProgressSaved = vi.fn()
) =>
  render(
    <MemoryRouter>
      <TimelinePlayer
        lesson={stopWaitLesson}
        timeline={timeline}
        onProgressSaved={onProgressSaved}
      />
    </MemoryRouter>
  );

const renderModePlayer = (modeLesson: LessonDetail, timeline: ResolvedGuidedTimeline) =>
  render(
    <MemoryRouter>
      <TimelinePlayer lesson={modeLesson} timeline={timeline} onProgressSaved={vi.fn()} />
    </MemoryRouter>
  );

const clickPlay = () => fireEvent.click(screen.getByRole("button", { name: /play lesson/i }));

describe("TimelinePlayer", () => {
  let now = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    window.localStorage.clear();
    window.localStorage.setItem("piano360.tempo.finger-placement/middle-c-anchor", "100");
    playNote.mockClear();
    warmAudio.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const advanceClock = async (ms: number) => {
    now += ms;
    await act(async () => {
      vi.advanceTimersByTime(20);
    });
  };

  it("renders compact timeline layout hooks without removing controls", () => {
    const { container } = renderPlayer();

    expect(container.querySelector(".timeline-player-header")).toBeInTheDocument();
    expect(container.querySelector(".timeline-transport")).toBeInTheDocument();
    expect(container.querySelector(".timeline-status")).toBeInTheDocument();
    expect(container.querySelector(".timeline-player-note-lane")).toBeInTheDocument();
    expect(container.querySelector(".timeline-player-piano")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play lesson/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /restart lesson/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Practice tempo")).toBeInTheDocument();
  });

  it("scores keyboard and on-screen piano input through the same path", () => {
    const { unmount } = renderPlayer();
    clickPlay();
    fireEvent.keyDown(window, { key: "d" });
    now = 1000;
    fireEvent.keyUp(window, { key: "d" });

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(playNote).toHaveBeenCalledWith("C4");
    unmount();

    playNote.mockClear();
    renderPlayer();
    clickPlay();
    fireEvent.pointerDown(screen.getByRole("button", { name: /C4, white key/i }), {
      pointerId: 1
    });
    now = 2000;
    fireEvent.pointerUp(screen.getByRole("button", { name: /C4, white key/i }), {
      pointerId: 1
    });

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(playNote).toHaveBeenCalledWith("C4");
  });

  it("ignores scoring during count-in and while paused", () => {
    renderPlayer({ ...baseTimeline, countInBeats: 4 });
    clickPlay();
    fireEvent.keyDown(window, { key: "d" });
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getByText("Count in")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /pause lesson/i }));
    fireEvent.keyDown(window, { key: "d" });
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("shows no chord feedback for ignored input and pending feedback for incomplete chords", () => {
    renderPlayer({
      ...baseTimeline,
      totalBeats: 3,
      events: [{ id: "chord", type: "note", notes: ["C4", "E4"], startBeat: 1, durationBeats: 1 }]
    });
    clickPlay();

    fireEvent.keyDown(window, { key: "d" });
    expect(screen.queryByText("Complete the chord")).not.toBeInTheDocument();

    now = 1000;
    fireEvent.keyDown(window, { key: "d" });
    expect(screen.getByText("Complete the chord")).toBeInTheDocument();
  });

  it("auto-pauses tempo changes while playing and resumes manually", () => {
    renderPlayer();
    clickPlay();
    fireEvent.change(screen.getByLabelText("Practice tempo"), { target: { value: "80" } });

    expect(screen.getByRole("button", { name: /play lesson/i })).toHaveTextContent("Resume");
  });

  it("shows wrong-note feedback without changing the score", () => {
    renderPlayer();
    clickPlay();
    fireEvent.keyDown(window, { key: "f" });

    expect(screen.getByText("Wrong note")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("persists completion once per run and can save once again after replay", async () => {
    const onProgressSaved = vi.fn();
    render(
      <MemoryRouter>
        <TimelinePlayer lesson={lesson} timeline={baseTimeline} onProgressSaved={onProgressSaved} />
      </MemoryRouter>
    );

    clickPlay();
    fireEvent.keyDown(window, { key: "d" });
    await advanceClock(1000);
    fireEvent.keyUp(window, { key: "d" });
    await advanceClock(1100);

    expect(screen.getAllByText("Lesson complete").length).toBeGreaterThan(0);
    expect(onProgressSaved).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toContain('"completionCount":1');

    fireEvent.click(screen.getByRole("button", { name: /replay/i }));
    clickPlay();
    fireEvent.keyDown(window, { key: "d" });
    await advanceClock(1000);
    fireEvent.keyUp(window, { key: "d" });
    await advanceClock(1100);

    expect(onProgressSaved).toHaveBeenCalledTimes(2);
    expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toContain('"completionCount":2');
  });

  it("locks stop-and-wait targets at the strike line without expiry", async () => {
    renderStopWaitPlayer({
      ...baseTimeline,
      totalBeats: 4,
      events: [
        { id: "c4", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 0.5 },
        { id: "d4", type: "note", notes: ["D4"], startBeat: 2, durationBeats: 0.5 }
      ]
    });

    clickPlay();
    await advanceClock(20);

    expect(screen.getAllByText("Waiting").length).toBeGreaterThan(0);
    expect(screen.getByText("Play C4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play lesson/i })).toHaveTextContent("Waiting");

    await advanceClock(5000);

    expect(screen.queryByText("Missed")).not.toBeInTheDocument();
    expect(screen.getByText("Play C4")).toBeInTheDocument();
  });

  it("accepts a stop-and-wait strike-line press before the React lock effect commits", () => {
    renderStopWaitPlayer({
      ...baseTimeline,
      totalBeats: 3,
      events: [{ id: "c4", type: "note", notes: ["C4"], startBeat: 1, durationBeats: 0.5 }]
    });

    clickPlay();
    expect(screen.getByText("Next: C4")).toBeInTheDocument();

    now = 1000;
    fireEvent.keyDown(window, { key: "d" });

    expect(screen.getByText("Hold C4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play lesson/i })).toHaveTextContent("Waiting");
    expect(screen.getByTestId("falling-notes-stage")).toHaveAttribute(
      "data-recovery-locked",
      "true"
    );
    expect(playNote).toHaveBeenCalledTimes(1);
  });

  it("judges only the active stop-and-wait target and keeps wrong input from advancing", async () => {
    renderStopWaitPlayer({
      ...baseTimeline,
      totalBeats: 4,
      events: [
        { id: "c4", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 0.5 },
        { id: "d4", type: "note", notes: ["D4"], startBeat: 2, durationBeats: 0.5 }
      ]
    });

    clickPlay();
    await advanceClock(20);
    fireEvent.keyDown(window, { key: "f" });

    expect(screen.getByText("Wrong key - play C4")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("requires stop-and-wait release before starting the next event lead-in", async () => {
    renderStopWaitPlayer({
      ...baseTimeline,
      totalBeats: 4,
      events: [
        { id: "c4", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 0.5 },
        { id: "d4", type: "note", notes: ["D4"], startBeat: 3, durationBeats: 0.5 }
      ]
    });

    clickPlay();
    await advanceClock(20);
    fireEvent.keyDown(window, { key: "d" });

    expect(screen.getByText("Hold C4")).toBeInTheDocument();
    expect(screen.queryByText("Lesson complete")).not.toBeInTheDocument();

    await advanceClock(400);
    fireEvent.keyUp(window, { key: "d" });
    expect(screen.getAllByText("Good").length).toBeGreaterThan(0);

    await act(async () => {
      vi.advanceTimersByTime(STOP_WAIT_ADVANCE_MS + 20);
    });

    expect(screen.getByText("Next: D4")).toBeInTheDocument();
    expect(screen.queryByText("Play C4")).not.toBeInTheDocument();
  });

  it("shows hold progress and changes to Release at the stop-and-wait hold threshold", async () => {
    renderStopWaitPlayer({
      ...baseTimeline,
      totalBeats: 2,
      events: [{ id: "c4", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 0.5 }]
    });

    clickPlay();
    await advanceClock(20);
    fireEvent.keyDown(window, { key: "d" });

    expect(screen.getByText("Hold C4")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Hold progress" })).toHaveAttribute(
      "aria-valuenow",
      "0"
    );

    await advanceClock(180);

    expect(screen.getByText("Release")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Hold progress" })).toHaveAttribute(
      "data-ready",
      "true"
    );
  });

  it("keeps the same stop-and-wait target after an early release", async () => {
    renderStopWaitPlayer({
      ...baseTimeline,
      totalBeats: 4,
      events: [
        { id: "c4", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 0.5 },
        { id: "d4", type: "note", notes: ["D4"], startBeat: 2, durationBeats: 0.5 }
      ]
    });

    clickPlay();
    await advanceClock(20);
    fireEvent.keyDown(window, { key: "d" });
    await advanceClock(100);
    fireEvent.keyUp(window, { key: "d" });

    expect(screen.getByText("Hold longer")).toBeInTheDocument();
    expect(screen.queryByText("Next: D4")).not.toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("clears stop-and-wait confirmation timers on restart", async () => {
    renderStopWaitPlayer({
      ...baseTimeline,
      totalBeats: 2,
      events: [{ id: "c4", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 0.5 }]
    });

    clickPlay();
    await advanceClock(20);
    fireEvent.keyDown(window, { key: "d" });
    await advanceClock(180);
    fireEvent.keyUp(window, { key: "d" });

    expect(screen.getAllByText("Good").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /restart lesson/i }));
    await act(async () => {
      vi.advanceTimersByTime(STOP_WAIT_ADVANCE_MS + 20);
    });

    expect(screen.queryByText("Lesson complete")).not.toBeInTheDocument();
    expect(screen.getByText("Get ready")).toBeInTheDocument();
  });

  it("keeps manual pause separate from stop-and-wait waiting", async () => {
    renderStopWaitPlayer({
      ...baseTimeline,
      totalBeats: 4,
      events: [{ id: "c4", type: "note", notes: ["C4"], startBeat: 2, durationBeats: 0.5 }]
    });

    clickPlay();
    fireEvent.click(screen.getByRole("button", { name: /pause lesson/i }));

    expect(screen.getAllByText("Paused").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /play lesson/i })).toHaveTextContent("Resume");

    clickPlay();
    await advanceClock(2050);

    expect(screen.getAllByText("Waiting").length).toBeGreaterThan(0);
    expect(screen.getByText("Play C4")).toBeInTheDocument();
  });

  it("preserves assisted recovery behavior outside stop-and-wait mode", async () => {
    renderModePlayer(assistedLesson, {
      ...baseTimeline,
      totalBeats: 2,
      events: [{ id: "c4", type: "note", notes: ["C4"], startBeat: 0, durationBeats: 0.5 }]
    });

    clickPlay();
    await advanceClock(300);

    expect(screen.getByText("Waiting for you")).toBeInTheDocument();
    expect(screen.getByText("Play C4")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar", { name: "Hold progress" })).not.toBeInTheDocument();
  });

  it("keeps performance mode continuous without stop-and-wait prompts", async () => {
    renderModePlayer(performanceLesson, {
      ...baseTimeline,
      totalBeats: 3,
      events: [{ id: "c4", type: "note", notes: ["C4"], startBeat: 1, durationBeats: 0.5 }]
    });

    clickPlay();
    await advanceClock(1000);

    expect(screen.getByRole("button", { name: /pause lesson/i })).toHaveTextContent("Pause");
    expect(screen.queryByText("Play C4")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar", { name: "Hold progress" })).not.toBeInTheDocument();
  });
});
