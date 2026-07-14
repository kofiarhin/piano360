import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import { createApp } from "../src/app";
import { createCourseRepository } from "../src/courses/courseRepository";
import { CourseModel } from "../src/courses/courseSchema";
import { createCourseService } from "../src/courses/courseService";
import { seedCourses } from "../src/courses/seedCourses";

jest.setTimeout(30000);

describe("course routes", () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await CourseModel.deleteMany({});
    await CourseModel.insertMany(seedCourses);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  const app = () =>
    createApp({
      courseService: createCourseService(createCourseRepository(CourseModel))
    });

  it("returns seeded course summaries in course order", async () => {
    const response = await request(app()).get("/api/courses").expect(200);

    expect(response.body.map((course: { slug: string }) => course.slug)).toEqual(
      seedCourses.map((course) => course.slug)
    );
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: "finger-placement",
          title: "Finger Placement",
          contentType: "single-note",
          hand: "right",
          difficulty: "beginner",
          lessonCount: 3
        }),
        expect.objectContaining({
          slug: "beginner-chords",
          title: "Beginner Chords",
          contentType: "chord",
          hand: "right",
          difficulty: "beginner",
          lessonCount: 3
        }),
        expect.objectContaining({
          slug: "space-and-delay-study",
          title: "Space and Delay Study",
          contentType: "single-note",
          hand: "right",
          difficulty: "beginner",
          lessonCount: 4
        })
      ])
    );
  });

  it("filters courses by course-level metadata", async () => {
    const response = await request(app())
      .get("/api/courses?contentType=chord&hand=right&difficulty=beginner")
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      slug: "beginner-chords",
      contentType: "chord",
      hand: "right",
      difficulty: "beginner"
    });
  });

  it("returns course detail by slug with ordered lessons", async () => {
    const response = await request(app()).get("/api/courses/finger-placement").expect(200);

    expect(response.body).toMatchObject({
      slug: "finger-placement",
      title: "Finger Placement",
      lessons: [
        { slug: "middle-c-anchor", order: 1 },
        { slug: "right-hand-steps", order: 2 },
        { slug: "complete-finger-placement", order: 3 }
      ]
    });
  });

  it("returns a lesson by course slug and lesson slug", async () => {
    const response = await request(app())
      .get("/api/courses/beginner-chords/lessons/c-major-chord")
      .expect(200);

    expect(response.body).toMatchObject({
      courseSlug: "beginner-chords",
      slug: "c-major-chord",
      title: "C Major Shape",
      mode: "timeline",
      contentKind: "foundational-drill",
      timeline: {
        timingSource: "instructional",
        source: {
          type: "instructional-template",
          reviewStatus: "instructional"
        }
      }
    });
    expect(response.body.steps).toBeUndefined();
    expect(response.body.timeline.events).toContainEqual(
      expect.objectContaining({
        id: "play-c-major",
        instruction: "Play C major: C4, E4, and G4 together.",
        type: "note",
        notes: ["C4", "E4", "G4"]
      })
    );
  });

  it("normalizes legacy migration-blocked song lessons into playable timelines", async () => {
    const rawCourse = seedCourses.find((course) => course.slug === "one-love-limited-excerpt");
    const rawLesson = rawCourse?.lessons.find((lesson) => lesson.slug === "one-love-rise");
    if (!rawLesson || rawLesson.mode !== "migration-blocked") {
      throw new Error("Expected One Love source lesson to retain legacy steps.");
    }

    const response = await request(app())
      .get("/api/courses/one-love-limited-excerpt/lessons/one-love-rise")
      .expect(200);

    expect(response.body).toMatchObject({
      courseSlug: "one-love-limited-excerpt",
      slug: "one-love-rise",
      mode: "timeline",
      contentKind: "song-phrase",
      timeline: {
        timingSource: "instructional",
        source: {
          type: "instructional-template",
          reviewStatus: "instructional"
        }
      }
    });
    expect(response.body.steps).toBeUndefined();
    expect(response.body.legacySteps).toBeUndefined();
    expect(
      response.body.timeline.events.flatMap((event: { notes: string[] }) => event.notes)
    ).toEqual(rawLesson.legacySteps?.flatMap((step) => step.targetNotes));
  });

  it("persists normalized timeline lessons when replacing all courses", async () => {
    const repository = createCourseRepository(CourseModel);

    await repository.replaceAll(seedCourses);

    const storedCourses = await CourseModel.find({}).lean().exec();
    const storedLessons = storedCourses.flatMap((course) => course.lessons);

    expect(storedLessons.length).toBeGreaterThan(0);
    expect(storedLessons.every((lesson) => lesson.mode === "timeline")).toBe(true);
    expect(storedLessons.some((lesson) => lesson.mode === "migration-blocked")).toBe(false);
  });

  it("returns prepared song lessons as playable timelines", async () => {
    const response = await request(app())
      .get("/api/courses/three-little-birds-limited-excerpt/lessons/three-little-birds-lift")
      .expect(200);

    expect(response.body).toMatchObject({
      courseSlug: "three-little-birds-limited-excerpt",
      slug: "three-little-birds-lift",
      mode: "timeline",
      contentKind: "song-phrase",
      timeline: {
        timingSource: "verified",
        source: {
          type: "manual-transcription",
          reviewStatus: "approved"
        }
      }
    });
    expect(response.body.steps).toBeUndefined();
    expect(response.body.legacySteps).toBeUndefined();
    expect(
      response.body.timeline.events.map((event: { notes: string[] }) => event.notes[0])
    ).toEqual(["C4", "E4", "G4", "A4", "G4", "E4", "D4", "C4", "E4", "G4", "A4", "G4"]);
  });

  it("returns useful 404 responses for missing course and lesson slugs", async () => {
    await request(app()).get("/api/courses/missing").expect(404, {
      error: "course_not_found",
      message: "Course 'missing' was not found."
    });

    await request(app()).get("/api/courses/finger-placement/lessons/missing").expect(404, {
      error: "lesson_not_found",
      message: "Lesson 'missing' was not found in course 'finger-placement'."
    });
  });

  it("does not expose obsolete flat lesson routes", async () => {
    await request(app()).get("/api/lessons").expect(404);
    await request(app()).get("/lessons").expect(404);
  });
});
