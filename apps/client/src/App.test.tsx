import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { playNote, warmAudio } from "./audio/NotePlayer";
import { App } from "./App";
import type { Course, CourseSummary, LessonDetail } from "./features/courses/courseTypes";

type MockAudioStatus = "idle" | "loading" | "ready" | "unavailable";

const audioMock = vi.hoisted(() => ({
  status: "idle" as MockAudioStatus,
  listeners: new Set<(status: MockAudioStatus) => void>(),
  playNote: vi.fn(),
  warmAudio: vi.fn()
}));

vi.mock("./audio/NotePlayer", () => ({
  getAudioStatus: vi.fn(() => audioMock.status),
  playNote: audioMock.playNote,
  subscribeToAudioStatus: vi.fn((listener: (status: MockAudioStatus) => void) => {
    audioMock.listeners.add(listener);
    return () => {
      audioMock.listeners.delete(listener);
    };
  }),
  warmAudio: audioMock.warmAudio
}));

const course: Course = {
  slug: "finger-placement",
  title: "Finger Placement",
  description: "Build a right-hand map around middle C.",
  contentType: "single-note",
  hand: "right",
  difficulty: "beginner",
  order: 1,
  lessons: [
    {
      slug: "middle-c-anchor",
      title: "Middle C Anchor",
      description: "Find C4.",
      order: 1,
      isFinal: false,
      steps: [
        {
          id: "c4",
          type: "single-note",
          instruction: "Play C4.",
          targetNotes: ["C4"]
        }
      ]
    },
    {
      slug: "complete-finger-placement",
      title: "Complete Finger Placement",
      description: "Complete the drill.",
      order: 2,
      isFinal: true,
      steps: [
        {
          id: "d4",
          type: "single-note",
          instruction: "Play D4.",
          targetNotes: ["D4"]
        }
      ]
    }
  ]
};

const courseSummary: CourseSummary = (({ lessons, ...summary }) => ({
  ...summary,
  lessonCount: lessons.length
}))(course);

const createCourseSummary = (index: number): CourseSummary => ({
  slug: `course-${index}`,
  title: `Course ${index}`,
  description: `Practice plan ${index}`,
  contentType: index % 2 === 0 ? "chord" : "single-note",
  hand: index % 2 === 0 ? "left" : "right",
  difficulty: "beginner",
  order: index,
  lessonCount: 3
});

const lessonDetail: LessonDetail = {
  ...course.lessons[0],
  courseSlug: course.slug,
  courseTitle: course.title,
  courseHand: course.hand
};

let currentCourse = course;
let currentCourseSummaries = [courseSummary];
let currentLessonDetail = lessonDetail;

const courseLessonFromDetail = ({
  courseSlug,
  courseTitle,
  courseHand,
  ...lesson
}: LessonDetail) => {
  void courseSlug;
  void courseTitle;
  void courseHand;
  return lesson;
};

const setCurrentLesson = (lesson: LessonDetail) => {
  currentLessonDetail = lesson;
  currentCourse = {
    ...course,
    lessons: [courseLessonFromDetail(lesson), course.lessons[1]]
  };
  currentCourseSummaries = [
    {
      ...courseSummary,
      lessonCount: currentCourse.lessons.length
    }
  ];
};

const setAudioStatus = (status: MockAudioStatus) => {
  audioMock.status = status;
  audioMock.listeners.forEach((listener) => listener(status));
};

const renderUnlockedLesson = async () => {
  window.history.pushState({}, "", "/courses/finger-placement/lessons/middle-c-anchor");
  render(<App />);
  await screen.findByLabelText("Lesson instruction");
};

const mockFetch = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/courses") {
        return {
          ok: true,
          json: async () => currentCourseSummaries
        };
      }

      if (url === "/api/courses/finger-placement") {
        return {
          ok: true,
          json: async () => currentCourse
        };
      }

      if (url === "/api/courses/finger-placement/lessons/middle-c-anchor") {
        return {
          ok: true,
          json: async () => currentLessonDetail
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({})
      };
    })
  );
};

