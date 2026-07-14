import { act, render, screen } from "@testing-library/react";
import { useRef } from "react";

import { measurePianoKeyGeometryRelativeTo, usePianoKeyGeometry } from "./usePianoKeyGeometry";

const setRect = (element: Element, rect: Partial<DOMRect>) => {
  element.getBoundingClientRect = vi.fn(() => ({
    x: rect.left ?? 0,
    y: rect.top ?? 0,
    left: rect.left ?? 0,
    top: rect.top ?? 0,
    right: rect.right ?? (rect.left ?? 0) + (rect.width ?? 0),
    bottom: rect.bottom ?? (rect.top ?? 0) + (rect.height ?? 0),
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    toJSON: () => ({})
  })) as Element["getBoundingClientRect"];
};

describe("piano key geometry", () => {
  it("measures keys relative to the falling-note stage, not the piano root", () => {
    const root = document.createElement("section");
    const white = document.createElement("button");
    const black = document.createElement("button");
    const invalid = document.createElement("button");
    white.dataset.noteId = "C4";
    white.dataset.tone = "white";
    black.dataset.noteId = "C#4";
    black.dataset.tone = "black";
    invalid.dataset.noteId = "not-a-note";
    invalid.dataset.tone = "white";
    root.append(white, black, invalid);

    setRect(root, { left: 100, width: 400 });
    setRect(white, { left: 140, width: 44 });
    setRect(black, { left: 176, width: 28 });

    expect(measurePianoKeyGeometryRelativeTo(root, { left: 40 })).toEqual([
      { note: "C4", tone: "white", left: 100, width: 44, centerX: 122 },
      { note: "C#4", tone: "black", left: 136, width: 28, centerX: 150 }
    ]);
  });

  it("uses the rendered key rect after horizontal scroll", () => {
    const root = document.createElement("section");
    const key = document.createElement("button");
    key.dataset.noteId = "C4";
    key.dataset.tone = "white";
    root.append(key);
    setRect(key, { left: 75, width: 40 });

    expect(measurePianoKeyGeometryRelativeTo(root, { left: 25 })[0]).toMatchObject({
      left: 50,
      centerX: 70
    });
  });

  it("recomputes when observed layout or piano scroll changes", () => {
    const callbacks: ResizeObserverCallback[] = [];
    class MockResizeObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(callback: ResizeObserverCallback) {
        callbacks.push(callback);
      }
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    const TestHarness = () => {
      const pianoRef = useRef<HTMLElement | null>(null);
      const stageRef = useRef<HTMLElement | null>(null);
      const geometry = usePianoKeyGeometry(pianoRef, stageRef);
      return (
        <>
          <section ref={stageRef} data-testid="stage" />
          <section ref={pianoRef} data-testid="piano">
            <div className="piano-scroll" data-testid="scroll">
              <button data-note-id="C4" data-tone="white" />
            </div>
          </section>
          <output data-testid="left">{geometry[0]?.left ?? "none"}</output>
        </>
      );
    };

    render(<TestHarness />);
    const stage = screen.getByTestId("stage");
    const key = screen.getByRole("button");
    const scroll = screen.getByTestId("scroll");
    setRect(stage, { left: 10, width: 400 });
    setRect(key, { left: 50, width: 40 });

    act(() => callbacks.forEach((callback) => callback([], {} as ResizeObserver)));
    expect(screen.getByTestId("left")).toHaveTextContent("40");

    setRect(key, { left: 35, width: 40 });
    act(() => scroll.dispatchEvent(new Event("scroll")));
    expect(screen.getByTestId("left")).toHaveTextContent("25");

    vi.unstubAllGlobals();
  });
});
