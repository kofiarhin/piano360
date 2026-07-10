import request from "supertest";

import { createApp } from "../src/app";
import { noteIds } from "../src/notes";
import type { Lesson } from "../src/lessons/lessonTypes";

const validNoteIds = new Set<string>(noteIds);

describe("lesson routes", () => {
  it("returns the seeded lesson list in lesson order", async () => {
    const response = await request(createApp()).get("/api/lessons").expect(200);
    const lessons = response.body as Lesson[];

    expect(lessons.map((lesson) => lesson.id)).toEqual(["lesson-1", "lesson-2", "lesson-3"]);
    expect(lessons[0]).toMatchObject({
      id: "lesson-1",
      title: "Lesson 1",
      notes: ["C4", "D4", "E4"],
      order: 1
    });
  });

  it("returns lesson detail by id", async () => {
    const response = await request(createApp()).get("/api/lessons/lesson-2").expect(200);
    const lesson = response.body as Lesson;

    expect(lesson).toMatchObject({
      id: "lesson-2",
      title: "Lesson 2",
      notes: ["F4", "G4", "A4", "B4", "C5"],
      order: 2
    });
  });

  it("returns a useful 404 response for missing lessons", async () => {
    const response = await request(createApp()).get("/api/lessons/missing").expect(404);

    expect(response.body).toEqual({
      error: "lesson_not_found",
      message: "Lesson 'missing' was not found."
    });
  });

  it("returns only canonical note ids", async () => {
    const response = await request(createApp()).get("/api/lessons").expect(200);
    const lessons = response.body as Lesson[];

    for (const lesson of lessons) {
      expect(lesson.notes.length).toBeGreaterThan(0);

      for (const noteId of lesson.notes) {
        expect(validNoteIds.has(noteId)).toBe(true);
        expect(noteId).toMatch(/^[A-G]#?[0-9]$/);
      }
    }
  });
});