describe("Piano360 course MVP", () => {
  beforeEach(() => {
    setCurrentLesson(lessonDetail);
    audioMock.status = "idle";
    audioMock.listeners.clear();
    audioMock.playNote.mockClear();
    audioMock.warmAudio.mockClear();
    mockFetch();
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders the marketing landing page at the root route", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /Piano practice that stays practical/i })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Start Learning/i })[0]).toHaveAttribute(
      "href",
      "/courses"
    );
    expect(await screen.findByRole("link", { name: /Finger Placement/i })).toHaveAttribute(
      "href",
      "/courses/finger-placement"
    );
  });

  it("renders the Course Catalogue at /courses with filters", async () => {
    window.history.pushState({}, "", "/courses");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Course catalogue" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Finger Placement/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Content type")).toBeInTheDocument();
    expect(screen.getByLabelText("Hand")).toBeInTheDocument();
    expect(screen.getByLabelText("Difficulty")).toBeInTheDocument();
  });

  it("filters courses by URL-backed search and resets pagination on search changes", async () => {
    currentCourseSummaries = [
      ...Array.from({ length: 9 }, (_, index) => createCourseSummary(index + 1)),
      {
        ...courseSummary,
        title: "Middle C Basics",
        description: "Find the center of the keyboard."
      }
    ];
    window.history.pushState({}, "", "/courses?page=2");
    render(<App />);

    expect(await screen.findByText("Course 9")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search courses"), {
      target: { value: "middle" }
    });

    expect(await screen.findByRole("link", { name: /Middle C Basics/i })).toBeInTheDocument();
    expect(screen.queryByText("Course 9")).not.toBeInTheDocument();
    expect(window.location.search).toBe("?q=middle");
  });

  it("normalizes invalid catalogue query parameters", async () => {
    currentCourseSummaries = Array.from({ length: 9 }, (_, index) =>
      createCourseSummary(index + 1)
    );
    window.history.pushState(
      {},
      "",
      "/courses?q=&contentType=bad&hand=wrong&difficulty=advanced&page=50"
    );
    render(<App />);

    await screen.findByRole("heading", { name: "Course catalogue" });

    await waitFor(() => {
      expect(window.location.search).toBe("?page=2");
    });
  });

  it("paginates the course catalogue eight courses at a time", async () => {
    currentCourseSummaries = Array.from({ length: 9 }, (_, index) =>
      createCourseSummary(index + 1)
    );
    window.history.pushState({}, "", "/courses");
    render(<App />);

    expect(await screen.findByText("Course 1")).toBeInTheDocument();
    expect(screen.queryByText("Course 9")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));

    expect(await screen.findByText("Course 9")).toBeInTheDocument();
    expect(window.location.search).toBe("?page=2");
  });

  it("shows locked lessons on direct navigation without starting playback", async () => {
    window.history.pushState({}, "", "/courses/finger-placement/lessons/complete-finger-placement");
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Complete the previous lesson first" })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Virtual piano")).not.toBeInTheDocument();
  });

  it("plays and completes an unlocked single-note lesson", async () => {
    setAudioStatus("ready");
    await renderUnlockedLesson();

    fireEvent.keyDown(window, { key: "d" });

    expect(playNote).toHaveBeenCalledWith("C4");
    expect(await screen.findByText("Lesson complete")).toBeInTheDocument();
    expect(window.localStorage.getItem("piano360.progress.v1")).toContain("middle-c-anchor");
  });

  it("starts audio preparation from the first keyboard gesture without validating while idle", async () => {
    await renderUnlockedLesson();

    expect(screen.getByText("Preparing piano audio…")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "d" });

    expect(warmAudio).toHaveBeenCalledTimes(1);
    expect(playNote).not.toHaveBeenCalled();
    expect(screen.queryByText("Lesson complete")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("piano360.progress.v1")).toBeNull();
  });

  it("does not start audio loading multiple times while loading", async () => {
    await renderUnlockedLesson();

    fireEvent.keyDown(window, { key: "d" });
    act(() => setAudioStatus("loading"));
    fireEvent.keyDown(window, { key: "d" });
    fireEvent.pointerDown(screen.getByLabelText("Virtual piano"));

    expect(warmAudio).toHaveBeenCalledTimes(1);
    expect(playNote).not.toHaveBeenCalled();
  });

  it("displays the preparing message and ignores keyboard and pointer input while loading", async () => {
    setAudioStatus("loading");
    await renderUnlockedLesson();

    expect(screen.getByText("Preparing piano audio…")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "d" });
    fireEvent.pointerDown(screen.getByRole("button", { name: /C4, white key/i }));

    expect(playNote).not.toHaveBeenCalled();
    expect(screen.queryByText("Lesson complete")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("piano360.progress.v1")).toBeNull();
  });

  it("renders the unavailable audio message exactly and keeps lesson input disabled", async () => {
    setAudioStatus("unavailable");
    await renderUnlockedLesson();

    expect(
      screen.getByText("Audio unavailable — refresh or check browser permissions.")
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "d" });
    fireEvent.pointerDown(screen.getByRole("button", { name: /C4, white key/i }));

    expect(playNote).not.toHaveBeenCalled();
    expect(screen.queryByText("Lesson complete")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("piano360.progress.v1")).toBeNull();
  });

  it("enables lesson input immediately when audio becomes ready", async () => {
    setAudioStatus("loading");
    await renderUnlockedLesson();

    act(() => setAudioStatus("ready"));
    fireEvent.keyDown(window, { key: "d" });

    expect(playNote).toHaveBeenCalledWith("C4");
    expect(await screen.findByText("Lesson complete")).toBeInTheDocument();
  });

  it("renders a centered dynamic note instruction without the lesson heading or visible play text", async () => {
    setAudioStatus("ready");
    await renderUnlockedLesson();

    const instructionPanel = screen.getByLabelText("Lesson instruction");

    expect(within(instructionPanel).getByText("C4")).toBeInTheDocument();
    expect(within(instructionPanel).getByLabelText("Play C4")).toBeInTheDocument();
    expect(
      within(instructionPanel).queryByRole("heading", { name: "Middle C Anchor" })
    ).not.toBeInTheDocument();
    expect(within(instructionPanel).queryByText("Play C4.")).not.toBeInTheDocument();
    expect(within(instructionPanel).getByText("1/1")).toBeInTheDocument();
    expect(within(instructionPanel).getByText("Play the highlighted note")).toBeInTheDocument();
  });

  it("updates the visible note instruction when the lesson advances", async () => {
    setCurrentLesson({
      ...lessonDetail,
      steps: [
        {
          id: "first-c4",
          type: "single-note",
          instruction: "Play C4.",
          targetNotes: ["C4"]
        },
        {
          id: "second-d4",
          type: "single-note",
          instruction: "Play D4.",
          targetNotes: ["D4"]
        }
      ]
    });
    setAudioStatus("ready");
    await renderUnlockedLesson();

    const instructionPanel = screen.getByLabelText("Lesson instruction");
    expect(within(instructionPanel).getByText("C4")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "d" });

    expect(within(instructionPanel).getByText("D4")).toBeInTheDocument();
    expect(within(instructionPanel).queryByText("C4")).not.toBeInTheDocument();
    expect(within(instructionPanel).getByText("2/2")).toBeInTheDocument();
  });

  it("uses keydown, not keyup, for keyboard playback", async () => {
    setAudioStatus("ready");
    await renderUnlockedLesson();

    fireEvent.keyUp(window, { key: "d" });
    expect(playNote).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "d" });
    expect(playNote).toHaveBeenCalledWith("C4");
  });

  it("uses pointerdown, not pointerup, for virtual piano playback", async () => {
    setAudioStatus("ready");
    await renderUnlockedLesson();

    const c4Key = screen.getByRole("button", { name: /C4, white key/i });
    fireEvent.pointerUp(c4Key);
    expect(playNote).not.toHaveBeenCalled();

    fireEvent.pointerDown(c4Key);
    expect(playNote).toHaveBeenCalledWith("C4");
  });

  it("keeps correct single-note feedback for exactly 300 ms before restoring a repeated target", async () => {
    setCurrentLesson({
      ...lessonDetail,
      steps: [
        {
          id: "first-c4",
          type: "single-note",
          instruction: "Play C4.",
          targetNotes: ["C4"]
        },
        {
          id: "second-c4",
          type: "single-note",
          instruction: "Play C4 again.",
          targetNotes: ["C4"]
        }
      ]
    });
    setAudioStatus("ready");
    await renderUnlockedLesson();
    vi.useFakeTimers();

    const c4Key = screen.getByRole("button", { name: /C4, white key/i });
    fireEvent.keyDown(window, { key: "d" });

    expect(c4Key.className).toContain("bg-[#10B981]");

    act(() => vi.advanceTimersByTime(299));
    expect(c4Key.className).toContain("bg-[#10B981]");

    act(() => vi.advanceTimersByTime(1));
    expect(c4Key.className).toContain("bg-[#F59E0B]");
  });

  it("keeps incorrect feedback for exactly 300 ms", async () => {
    setAudioStatus("ready");
    await renderUnlockedLesson();
    vi.useFakeTimers();

    const d4Key = screen.getByRole("button", { name: /D4, white key/i });
    fireEvent.keyDown(window, { key: "f" });

    expect(d4Key.className).toContain("bg-[#EF4444]");

    act(() => vi.advanceTimersByTime(299));
    expect(d4Key.className).toContain("bg-[#EF4444]");

    act(() => vi.advanceTimersByTime(1));
    expect(d4Key.className).not.toContain("bg-[#EF4444]");
  });

  it("keeps correct chord notes active until the chord window expires", async () => {
    setCurrentLesson({
      ...lessonDetail,
      steps: [
        {
          id: "c-major",
          type: "chord",
          instruction: "Play C major.",
          targetNotes: ["C4", "E4", "G4"]
        }
      ]
    });
    setAudioStatus("ready");
    await renderUnlockedLesson();
    vi.useFakeTimers();

    const c4Key = screen.getByRole("button", { name: /C4, white key/i });
    const e4Key = screen.getByRole("button", { name: /E4, white key/i });

    fireEvent.keyDown(window, { key: "d" });
    fireEvent.keyDown(window, { key: "g" });

    expect(c4Key.className).toContain("bg-[#10B981]");
    expect(e4Key.className).toContain("bg-[#10B981]");

    act(() => vi.advanceTimersByTime(300));
    expect(c4Key.className).toContain("bg-[#10B981]");
    expect(e4Key.className).toContain("bg-[#10B981]");

    act(() => vi.advanceTimersByTime(60));
    expect(c4Key.className).not.toContain("bg-[#10B981]");
    expect(e4Key.className).not.toContain("bg-[#10B981]");
  });

  it("clears transient feedback when restarting and replaying a lesson", async () => {
    setAudioStatus("ready");
    await renderUnlockedLesson();
    vi.useFakeTimers();

    const c4Key = screen.getByRole("button", { name: /C4, white key/i });
    fireEvent.keyDown(window, { key: "d" });
    expect(c4Key.className).toContain("bg-[#10B981]");

    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(c4Key.className).not.toContain("bg-[#10B981]");

    fireEvent.keyDown(window, { key: "d" });
    expect(c4Key.className).toContain("bg-[#10B981]");

    fireEvent.click(screen.getByRole("button", { name: "Restart" }));
    expect(c4Key.className).not.toContain("bg-[#10B981]");
  });
});
