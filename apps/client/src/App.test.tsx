import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { App } from "./App";
import { CONTENT_VERSION } from "./content";
import { PROGRESS_STORAGE_KEY, createEmptyProgress } from "./features/progress/storage";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

describe("Piano360 app", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
    vi.restoreAllMocks();
  });

  it.each([
    ["/", "Start at the keyboard"],
    ["/lessons", "Lessons"],
    ["/practice/free", "Explore around middle C"],
    ["/practice/middle-c-anchor", "Middle C anchor"],
    ["/library", "Library"],
    ["/progress", "Local device progress"]
  ])("renders route %s", (path, expectedText) => {
    renderAt(path);

    expect(screen.getByRole("heading", { name: new RegExp(expectedText) })).toBeInTheDocument();
  });

  it("renders the lesson catalog", () => {
    renderAt("/lessons");

    expect(screen.getByText("Find the center")).toBeInTheDocument();
    expect(screen.getByText("Right-hand five fingers")).toBeInTheDocument();
    expect(screen.getByText("Basic I-IV-V-I")).toBeInTheDocument();
  });

  it("loads a valid exercise and shows a recoverable state for an invalid exercise", () => {
    renderAt("/practice/middle-c-anchor");

    expect(screen.getByRole("heading", { name: "Middle C anchor" })).toBeInTheDocument();
    cleanup();

    renderAt("/practice/not-a-real-exercise");

    expect(screen.getByRole("alert")).toHaveTextContent("This practice link is not available.");
    expect(screen.getByRole("link", { name: "Back to lessons" })).toHaveAttribute("href", "/lessons");
  });

  it("renders target highlights and finger numbers on the virtual piano", () => {
    renderAt("/practice/middle-c-anchor");

    const targetKey = screen.getByRole("button", {
      name: /C4, white key, right hand finger 1, target note/
    });

    expect(targetKey).toHaveAttribute("data-target", "true");
    expect(screen.getByText("RH")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });

  it("advances on Correct, stays on Try Again, skips allowed steps, and restarts", async () => {
    const user = userEvent.setup();
    renderAt("/practice/middle-c-anchor");

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try Again" }));
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Skip" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Correct" }));
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Restart" }));
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("writes local progress when an exercise is completed", async () => {
    const user = userEvent.setup();
    renderAt("/practice/middle-c-anchor");

    await user.click(screen.getByRole("button", { name: "Correct" }));
    await user.click(screen.getByRole("button", { name: "Correct" }));
    await user.click(screen.getByRole("button", { name: "Correct" }));

    expect(await screen.findByRole("heading", { name: "Practice summary" })).toBeInTheDocument();

    await waitFor(() => {
      const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      expect(raw).toContain("middle-c-anchor");
    });
  });

  it("progress route reads completed local progress", () => {
    const progress = createEmptyProgress();
    progress.contentVersion = CONTENT_VERSION;
    progress.completedExerciseIds = ["middle-c-anchor"];
    progress.recentExerciseIds = ["middle-c-anchor"];
    progress.exerciseStats["middle-c-anchor"] = {
      exerciseId: "middle-c-anchor",
      attempts: 3,
      correctAttempts: 3,
      retryAttempts: 0,
      skippedSteps: 0,
      completionCount: 1,
      completedAt: "2026-07-07T12:00:00.000Z",
      lastPracticedAt: "2026-07-07T12:00:00.000Z"
    };
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));

    renderAt("/progress");

    expect(screen.getByText("Middle C anchor")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("free practice renders and reports selected key details", async () => {
    const user = userEvent.setup();
    renderAt("/practice/free");

    await user.click(screen.getByRole("button", { name: /^C4, white key/ }));

    expect(screen.getByText("Selected key")).toBeInTheDocument();
    expect(screen.getByText("white")).toBeInTheDocument();
    expect(screen.getAllByText("C4").length).toBeGreaterThan(0);
  });

  it("corrupt localStorage does not crash the app", () => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, "{broken");

    renderAt("/progress");

    expect(screen.getByRole("heading", { name: "Local device progress" })).toBeInTheDocument();
    expect(screen.getByText(/could not be read/)).toBeInTheDocument();
  });
});
