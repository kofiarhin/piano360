import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { playNote } from "./audio/NotePlayer";
import { App } from "./App";
import type { Course, CourseSummary, LessonDetail } from "./features/courses/courseTypes";

vi.mock("./audio/NotePlayer", () => ({
  playNote: vi.fn()
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

const lessonDetail: LessonDetail = {
  ...course.lessons[0],
  courseSlug: course.slug,
  courseTitle: course.title,
  courseHand: course.hand
};

const mockFetch = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/courses") {
        return {
          ok: true,
          json: async () => [courseSummary]
        };
      }

      if (url === "/api/courses/finger-placement") {
        return {
          ok: true,
          json: async () => course
        };
      }

      if (url === "/api/courses/finger-placement/lessons/middle-c-anchor") {
        return {
          ok: true,
          json: async () => lessonDetail
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

  it("renders the Course Library at the root route", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Piano360" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Finger Placement/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Content type")).toBeInTheDocument();
    expect(screen.getByLabelText("Hand")).toBeInTheDocument();
    expect(screen.getByLabelText("Difficulty")).toBeInTheDocument();
  });

  it("shows locked lessons on direct navigation without starting playback", async () => {
    window.history.pushState({}, "", "/courses/finger-placement/lessons/complete-finger-placement");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Complete the previous lesson first" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Virtual piano")).not.toBeInTheDocument();
  });

  it("plays and completes an unlocked single-note lesson", async () => {
    window.history.pushState({}, "", "/courses/finger-placement/lessons/middle-c-anchor");
    render(<App />);

    await screen.findByRole("heading", { name: "Middle C Anchor" });
    fireEvent.keyDown(window, { key: "d" });

    expect(playNote).toHaveBeenCalledWith("C4");
    expect(await screen.findByText("Lesson complete")).toBeInTheDocument();
    expect(window.localStorage.getItem("piano360.progress.v1")).toContain("middle-c-anchor");
  });
});
