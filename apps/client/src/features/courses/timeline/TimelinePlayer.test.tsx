import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { LessonDetail } from "../courseTypes";
import { TimelinePlayer } from "./TimelinePlayer";
import type { ResolvedGuidedTimeline } from "./resolveGuidedTimeline";

const { playNote, warmAudio } = vi.hoisted(() => ({
  playNote: vi.fn(),
  warmAudio: vi.fn(),
}));

vi.mock("../../../audio/NotePlayer", () => ({
  playNote: (...args: unknown[]) => playNote(...args),
  warmAudio: (...args: unknown[]) => warmAudio(...args),
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
    guidedInteractionMode: "stop-and-wait",
    pauseOnMiss: true,
    enableTimingScore: false,
    timingProfile: "generous",
    allowPerformanceMode: false,
  },
  timeline: undefined as never,
  courseSlug: "finger-placement",
  courseTitle: "Finger Placement",
  courseHand: "right",
};

const assistedLesson: LessonDetail = {
  ...lesson,
  behaviour: {
    defaultPracticeMode: "guided",
    guidedInteractionMode: "assisted",
    pauseOnMiss: true,
    enableTimingScore: true,
    timingProfile: "standard",
    allowPerformanceMode: false,
  },
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
    allowPerformanceMode: true,
  },
};

const timeline = (
  events: ResolvedGuidedTimeline["events"],
  totalBeats = 4,
): ResolvedGuidedTimeline => ({
  lessonId: "middle-c-anchor",
  source: "authored",
  timingSource: "instructional",
  originalBpm: 60,
  timeSignature: { numerator: 4, denominator: 4 },
  countInBeats: 0,
  totalBeats,
  events,
});

const renderPlayer = (
  activeLesson: LessonDetail,
  activeTimeline: ResolvedGuidedTimeline,
  onProgressSaved = vi.fn(),
) =>
  render(
    <MemoryRouter>
      <TimelinePlayer
        lesson={activeLesson}
        timeline={activeTimeline}
        onProgressSaved={onProgressSaved}
      />
    </MemoryRouter>,
  );

const clickPlay = () =>
  fireEvent.click(screen.getByRole("button", { name: /play lesson/i }));
const keyFor = (
  note: string,
  tone: "white" | "black" = note.includes("#") ? "black" : "white",
) =>
  screen.getByRole("button", { name: new RegExp(`${note}, ${tone} key`, "i") });

const targetClass = "bg-[#F59E0B]";
const activeClass = "bg-[#10B981]";

