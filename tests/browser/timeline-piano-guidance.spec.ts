import { expect, test, type Page } from "@playwright/test";

const singleNoteLesson = {
  slug: "single-target-check",
  title: "Single Target Check",
  description: "Browser target-key test lesson.",
  order: 1,
  isFinal: false,
  mode: "timeline",
  contentKind: "foundational-drill",
  defaultPracticeMode: "guided",
  availablePracticeModes: ["guided"],
  behaviour: {
    defaultPracticeMode: "guided",
    pauseOnMiss: false,
    enableTimingScore: true,
    timingProfile: "standard",
    allowPerformanceMode: false
  },
  timeline: {
    schemaVersion: 2,
    timingSource: "instructional",
    originalBpm: 60,
    timeSignature: { numerator: 4, denominator: 4 },
    countInBeats: 0,
    totalBeats: 2,
    source: { type: "instructional-template", reviewStatus: "instructional" },
    instructionalTemplate: {
      templateId: "target-browser-test",
      eventSpacingBeats: 2,
      noteDurationBeats: 1,
      firstEventBeat: 0,
      originalBpm: 60,
      countInBeats: 0,
      timingWindows: { perfectMs: 80, goodMs: 160, acceptedMs: 250 }
    },
    events: [
      {
        id: "single-c4",
        type: "note",
        notes: ["C4"],
        startBeat: 0,
        durationBeats: 1
      }
    ]
  }
};

const chordLesson = {
  ...singleNoteLesson,
  slug: "chord-target-check",
  title: "Chord Target Check",
  order: 1,
  timeline: {
    ...singleNoteLesson.timeline,
    events: [
      {
        id: "c-major",
        type: "note",
        notes: ["C4", "E4", "G4"],
        startBeat: 0,
        durationBeats: 1
      }
    ]
  }
};

const course = {
  slug: "finger-placement",
  title: "Finger Placement",
  description: "Target fixture course.",
  contentType: "mixed",
  hand: "right",
  difficulty: "beginner",
  order: 1,
  lessons: [singleNoteLesson, chordLesson]
};

const chordCourse = {
  ...course,
  slug: "browser-chords",
  title: "Browser Chords",
  contentType: "chord",
  lessons: [chordLesson]
};

const mockApi = async (page: Page) => {
  await page.route("**/api/courses/finger-placement/lessons/single-target-check", async (route) => {
    await route.fulfill({
      json: {
        ...singleNoteLesson,
        courseSlug: course.slug,
        courseTitle: course.title,
        courseHand: course.hand
      }
    });
  });
  await page.route("**/api/courses/finger-placement/lessons/chord-target-check", async (route) => {
    await route.fulfill({
      json: {
        ...chordLesson,
        courseSlug: course.slug,
        courseTitle: course.title,
        courseHand: course.hand
      }
    });
  });
  await page.route("**/api/courses/browser-chords/lessons/chord-target-check", async (route) => {
    await route.fulfill({
      json: {
        ...chordLesson,
        courseSlug: chordCourse.slug,
        courseTitle: chordCourse.title,
        courseHand: chordCourse.hand
      }
    });
  });
  await page.route("**/api/courses/finger-placement", async (route) => {
    await route.fulfill({ json: course });
  });
  await page.route("**/api/courses/browser-chords", async (route) => {
    await route.fulfill({ json: chordCourse });
  });
  await page.route("**/api/courses", async (route) => {
    await route.fulfill({
      json: [
        {
          slug: course.slug,
          title: course.title,
          description: course.description,
          contentType: course.contentType,
          hand: course.hand,
          difficulty: course.difficulty,
          order: course.order,
          lessonCount: course.lessons.length
        },
        {
          slug: chordCourse.slug,
          title: chordCourse.title,
          description: chordCourse.description,
          contentType: chordCourse.contentType,
          hand: chordCourse.hand,
          difficulty: chordCourse.difficulty,
          order: chordCourse.order,
          lessonCount: chordCourse.lessons.length
        }
      ]
    });
  });
};

const expectTargetKey = async (page: Page, note: string) => {
  await expect(
    page.locator(`[data-testid="course-piano-root"] [data-note-id="${note}"]`)
  ).toHaveClass(/bg-\[#F59E0B\]/);
};

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("timeline lessons render piano target guidance without an empty note lane", async ({
  page
}) => {
  await page.goto("/courses/finger-placement/lessons/single-target-check", {
    waitUntil: "domcontentloaded"
  });

  await expect(page.getByLabel("Virtual piano")).toBeVisible();
  await expect(page.getByLabel("Falling notes")).toHaveCount(0);
  await expectTargetKey(page, "C4");
});

test("chord lessons highlight every required key simultaneously", async ({ page }) => {
  await page.goto("/courses/browser-chords/lessons/chord-target-check", {
    waitUntil: "domcontentloaded"
  });

  await expectTargetKey(page, "C4");
  await expectTargetKey(page, "E4");
  await expectTargetKey(page, "G4");
});

for (const size of [
  { width: 1280, height: 900 },
  { width: 1024, height: 768 },
  { width: 740, height: 390 }
]) {
  test(`target guidance remains usable at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/courses/finger-placement/lessons/single-target-check", {
      waitUntil: "domcontentloaded"
    });

    await expect(page.getByLabel("Virtual piano")).toBeVisible();
    await expect(page.getByLabel("Practice tempo")).toBeVisible();
    await expectTargetKey(page, "C4");
  });
}
