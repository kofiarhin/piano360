import type { GuidedStepLesson } from "../src/courses/courseTypes";
import {
  foundationalInstructionalProfile,
  legacyStepsToInstructionalTimeline
} from "../src/courses/legacyStepsToInstructionalTimeline";

const lesson: GuidedStepLesson = {
  slug: "shape-drill",
  title: "Shape Drill",
  description: "Practice notes and chords.",
  order: 1,
  isFinal: false,
  steps: [
    {
      id: "play-c4",
      type: "single-note",
      instruction: "Play C4.",
      targetNotes: ["C4"]
    },
    {
      id: "play-c-major",
      type: "chord",
      instruction: "Play C major.",
      targetNotes: ["C4", "E4", "G4"]
    }
  ]
};

describe("legacyStepsToInstructionalTimeline", () => {
  it("converts legacy steps into deterministic instructional timeline events", () => {
    const converted = legacyStepsToInstructionalTimeline(lesson);

    expect(converted).toMatchObject({
      slug: "shape-drill",
      mode: "timeline",
      contentKind: "foundational-drill",
      defaultPracticeMode: "guided",
      availablePracticeModes: ["guided"],
      behaviour: {
        pauseOnMiss: true,
        enableTimingScore: false,
        timingProfile: "generous"
      },
      timeline: {
        schemaVersion: 2,
        timingSource: "instructional",
        originalBpm: 60,
        countInBeats: 4,
        totalBeats: 4,
        source: {
          type: "instructional-template",
          reviewStatus: "instructional"
        }
      }
    });
    expect(converted.timeline.events).toEqual([
      {
        id: "play-c4",
        type: "note",
        notes: ["C4"],
        startBeat: 0,
        durationBeats: 1,
        hand: "right",
        instruction: "Play C4."
      },
      {
        id: "play-c-major",
        type: "note",
        notes: ["C4", "E4", "G4"],
        startBeat: 2,
        durationBeats: 1,
        hand: "right",
        instruction: "Play C major."
      }
    ]);
  });

  it("does not mutate the source lesson or shared profile", () => {
    const original = structuredClone(lesson);
    const profile = structuredClone(foundationalInstructionalProfile);

    const converted = legacyStepsToInstructionalTimeline(lesson, profile);
    converted.timeline.events[1].notes.reverse();
    converted.timeline.instructionalTemplate!.timingWindows.acceptedMs = 1;

    expect(lesson).toEqual(original);
    expect(profile).toEqual(foundationalInstructionalProfile);
  });
});
