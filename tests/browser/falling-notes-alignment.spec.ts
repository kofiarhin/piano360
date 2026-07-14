import { expect, test, type Page } from "@playwright/test";

const timelineLesson = {
  slug: "alignment-check",
  title: "Alignment Check",
  description: "Browser alignment test lesson.",
  order: 1,
  isFinal: true,
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
      templateId: "alignment-browser-test",
      eventSpacingBeats: 2,
      noteDurationBeats: 1,
      firstEventBeat: 0,
      originalBpm: 60,
      countInBeats: 0,
      timingWindows: { perfectMs: 80, goodMs: 160, acceptedMs: 250 }
    },
    events: [
      {
        id: "alignment-chord",
        type: "note",
        notes: ["C4", "C#4", "C5"],
        startBeat: 0,
        durationBeats: 1
      }
    ]
  }
};

const course = {
  slug: "finger-placement",
  title: "Finger Placement",
  description: "Alignment fixture course.",
  contentType: "mixed",
  hand: "right",
  difficulty: "beginner",
  order: 1,
  lessons: [timelineLesson]
};

const lessonDetail = {
  ...timelineLesson,
  courseSlug: course.slug,
  courseTitle: course.title,
  courseHand: course.hand
};

const mockApi = async (page: Page) => {
  await page.route("**/api/courses/finger-placement/lessons/alignment-check", async (route) => {
    await route.fulfill({ json: lessonDetail });
  });
  await page.route("**/api/courses/finger-placement", async (route) => {
    await route.fulfill({ json: course });
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
        }
      ]
    });
  });
};

const centerX = (box: { x: number; width: number }) => box.x + box.width / 2;

const expectAligned = async (page: Page, note: string, tolerance = 2) => {
  const key = page.locator(`[data-testid="course-piano-root"] [data-note-id="${note}"]`);
  const bar = page.locator(`[data-testid="falling-notes-stage"] [data-note-id="${note}"]`);
  await expect(key).toBeVisible();
  await expect(bar).toBeVisible();

  const keyBox = await key.boundingBox();
  const barBox = await bar.boundingBox();
  expect(keyBox).not.toBeNull();
  expect(barBox).not.toBeNull();
  expect(Math.abs(centerX(keyBox!) - centerX(barBox!))).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(keyBox!.width - barBox!.width)).toBeLessThanOrEqual(tolerance);
};

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.goto("/courses/finger-placement/lessons/alignment-check", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.getByLabel("Falling notes")).toBeVisible();
  await expect(page.locator('[data-testid="falling-note"]')).toHaveCount(3);
});

test("falling chord bars align to rendered white and black keys", async ({ page }) => {
  await expectAligned(page, "C4");
  await expectAligned(page, "C#4");
  await expectAligned(page, "C5");
});

test("bar bottom reaches the strike line at the target beat", async ({ page }) => {
  const bar = await page.locator('[data-note-id="C4"][data-testid="falling-note"]').boundingBox();
  const strike = await page.getByTestId("falling-notes-strike-line").boundingBox();
  expect(bar).not.toBeNull();
  expect(strike).not.toBeNull();
  expect(Math.abs(bar!.y + bar!.height - (strike!.y + strike!.height))).toBeLessThanOrEqual(2);
});

test("resize preserves alignment", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.waitForTimeout(100);
  await expectAligned(page, "C4");
  await expectAligned(page, "C#4");
});

test("horizontal piano scroll preserves alignment when overflow exists", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 1100 });
  await page.waitForTimeout(100);
  const overflow = await page.getByTestId("course-piano-scroll").evaluate((element) => {
    element.scrollLeft = element.scrollWidth - element.clientWidth;
    element.dispatchEvent(new Event("scroll"));
    return element.scrollWidth > element.clientWidth;
  });
  test.skip(!overflow, "The current viewport does not create piano horizontal overflow.");
  await page.waitForTimeout(100);
  await expectAligned(page, "C5");
});