const advance = async (ms: number) => {
  currentNow += ms;
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

let currentNow = 0;

describe("TimelinePlayer guided press-only interaction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    currentNow = 0;
    vi.spyOn(performance, "now").mockImplementation(() => currentNow);
    window.localStorage.clear();
    playNote.mockClear();
    warmAudio.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("completes a single note on the first correct keydown without hold UI", async () => {
    const onProgressSaved = vi.fn();
    renderPlayer(
      lesson,
      timeline(
        [
          {
            id: "c",
            type: "note",
            notes: ["C4"],
            startBeat: 0,
            durationBeats: 2,
          },
        ],
        2,
      ),
      onProgressSaved,
    );

    clickPlay();
    await advance(20);
    fireEvent.keyDown(window, { key: "d" });

    expect(screen.getAllByText("Lesson complete").length).toBeGreaterThan(0);
    expect(keyFor("C4").className).toContain(activeClass);
    expect(screen.queryByText(/^Hold/)).not.toBeInTheDocument();
    expect(screen.queryByText("Release")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("progressbar", { name: "Hold progress" }),
    ).not.toBeInTheDocument();
    expect(onProgressSaved).toHaveBeenCalledTimes(1);
  });

  it("advances immediately and blocks a repeated held note until release and fresh press", async () => {
    renderPlayer(
      lesson,
      timeline([
        {
          id: "first",
          type: "note",
          notes: ["C4"],
          startBeat: 0,
          durationBeats: 0.5,
        },
        {
          id: "second",
          type: "note",
          notes: ["C4"],
          startBeat: 2,
          durationBeats: 0.5,
        },
      ]),
    );

    clickPlay();
    await advance(20);
    fireEvent.keyDown(window, { key: "d" });

    expect(screen.getByText("Next: C4")).toBeInTheDocument();
    expect(keyFor("C4").className).toContain(activeClass);
    expect(screen.queryByText("Good")).not.toBeInTheDocument();

    await advance(2050);
    expect(screen.getByText("Play C4")).toBeInTheDocument();
    expect(screen.queryByText("Lesson complete")).not.toBeInTheDocument();

    fireEvent.keyUp(window, { key: "d" });
    expect(keyFor("C4").className).toContain(targetClass);
    fireEvent.keyDown(window, { key: "d" });
    expect(screen.getAllByText("Lesson complete").length).toBeGreaterThan(0);
  });

  it("completes a chord when the final required key is pressed", async () => {
    renderPlayer(
      lesson,
      timeline(
        [
          {
            id: "chord",
            type: "note",
            notes: ["C4", "E4", "G4"],
            startBeat: 0,
            durationBeats: 2,
          },
        ],
        2,
      ),
    );

    clickPlay();
    await advance(20);
    fireEvent.keyDown(window, { key: "j" });
    expect(screen.getByText("Add C4 and E4")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "d" });
    expect(screen.getByText("Add E4")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "g" });

    expect(screen.getAllByText("Lesson complete").length).toBeGreaterThan(0);
  });

  it("requires every input source holding a repeated target to release", async () => {
    renderPlayer(
      lesson,
      timeline([
        {
          id: "first",
          type: "note",
          notes: ["C4"],
          startBeat: 0,
          durationBeats: 0.5,
        },
        {
          id: "second",
          type: "note",
          notes: ["C4"],
          startBeat: 2,
          durationBeats: 0.5,
        },
      ]),
    );

    clickPlay();
    await advance(20);
    fireEvent.keyDown(window, { key: "d" });
    fireEvent.pointerDown(keyFor("C4"), { pointerId: 1 });
    await advance(2050);

    fireEvent.keyUp(window, { key: "d" });
    expect(keyFor("C4").className).toContain(activeClass);
    fireEvent.pointerUp(keyFor("C4"), { pointerId: 1 });
    expect(keyFor("C4").className).toContain(targetClass);

    fireEvent.pointerDown(keyFor("C4"), { pointerId: 2 });
    expect(screen.getAllByText("Lesson complete").length).toBeGreaterThan(0);
  });

  it("does not advance on a wrong key", async () => {
    renderPlayer(
      lesson,
      timeline([
        {
          id: "c",
          type: "note",
          notes: ["C4"],
          startBeat: 0,
          durationBeats: 0.5,
        },
        {
          id: "d",
          type: "note",
          notes: ["D4"],
          startBeat: 2,
          durationBeats: 0.5,
        },
      ]),
    );

    clickPlay();
    await advance(20);
    fireEvent.keyDown(window, { key: "f" });

    expect(screen.getByText("Wrong key - play C4")).toBeInTheDocument();
    expect(keyFor("C4").className).toContain(targetClass);
    expect(screen.queryByText("Next: D4")).not.toBeInTheDocument();
  });

  it("preserves assisted recovery and performance timing behavior", async () => {
    const oneNote = timeline(
      [
        {
          id: "c",
          type: "note",
          notes: ["C4"],
          startBeat: 0,
          durationBeats: 0.5,
        },
      ],
      2,
    );

    const assisted = renderPlayer(assistedLesson, oneNote);
    clickPlay();
    await advance(300);
    expect(screen.getByText("Waiting for you")).toBeInTheDocument();
    assisted.unmount();

    renderPlayer(performanceLesson, {
      ...oneNote,
      totalBeats: 3,
      events: [{ ...oneNote.events[0], startBeat: 1 }],
    });
    clickPlay();
    await advance(1000);
    expect(
      screen.getByRole("button", { name: /pause lesson/i }),
    ).toHaveTextContent("Pause");
    expect(screen.queryByText("Play C4")).not.toBeInTheDocument();
  });
});
