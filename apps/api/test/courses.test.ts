import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import { createApp } from "../src/app";
import { createCourseRepository } from "../src/courses/courseRepository";
import { CourseModel } from "../src/courses/courseSchema";
import { createCourseService } from "../src/courses/courseService";
import { seedCourses } from "../src/courses/seedCourses";

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

    expect(response.body).toEqual([
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
        slug: "ode-to-joy",
        title: "Ode to Joy",
        contentType: "single-note",
        hand: "right",
        difficulty: "beginner",
        lessonCount: 3
      })
    ]);
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
      title: "C Major Shape"
    });
    expect(response.body.steps).toContainEqual({
      id: "play-c-major",
      instruction: "Play C major: C4, E4, and G4 together.",
      type: "chord",
      targetNotes: ["C4", "E4", "G4"]
    });
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
