import { cleanup, render, screen, within } from "@testing-library/react";

import { App } from "./App";
import type {
  Course,
  CourseSummary,
  LessonDetail,
  TimelineLesson
} from "./features/courses/courseTypes";

vi.mock("./audio/NotePlayer", () => ({
  getAudioStatus: vi.fn(() => "ready"),
  playNote: vi.fn(),
  subscribeToAudioStatus: vi.fn(() => () => undefined),
  warmAudio: vi.fn()
}));

const timelineLesson: TimelineLesson = {
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
    pauseOnMiss: true,
    enableTimingScore: false,
    timingProfile: "generous",
    allowPerformanceMode: false
  },
  timeline: {
    schemaVersion: 2,
    timingSource: "instructional",
    originalBpm: 60,
    timeSignature: { numerator: 4, denominator: 4 },
    countInBeats: 4,
    totalBeats: 2,
    source: {
      type: "instructional-template",
      reviewStatus: "instructional"
    },
    instructionalTemplate: {
      templateId: "foundational-quarter-note-v1",
      eventSpacingBeats: 2,
      noteDurationBeats: 1,
      firstEventBeat: 0,
      originalBpm: 60,
      countInBeats: 4,
      timingWindows: { perfectMs: 180, goodMs: 350, acceptedMs: 700 }
    },
    events: [
      {
        id: "find-c4",
        type: "note",
        notes: ["C4"],
        startBeat: 0,
        durationBeats: 1,
        instruction: "Play C4."
      }
    ]
  }
};

const blockedLesson = {
  slug: "one-love-rise",
  title: "Rising Phrase",
  description: "Awaiting verified timing.",
  order: 1,
  isFinal: true,
  mode: "migration-blocked" as const,
  contentKind: "complete-song" as const,
  migrationStatus: "needs-transcription" as const,
  unavailableReason:
    "Verified beat positions, note durations, BPM, time signature, and approved source provenance are required before timeline playback.",
  requiredTimingSource:
    "Approved MIDI, sheet music, reviewed manual transcription, or reviewed recorded-performance timing."
};

const course: Course = {
  slug: "finger-placement",
  title: "Finger Placement",
  description: "Build a right-hand map around middle C.",
  contentType: "single-note",
  hand: "right",
  difficulty: "beginner",
  order: 1,
  lessons: [timelineLesson]
};

const blockedCourse: Course = {
  slug: "one-love-limited-excerpt",
  title: "One Love Limited Excerpt",
  description: "A song excerpt awaiting verified timing.",
  contentType: "single-note",
  hand: "right",
  difficulty: "beginner",
  order: 2,
  lessons: [blockedLesson]
};

const courseSummary = (value: Course): CourseSummary => ({
  slug: value.slug,
  title: value.title,
  description: value.description,
  contentType: value.contentType,
  hand: value.hand,
  difficulty: value.difficulty,
  order: value.order,
  lessonCount: value.lessons.length
});

const lessonDetail: LessonDetail = {
  ...timelineLesson,
  courseSlug: course.slug,
  courseTitle: course.title,
  courseHand: course.hand
};

const blockedLessonDetail: LessonDetail = {
  ...blockedLesson,
  courseSlug: blockedCourse.slug,
  courseTitle: blockedCourse.title,
  courseHand: blockedCourse.hand
};

const mockFetch = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/courses") {
        return {
          ok: true,
          json: async () => [courseSummary(course), courseSummary(blockedCourse)]
        };
      }

      if (url === "/api/courses/finger-placement") {
        return { ok: true, json: async () => course };
      }

      if (url === "/api/courses/one-love-limited-excerpt") {
        return { ok: true, json: async () => blockedCourse };
      }

      if (url === "/api/courses/finger-placement/lessons/middle-c-anchor") {
        return { ok: true, json: async () => lessonDetail };
      }

      if (url === "/api/courses/one-love-limited-excerpt/lessons/one-love-rise") {
        return { ok: true, json: async () => blockedLessonDetail };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({})
      };
    })
  );
};

describe("Piano360 Phase A routes", () => {
  beforeEach(() => {
    mockFetch();
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders playable foundational lessons through the timeline player", async () => {
    window.history.pushState({}, "", "/courses/finger-placement/lessons/middle-c-anchor");
    render(<App />);

    expect(await screen.findByLabelText("Rhythm timeline")).toBeInTheDocument();
    expect(screen.getByLabelText("Judgement line")).toBeInTheDocument();
    expect(screen.getByLabelText("Practice tempo")).toBeInTheDocument();
    expect(screen.getByText(/Instructional timing/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Lesson instruction")).not.toBeInTheDocument();
  });

  it("keeps blocked song lessons visible but disables playback from course detail", async () => {
    window.history.pushState({}, "", "/courses/one-love-limited-excerpt");
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "One Love Limited Excerpt" })
    ).toBeInTheDocument();
    const lessonCard = screen.getByText("Rising Phrase").closest("article");
    expect(lessonCard).not.toBeNull();
    expect(
      within(lessonCard as HTMLElement).getByText("Timing source required")
    ).toBeInTheDocument();
    expect(within(lessonCard as HTMLElement).getByText("Coming soon")).toBeInTheDocument();
    expect(
      within(lessonCard as HTMLElement).queryByRole("link", { name: /start|replay/i })
    ).not.toBeInTheDocument();
  });

  it("shows a recoverable blocked message for direct unverified song lesson URLs", async () => {
    window.history.pushState({}, "", "/courses/one-love-limited-excerpt/lessons/one-love-rise");
    render(<App />);

    expect(await screen.findByText("Timing source required")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rising Phrase" })).toBeInTheDocument();
    expect(screen.getByText(/Verified beat positions/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Rhythm timeline")).not.toBeInTheDocument();
  });
});
