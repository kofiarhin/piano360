import { render } from "@testing-library/react";

import { useTimelineInput } from "./useTimelineInput";
import type { NoteAttempt } from "./noteInput";

const TestHarness = ({ onInput }: { onInput: (attempt: NoteAttempt) => void }) => {
  useTimelineInput(onInput);
  return <input aria-label="Editable target" />;
};

describe("useTimelineInput", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(1234);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits computer-keyboard note attempts with an event-boundary timestamp", () => {
    const onInput = vi.fn();
    render(<TestHarness onInput={onInput} />);
    const event = new KeyboardEvent("keydown", { key: "d", bubbles: true, cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onInput).toHaveBeenCalledWith({
      note: "C4",
      source: "computer-keyboard",
      timestampMs: 1234
    });
  });

  it("ignores repeated keys and editable targets", () => {
    const onInput = vi.fn();
    const { getByLabelText } = render(<TestHarness onInput={onInput} />);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", repeat: true }));
    getByLabelText("Editable target").dispatchEvent(
      new KeyboardEvent("keydown", { key: "d", bubbles: true })
    );

    expect(onInput).not.toHaveBeenCalled();
  });

  it("does not prevent defaults for unmapped keys", () => {
    const onInput = vi.fn();
    render(<TestHarness onInput={onInput} />);
    const event = new KeyboardEvent("keydown", { key: "x", bubbles: true, cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(onInput).not.toHaveBeenCalled();
  });
});
