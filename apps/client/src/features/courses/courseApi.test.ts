import { fetchCourse, fetchCourses, fetchLesson } from "../../api";

describe("course API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches course resources from /api", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => []
    }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchCourses({ contentType: "chord", hand: "right", difficulty: "beginner" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/courses?contentType=chord&hand=right&difficulty=beginner"
    );
  });

  it("fetches course and lesson detail", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({})
    }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchCourse("finger-placement");
    await fetchLesson("finger-placement", "middle-c-anchor");

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/courses/finger-placement");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/courses/finger-placement/lessons/middle-c-anchor"
    );
  });
});
