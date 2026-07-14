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
});
