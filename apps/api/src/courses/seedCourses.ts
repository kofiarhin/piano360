import type { Course, LessonStep, NoteId } from "./courseTypes";
import { courseSchema } from "./courseValidation";

const single = (id: string, instruction: string, note: NoteId): LessonStep => ({
  id,
  type: "single-note",
  instruction,
  targetNotes: [note]
});

const chord = (id: string, instruction: string, targetNotes: NoteId[]): LessonStep => ({
  id,
  type: "chord",
  instruction,
  targetNotes
});

export const seedCourses: Course[] = [
  {
    slug: "finger-placement",
    title: "Finger Placement",
    description: "Build a right-hand map around middle C with stable finger targets.",
    contentType: "single-note",
    hand: "right",
    difficulty: "beginner",
    order: 1,
    lessons: [
      {
        slug: "middle-c-anchor",
        title: "Middle C Anchor",
        description: "Find the center note and repeat it with control.",
        order: 1,
        isFinal: false,
        steps: [
          single("find-c4", "Play C4 with your right thumb.", "C4"),
          single("repeat-c4", "Play C4 again without looking down.", "C4"),
          single("step-to-d4", "Move one white key to D4.", "D4")
        ]
      },
      {
        slug: "right-hand-steps",
        title: "Right-Hand Steps",
        description: "Walk through the five-finger C position.",
        order: 2,
        isFinal: false,
        steps: [
          single("play-c4", "Play C4.", "C4"),
          single("play-d4", "Play D4.", "D4"),
          single("play-e4", "Play E4.", "E4"),
          single("play-f4", "Play F4.", "F4"),
          single("play-g4", "Play G4.", "G4")
        ]
      },
      {
        slug: "complete-finger-placement",
        title: "Complete Finger Placement",
        description: "Play the complete right-hand placement pattern from C4 to G4 and back.",
        order: 3,
        isFinal: true,
        steps: [
          single("complete-c4-up", "Play C4.", "C4"),
          single("complete-d4-up", "Play D4.", "D4"),
          single("complete-e4-up", "Play E4.", "E4"),
          single("complete-f4-up", "Play F4.", "F4"),
          single("complete-g4-top", "Play G4.", "G4"),
          single("complete-f4-down", "Return to F4.", "F4"),
          single("complete-e4-down", "Return to E4.", "E4"),
          single("complete-d4-down", "Return to D4.", "D4"),
          single("complete-c4-home", "Finish on C4.", "C4")
        ]
      }
    ]
  },
  {
    slug: "beginner-chords",
    title: "Beginner Chords",
    description: "Learn simple right-hand chord shapes as exact note sets.",
    contentType: "chord",
    hand: "right",
    difficulty: "beginner",
    order: 2,
    lessons: [
      {
        slug: "c-major-chord",
        title: "C Major Shape",
        description: "Play C, E, and G together as one chord.",
        order: 1,
        isFinal: false,
        steps: [
          single("locate-c4", "Locate the root C4.", "C4"),
          single("locate-e4", "Locate the middle note E4.", "E4"),
          single("locate-g4", "Locate the top note G4.", "G4"),
          chord("play-c-major", "Play C major: C4, E4, and G4 together.", ["C4", "E4", "G4"])
        ]
      },
      {
        slug: "g-major-chord",
        title: "G Major Shape",
        description: "Move the same shape to G, B, and D.",
        order: 2,
        isFinal: false,
        steps: [
          single("locate-g4", "Locate the root G4.", "G4"),
          single("locate-b4", "Locate B4.", "B4"),
          single("locate-d4", "Locate D4.", "D4"),
          chord("play-g-major", "Play G major: G4, B4, and D4 together.", ["G4", "B4", "D4"])
        ]
      },
      {
        slug: "complete-beginner-chords",
        title: "Complete Beginner Chords",
        description: "Play the complete C and G chord drill.",
        order: 3,
        isFinal: true,
        steps: [
          chord("complete-c-major-first", "Play C major.", ["C4", "E4", "G4"]),
          chord("complete-g-major", "Play G major.", ["G4", "B4", "D4"]),
          chord("complete-c-major-return", "Return to C major.", ["C4", "E4", "G4"])
        ]
      }
    ]
  },
  {
    slug: "ode-to-joy",
    title: "Ode to Joy",
    description: "Learn a one-hand melody fragment inside the A3-C5 keyboard.",
    contentType: "single-note",
    hand: "right",
    difficulty: "beginner",
    order: 3,
    lessons: [
      {
        slug: "ode-first-phrase",
        title: "First Phrase",
        description: "Start the melody with small steps around E4 and G4.",
        order: 1,
        isFinal: false,
        steps: [
          single("ode-e4-1", "Play E4.", "E4"),
          single("ode-e4-2", "Repeat E4.", "E4"),
          single("ode-f4", "Step up to F4.", "F4"),
          single("ode-g4", "Step up to G4.", "G4")
        ]
      },
      {
        slug: "ode-answer-phrase",
        title: "Answer Phrase",
        description: "Practice the answering descent.",
        order: 2,
        isFinal: false,
        steps: [
          single("ode-g4-1", "Play G4.", "G4"),
          single("ode-f4-1", "Step down to F4.", "F4"),
          single("ode-e4-1", "Step down to E4.", "E4"),
          single("ode-d4-1", "Step down to D4.", "D4")
        ]
      },
      {
        slug: "complete-ode-to-joy",
        title: "Complete Ode to Joy",
        description: "Play the complete beginner melody phrase.",
        order: 3,
        isFinal: true,
        steps: [
          single("ode-full-e4-a", "Play E4.", "E4"),
          single("ode-full-e4-b", "Repeat E4.", "E4"),
          single("ode-full-f4-a", "Play F4.", "F4"),
          single("ode-full-g4-a", "Play G4.", "G4"),
          single("ode-full-g4-b", "Repeat G4.", "G4"),
          single("ode-full-f4-b", "Play F4.", "F4"),
          single("ode-full-e4-c", "Play E4.", "E4"),
          single("ode-full-d4-a", "Play D4.", "D4"),
          single("ode-full-c4-a", "Play C4.", "C4"),
          single("ode-full-c4-b", "Repeat C4.", "C4"),
          single("ode-full-d4-b", "Play D4.", "D4"),
          single("ode-full-e4-d", "Finish on E4.", "E4")
        ]
      }
    ]
  }
].map((course) => courseSchema.parse(course));
