import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { playNote } from "./audio/NotePlayer";
import { App } from "./App";
import { practiceSongs } from "./features/practice/practiceData";

const audioMock = vi.hoisted(() => ({
  status: "ready"
}));

vi.mock("./audio/NotePlayer", () => ({
  getAudioStatus: vi.fn(() => audioMock.status),
  playNote: vi.fn(),
  subscribeToAudioStatus: vi.fn(() => vi.fn()),
  warmAudio: vi.fn()
}));

const renderApp = () => render(<App />);

describe("Piano360 MVP", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
    audioMock.status = "ready";
  });

  it("renders the single practice screen with Practice mode as the default", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: "Piano360" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Practice mode" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("PRESS NOW")).toBeInTheDocument();
    expect(screen.getByTestId("current-note")).toHaveTextContent("E4");
    expect(screen.getByLabelText("Virtual piano")).toBeInTheDocument();
  });

  it("starts, pauses, and changes tempo for the system-paced highway", async () => {
    renderApp();

    expect(screen.getByTestId("current-note")).toHaveTextContent("E4");

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(650);
    });
    expect(screen.getByTestId("current-note")).toHaveTextContent("D#4");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(screen.getByTestId("current-note")).toHaveTextContent("D#4");

    fireEvent.change(screen.getByLabelText("Tempo"), { target: { value: "180" } });
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(360);
    });
    expect(screen.getByTestId("current-note")).toHaveTextContent("E4");
  });

  it("marks correct notes, allows wrong recovery, and misses notes after they pass", async () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: /^A3, white key/ }));
    expect(screen.getByText(/Wrong key/)).toBeInTheDocument();
    expect(screen.getByTestId("current-note")).toHaveTextContent("E4");

    fireEvent.pointerDown(screen.getByRole("button", { name: /^E4, white key/ }));
    expect(screen.getByText(/Good/)).toBeInTheDocument();
    expect(screen.getByTestId("correct-count")).toHaveTextContent("1");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1350);
    });
    expect(screen.getByTestId("missed-count")).toHaveTextContent("1");
  });

  it("shows completion metrics and supports Practice Again and Freestyle actions", async () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(practiceSongs[0].notes.length * 640);
    });

    expect(screen.getByRole("heading", { name: "Practice Complete" })).toBeInTheDocument();
    expect(screen.getByText("Total Notes")).toBeInTheDocument();
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Freestyle" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Practice Again" }));
    expect(screen.queryByRole("heading", { name: "Practice Complete" })).not.toBeInTheDocument();
    expect(screen.getByTestId("current-note")).toHaveTextContent("E4");

    fireEvent.click(screen.getByRole("button", { name: "Freestyle mode" }));
    expect(screen.getByRole("heading", { name: "Free Play" })).toBeInTheDocument();
  });

  it("switches to Freestyle, plays pointer and mapped keyboard notes, and hides practice scoring", async () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Freestyle mode" }));

    expect(screen.getByRole("heading", { name: "Free Play" })).toBeInTheDocument();
    expect(screen.queryByText("PRESS NOW")).not.toBeInTheDocument();
    expect(screen.queryByText("Correct")).not.toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("button", { name: /^C4, white key/ }));
    expect(playNote).toHaveBeenCalledWith("C4");
    expect(screen.getByTestId("last-played-note")).toHaveTextContent("C4");

    fireEvent.keyDown(window, { key: "w" });
    expect(playNote).toHaveBeenCalledWith("A#3");
    expect(screen.getByTestId("last-played-note")).toHaveTextContent("A#3");
  });

  it("renders the keyboard range with labels and computer key hints", () => {
    renderApp();

    const piano = screen.getByLabelText("Virtual piano");
    expect(within(piano).getByRole("button", { name: /^A3, white key/ })).toBeInTheDocument();
    expect(within(piano).getByRole("button", { name: /^C5, white key/ })).toBeInTheDocument();
    expect(within(piano).getByText("A")).toBeInTheDocument();
    expect(within(piano).getByText(";")).toBeInTheDocument();
  });

  it("handles unavailable audio without crashing", async () => {
    audioMock.status = "unavailable";
    renderApp();

    expect(screen.getByText("Audio unavailable")).toBeInTheDocument();
    expect(screen.getByLabelText("Virtual piano")).toBeInTheDocument();
  });
});
