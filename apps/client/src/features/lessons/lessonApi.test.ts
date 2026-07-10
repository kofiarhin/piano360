import { getLessons } from "./lessonApi";

describe("lesson API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses bundled lessons in production when no API URL is configured", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_API_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getLessons()).resolves.toEqual([
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
      },
      {
        id: "lesson-3",
        title: "Lesson 3",
        description: "Practice a mixed pattern across the C major hand position.",
        notes: ["C4", "E4", "G4", "D4", "F4", "A4"],
        order: 3
      }
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
