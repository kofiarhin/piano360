import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { playNote } from "./audio/NotePlayer";
import { App } from "./App";
import type { Lesson } from "./features/lessons/lessonTypes";

vi.mock("./audio/NotePlayer", () => ({
  playNote: vi.fn()
}));

const lessons: Lesson[] = [
  {
    id: "lesson-1",
    title: "Lesson 1",
    description: "Find the first three white keys around middle C.",
    notes: ["C4", "D4", "E4"],
    order: 1
  },
  {
    id: "lesson-2",
    title: "Lesson 2",
    description: "Continue upward from F4 to C5.",
    notes: ["F4", "G4", "A4", "B4", "C5"],
    order: 2
  }
];

const mockFetchLessons = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => lessons
    }))
  );
};

const renderLessonApp = async () => {
  render(<App />);

  await screen.findByRole("heading", { name: "Piano360" });
  await screen.findByRole("heading", { name: "Lesson 1" });
  vi.useFakeTimers();
};

describe("Piano360 lesson experience", () => {
  beforeEach(() => {
    mockFetchLessons();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("opens directly into a lesson experience without timed practice controls", async () => {
    await renderLessonApp();

    expect(screen.getByLabelText("Lesson")).toBeInTheDocument();
    expect(screen.getByText("Find the first three white keys around middle C.")).toBeInTheDocument();
    expect(screen.getByLabelText("Virtual piano")).toBeInTheDocument();
    expect(screen.queryByText("PRESS NOW")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Tempo")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Freestyle mode" })).not.toBeInTheDocument();
  });

  it("renders the current note as one exact canonical string", async () => {
    await renderLessonApp();

    const currentNote = screen.getByTestId("current-note");

    expect(currentNote).toHaveTextContent(/^C4$/);
    expect(currentNote.textContent).toBe("C4");
    expect(within(currentNote).queryByText("C")).not.toBeInTheDocument();
    expect(within(currentNote).queryByText("4")).not.toBeInTheDocument();
  });

  it("keeps the lesson prompt and matching piano key label identical", async () => {
    await renderLessonApp();

    const promptLabel = screen.getByTestId("current-note").textContent;
    const pianoKey = screen.getByRole("button", { name: /^C4, white key/ });

    expect(promptLabel).toBe("C4");
    expect(within(pianoKey).getByText("C4")).toBeInTheDocument();
  });

  it("advances after correct computer keyboard input", async () => {
    await renderLessonApp();

    fireEvent.keyDown(window, { key: "d" });

    expect(playNote).toHaveBeenCalledWith("C4");
    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByTestId("current-note")).toHaveTextContent("C4");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(430);
    });

    expect(screen.getByTestId("current-note")).toHaveTextContent("D4");
    expect(screen.getByTestId("lesson-progress")).toHaveTextContent("2 / 3");
  });

  it("does not advance after incorrect input", async () => {
    await renderLessonApp();

    fireEvent.keyDown(window, { key: "f" });

    expect(playNote).toHaveBeenCalledWith("D4");
    expect(screen.getByText("Try again")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(screen.getByTestId("current-note")).toHaveTextContent("C4");
    expect(screen.getByTestId("lesson-progress")).toHaveTextContent("1 / 3");
  });

  it("uses the same note handler for piano clicks and completes the lesson", async () => {
    await renderLessonApp();

    fireEvent.pointerDown(screen.getByRole("button", { name: /^C4, white key/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(430);
    });

    fireEvent.pointerDown(screen.getByRole("button", { name: /^D4, white key/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(430);
    });

    fireEvent.pointerDown(screen.getByRole("button", { name: /^E4, white key/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(430);
    });

    expect(playNote).toHaveBeenNthCalledWith(1, "C4");
    expect(playNote).toHaveBeenNthCalledWith(2, "D4");
    expect(playNote).toHaveBeenNthCalledWith(3, "E4");
    expect(screen.getByText("Lesson complete")).toBeInTheDocument();
    expect(screen.queryByTestId("current-note")).not.toBeInTheDocument();
    expect(screen.getByTestId("lesson-progress")).toHaveTextContent("3 / 3");
    expect(screen.getByRole("button", { name: "Next lesson" })).toBeInTheDocument();
  });

  it("restarts the active lesson", async () => {
    await renderLessonApp();

    fireEvent.keyDown(window, { key: "d" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(430);
    });
    expect(screen.getByTestId("current-note")).toHaveTextContent("D4");

    fireEvent.click(screen.getByRole("button", { name: "Restart lesson" }));

    expect(screen.getByTestId("current-note")).toHaveTextContent("C4");
    expect(screen.getByTestId("lesson-progress")).toHaveTextContent("1 / 3");
    expect(screen.getByText("Play the note shown")).toBeInTheDocument();
  });

  it("ignores keyboard shortcuts from editable controls", async () => {
    await renderLessonApp();

    fireEvent.keyDown(screen.getByLabelText("Lesson"), { key: "d" });

    expect(playNote).not.toHaveBeenCalled();
    expect(screen.getByTestId("current-note")).toHaveTextContent("C4");
  });
});
