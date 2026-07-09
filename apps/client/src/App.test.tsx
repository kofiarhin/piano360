import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { playNote, warmAudio } from "./audio/NotePlayer";
import { sampleFileByNote } from "./audio/PianoSampler";
import { App } from "./App";
import {
  keyboardMap,
  pianoKeys,
  pianoNotes,
  practiceSongs
} from "./features/practice/practiceData";
import type { NoteId } from "./features/practice/practiceTypes";

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

const exactKeyboardMap: Record<string, NoteId> = {
  a: "A3",
  w: "A#3",
  s: "B3",
  d: "C4",
  e: "C#4",
  f: "D4",
  r: "D#4",
  g: "E4",
  h: "F4",
  y: "F#4",
  j: "G4",
  u: "G#4",
  k: "A4",
  i: "A#4",
  l: "B4",
  ";": "C5"
};

const exactSampleMap: Record<NoteId, string> = {
  A3: "A3.mp3",
  "A#3": "Bb3.mp3",
  B3: "B3.mp3",
  C4: "C4.mp3",
  "C#4": "Db4.mp3",
  D4: "D4.mp3",
  "D#4": "Eb4.mp3",
  E4: "E4.mp3",
  F4: "F4.mp3",
  "F#4": "Gb4.mp3",
  G4: "G4.mp3",
  "G#4": "Ab4.mp3",
  A4: "A4.mp3",
  "A#4": "Bb4.mp3",
  B4: "B4.mp3",
  C5: "C5.mp3"
};

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

  it("keeps the virtual keyboard in exact ascending piano-note order", () => {
    expect(pianoNotes).toEqual([
      "A3",
      "A#3",
      "B3",
      "C4",
      "C#4",
      "D4",
      "D#4",
      "E4",
      "F4",
      "F#4",
      "G4",
      "G#4",
      "A4",
      "A#4",
      "B4",
      "C5"
    ]);
    expect(pianoKeys.map((key) => key.noteId)).toEqual(pianoNotes);
  });

  it("maps computer keys to the exact notes under their physical piano positions", () => {
    expect(keyboardMap).toEqual(exactKeyboardMap);
  });

  it("maps every note to the exact bundled piano sample", () => {
    expect(sampleFileByNote).toEqual(exactSampleMap);
  });

  it("renders the single practice screen with Practice mode as the default", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: "Piano360" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Practice mode" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("PRESS NOW")).toBeInTheDocument();
    expect(screen.getByTestId("current-note")).toHaveTextContent("E4");
    expect(screen.getByLabelText("Virtual piano")).toBeInTheDocument();
  });

  it("does not warm or unlock audio during initial render", () => {
    renderApp();

    expect(warmAudio).not.toHaveBeenCalled();
    expect(playNote).not.toHaveBeenCalled();
  });

  it("defaults the mobile control rail to collapsed and toggles it", () => {
    renderApp();

    const expandButton = screen.getByRole("button", { name: "Expand controls" });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(expandButton);

    const collapseButton = screen.getByRole("button", { name: "Collapse controls" });
    expect(collapseButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(collapseButton);

    expect(screen.getByRole("button", { name: "Expand controls" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("starts, pauses, and changes tempo for the system-paced highway", async () => {
    renderApp();

    expect(screen.getByTestId("current-note")).toHaveTextContent("E4");

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(warmAudio).toHaveBeenCalledTimes(1);
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

  it("shows completion metrics, disables stale playback, and supports reset actions", async () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(practiceSongs[0].notes.length * 640);
    });

    expect(screen.getByRole("heading", { name: "Practice Complete" })).toBeInTheDocument();
    expect(screen.getByText("Total Notes")).toBeInTheDocument();
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Freestyle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Practice Again" }));
    expect(screen.queryByRole("heading", { name: "Practice Complete" })).not.toBeInTheDocument();
    expect(screen.getByTestId("current-note")).toHaveTextContent("E4");
    expect(screen.getByRole("button", { name: "Play" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Freestyle mode" }));
    expect(screen.getByRole("heading", { name: "Free Play" })).toBeInTheDocument();
  });

  it("switches to Freestyle, plays pointer and mapped keyboard notes, and hides practice scoring", async () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Freestyle mode" }));

    expect(screen.getByRole("heading", { name: "Free Play" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    expect(screen.queryByText("PRESS NOW")).not.toBeInTheDocument();
    expect(screen.queryByText("Correct")).not.toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("button", { name: /^C4, white key/ }));
    expect(playNote).toHaveBeenCalledWith("C4");
    expect(screen.getByTestId("last-played-note")).toHaveTextContent("C4");

    fireEvent.keyDown(window, { key: "r" });
    expect(playNote).toHaveBeenCalledWith("D#4");
    expect(screen.getByTestId("last-played-note")).toHaveTextContent("D#4");

    fireEvent.keyDown(window, { key: "i" });
    expect(playNote).toHaveBeenCalledWith("A#4");
    expect(screen.getByTestId("last-played-note")).toHaveTextContent("A#4");
  });

  it("plays a practice note from the desktop keyboard shortcut path", () => {
    renderApp();

    fireEvent.keyDown(window, { key: "g" });

    expect(playNote).toHaveBeenCalledWith("E4");
    expect(screen.getByText(/Good/)).toBeInTheDocument();
  });

  it("plays a note from the iOS touch-start path without double-playing the compatibility pointer event", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Freestyle mode" }));

    const c4Key = screen.getByRole("button", { name: /^C4, white key/ });

    fireEvent.touchStart(c4Key, {
      changedTouches: [{ identifier: 1 }],
      touches: [{ identifier: 1 }]
    });

    expect(playNote).toHaveBeenCalledTimes(1);
    expect(playNote).toHaveBeenCalledWith("C4");
    expect(screen.getByTestId("last-played-note")).toHaveTextContent("C4");

    fireEvent.pointerDown(c4Key, { pointerId: 1, pointerType: "touch" });

    expect(playNote).toHaveBeenCalledTimes(1);
  });

  it("does not trigger piano shortcuts while editing controls", () => {
    renderApp();

    fireEvent.keyDown(screen.getByLabelText("Tempo"), { key: "d" });

    expect(playNote).not.toHaveBeenCalled();
  });

  it("renders the keyboard range with labels and synced computer key hints", () => {
    renderApp();

    const piano = screen.getByLabelText("Virtual piano");
    expect(within(piano).getByRole("button", { name: /^A3, white key/ })).toBeInTheDocument();
    expect(within(piano).getByRole("button", { name: /^C5, white key/ })).toBeInTheDocument();
    expect(within(piano).getByText("A")).toBeInTheDocument();
    expect(within(piano).getByText("R")).toBeInTheDocument();
    expect(within(piano).getByText("I")).toBeInTheDocument();
    expect(within(piano).getByText(";")).toBeInTheDocument();
  });

  it("renders the freestyle helper map from the playable keyboard layout", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Freestyle mode" }));

    const helperMap = screen.getByLabelText("Computer keyboard map");
    expect(within(helperMap).getByText("W")).toBeInTheDocument();
    expect(within(helperMap).getByText("E")).toBeInTheDocument();
    expect(within(helperMap).getByText("R")).toBeInTheDocument();
    expect(within(helperMap).getByText("I")).toBeInTheDocument();
    expect(within(helperMap).queryByText("T")).not.toBeInTheDocument();
    expect(within(helperMap).queryByText("O")).not.toBeInTheDocument();
  });

  it("handles unavailable audio without crashing", async () => {
    audioMock.status = "unavailable";
    renderApp();

    expect(screen.getByText("Audio unavailable")).toBeInTheDocument();
    expect(screen.getByLabelText("Virtual piano")).toBeInTheDocument();
  });
});
