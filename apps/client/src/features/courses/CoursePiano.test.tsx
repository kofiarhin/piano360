import { fireEvent, render, screen } from "@testing-library/react";

import { CoursePiano } from "./CoursePiano";

describe("CoursePiano", () => {
  it("uses exact state colors for suggested, correct, and incorrect keys", () => {
    render(
      <CoursePiano
        targetNotes={["C4", "C#4"]}
        activeNotes={["E4", "D#4"]}
        correctNotes={["G4", "G#4"]}
        wrongNotes={["D4", "F#4"]}
        onInput={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /C4, white key/i }).className).toContain(
      "bg-[#F59E0B]"
    );
    expect(screen.getByRole("button", { name: /C#4, black key/i }).className).toContain(
      "bg-[#F59E0B]"
    );
    expect(screen.getByRole("button", { name: /G4, white key/i }).className).toContain(
      "bg-[#10B981]"
    );
    expect(screen.getByRole("button", { name: /G#4, black key/i }).className).toContain(
      "bg-[#10B981]"
    );
    expect(screen.getByRole("button", { name: /D4, white key/i }).className).toContain(
      "bg-[#EF4444]"
    );
    expect(screen.getByRole("button", { name: /F#4, black key/i }).className).toContain(
      "bg-[#EF4444]"
    );
  });

  it("renders visible outline or glow styling for white and black highlighted keys", () => {
    render(
      <CoursePiano
        targetNotes={["C4", "C#4"]}
        onInput={vi.fn()}
      />
    );

    const whiteKeyClassName = screen.getByRole("button", { name: /C4, white key/i }).className;
    const blackKeyClassName = screen.getByRole("button", { name: /C#4, black key/i }).className;

    expect(whiteKeyClassName).toContain("outline");
    expect(whiteKeyClassName).toContain("ring-[#F59E0B]");
    expect(blackKeyClassName).toContain("outline");
    expect(blackKeyClassName).toContain("shadow-[0_0_0_2px");
  });

  it("prioritizes incorrect, then correct or active, then suggested visual states", () => {
    render(
      <CoursePiano
        targetNotes={["C4", "D4", "E4"]}
        activeNotes={["D4"]}
        correctNotes={["C4"]}
        wrongNotes={["E4"]}
        onInput={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /C4, white key/i }).className).toContain(
      "bg-[#10B981]"
    );
    expect(screen.getByRole("button", { name: /D4, white key/i }).className).toContain(
      "bg-[#10B981]"
    );
    expect(screen.getByRole("button", { name: /E4, white key/i }).className).toContain(
      "bg-[#EF4444]"
    );
  });

  it("ignores pointer input while disabled", () => {
    const onInput = vi.fn();
    const onPrepareAudio = vi.fn();

    render(
      <CoursePiano
        targetNotes={["C4"]}
        disabled
        onInput={onInput}
        onPrepareAudio={onPrepareAudio}
      />
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: /C4, white key/i }));
    fireEvent.pointerDown(screen.getByLabelText("Virtual piano"));

    expect(onInput).not.toHaveBeenCalled();
  });

  it("triggers virtual piano input on pointerdown", () => {
    const onInput = vi.fn();

    render(
      <CoursePiano
        targetNotes={["C4"]}
        onInput={onInput}
      />
    );

    const c4Key = screen.getByRole("button", { name: /C4, white key/i });
    fireEvent.pointerUp(c4Key);
    expect(onInput).not.toHaveBeenCalled();

    fireEvent.pointerDown(c4Key);
    expect(onInput).toHaveBeenCalledWith("C4");
  });
});
