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

const cMajorChord: NoteId[] = ["C4", "E4", "G4"];
const gMajorChord: NoteId[] = ["G4", "B4", "D4"];

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
          single("repeat-c4", "Play C4 again with the same finger shape.", "C4"),
          single("anchor-c4-quiet", "Play C4 once more with a relaxed hand.", "C4"),
          single("step-to-d4", "Move one white key to D4.", "D4"),
          single("repeat-d4", "Repeat D4 without moving the rest of your hand.", "D4"),
          single("return-c4", "Return to C4.", "C4"),
          single("c4-from-memory", "Find C4 again from memory.", "C4"),
          single("d4-from-anchor", "Step from C4 position to D4.", "D4"),
          single("c4-d4-mix-c", "Now choose C4.", "C4"),
          single("c4-d4-mix-d", "Now choose D4.", "D4"),
          single("challenge-c4-home", "Challenge: land on C4 cleanly.", "C4"),
          single("challenge-d4-neighbor", "Challenge: land on D4 cleanly.", "D4")
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
          single("repeat-c4", "Repeat C4.", "C4"),
          single("play-d4", "Play D4.", "D4"),
          single("repeat-d4", "Repeat D4.", "D4"),
          single("play-e4", "Play E4.", "E4"),
          single("repeat-e4", "Repeat E4.", "E4"),
          single("play-f4", "Play F4.", "F4"),
          single("repeat-f4", "Repeat F4.", "F4"),
          single("play-g4", "Play G4.", "G4"),
          single("repeat-g4", "Repeat G4.", "G4"),
          single("step-down-f4", "Step down to F4.", "F4"),
          single("step-down-e4", "Step down to E4.", "E4"),
          single("mix-c4", "Mixed recall: play C4.", "C4"),
          single("mix-e4", "Mixed recall: play E4.", "E4"),
          single("mix-d4", "Mixed recall: play D4.", "D4"),
          single("challenge-g4", "Challenge: reach G4 from the hand position.", "G4")
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
          single("complete-c4-repeat", "Repeat C4.", "C4"),
          single("complete-d4-up", "Play D4.", "D4"),
          single("complete-d4-repeat", "Repeat D4.", "D4"),
          single("complete-e4-up", "Play E4.", "E4"),
          single("complete-e4-repeat", "Repeat E4.", "E4"),
          single("complete-f4-up", "Play F4.", "F4"),
          single("complete-f4-repeat", "Repeat F4.", "F4"),
          single("complete-g4-top", "Play G4.", "G4"),
          single("complete-g4-repeat", "Repeat G4.", "G4"),
          single("complete-f4-down", "Return to F4.", "F4"),
          single("complete-e4-down", "Return to E4.", "E4"),
          single("complete-d4-down", "Return to D4.", "D4"),
          single("complete-c4-home", "Return to C4.", "C4"),
          single("complete-mix-e4", "Mixed recall: play E4.", "E4"),
          single("complete-mix-g4", "Mixed recall: play G4.", "G4"),
          single("complete-mix-d4", "Mixed recall: play D4.", "D4"),
          single("complete-mix-f4", "Mixed recall: play F4.", "F4"),
          single("complete-challenge-c4", "Challenge: finish on C4.", "C4")
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
          single("repeat-c4", "Repeat the root C4.", "C4"),
          single("locate-e4", "Locate the middle note E4.", "E4"),
          single("repeat-e4", "Repeat the middle note E4.", "E4"),
          single("locate-g4", "Locate the top note G4.", "G4"),
          single("repeat-g4", "Repeat the top note G4.", "G4"),
          single("c-major-root-check", "Check the C4 root again.", "C4"),
          single("c-major-top-check", "Check the G4 top note again.", "G4"),
          chord("play-c-major", "Play C major: C4, E4, and G4 together.", cMajorChord),
          chord("repeat-c-major", "Repeat C major with the same shape.", cMajorChord),
          chord("c-major-from-memory", "Play C major from memory.", cMajorChord),
          chord("challenge-c-major", "Challenge: play C major cleanly.", cMajorChord)
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
          single("repeat-g4", "Repeat the root G4.", "G4"),
          single("locate-b4", "Locate B4.", "B4"),
          single("repeat-b4", "Repeat B4.", "B4"),
          single("locate-d4", "Locate D4.", "D4"),
          single("repeat-d4", "Repeat D4.", "D4"),
          single("g-major-root-check", "Check the G4 root again.", "G4"),
          single("g-major-low-check", "Check D4 again before the chord.", "D4"),
          chord("play-g-major", "Play G major: G4, B4, and D4 together.", gMajorChord),
          chord("repeat-g-major", "Repeat G major with the same shape.", gMajorChord),
          chord("g-major-from-memory", "Play G major from memory.", gMajorChord),
          chord("challenge-g-major", "Challenge: play G major cleanly.", gMajorChord)
        ]
      },
      {
        slug: "complete-beginner-chords",
        title: "Complete Beginner Chords",
        description: "Play the complete C and G chord drill.",
        order: 3,
        isFinal: true,
        steps: [
          chord("complete-c-major-first", "Play C major.", cMajorChord),
          chord("complete-c-major-repeat", "Repeat C major.", cMajorChord),
          chord("complete-g-major-first", "Play G major.", gMajorChord),
          chord("complete-g-major-repeat", "Repeat G major.", gMajorChord),
          chord("complete-c-to-g", "Move from C major to G major.", gMajorChord),
          chord("complete-g-to-c", "Move from G major back to C major.", cMajorChord),
          chord("complete-c-major-mix", "Mixed recall: play C major.", cMajorChord),
          chord("complete-g-major-mix", "Mixed recall: play G major.", gMajorChord),
          chord("complete-c-major-challenge", "Challenge: play C major cleanly.", cMajorChord),
          chord("complete-g-major-challenge", "Challenge: play G major cleanly.", gMajorChord),
          chord("complete-g-to-c-final", "Return from G major to C major.", cMajorChord),
          chord("complete-c-major-return", "Finish on C major.", cMajorChord)
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
          single("ode-f4-1", "Step up to F4.", "F4"),
          single("ode-g4-1", "Step up to G4.", "G4"),
          single("ode-g4-2", "Repeat G4.", "G4"),
          single("ode-f4-2", "Step down to F4.", "F4"),
          single("ode-e4-3", "Step down to E4.", "E4"),
          single("ode-d4-1", "Step down to D4.", "D4"),
          single("ode-phrase-repeat-e4-1", "Repeat the phrase: play E4.", "E4"),
          single("ode-phrase-repeat-e4-2", "Repeat E4.", "E4"),
          single("ode-phrase-repeat-f4", "Step up to F4.", "F4"),
          single("ode-phrase-repeat-g4", "Step up to G4.", "G4"),
          single("ode-phrase-mix-g4", "Mixed recall: play G4.", "G4"),
          single("ode-phrase-mix-e4", "Mixed recall: play E4.", "E4"),
          single("ode-phrase-challenge-f4", "Challenge: land on F4.", "F4"),
          single("ode-phrase-challenge-d4", "Challenge: finish this phrase on D4.", "D4")
        ]
      },
      {
        slug: "ode-answer-phrase",
        title: "Answer Phrase",
        description: "Practice the answering descent and landing notes.",
        order: 2,
        isFinal: false,
        steps: [
          single("ode-answer-c4-1", "Play C4.", "C4"),
          single("ode-answer-c4-2", "Repeat C4.", "C4"),
          single("ode-answer-d4-1", "Step up to D4.", "D4"),
          single("ode-answer-e4-1", "Step up to E4.", "E4"),
          single("ode-answer-e4-2", "Repeat E4.", "E4"),
          single("ode-answer-d4-2", "Step down to D4.", "D4"),
          single("ode-answer-d4-3", "Repeat D4.", "D4"),
          single("ode-answer-repeat-c4-1", "Repeat the answer: play C4.", "C4"),
          single("ode-answer-repeat-c4-2", "Repeat C4.", "C4"),
          single("ode-answer-repeat-d4-1", "Step up to D4.", "D4"),
          single("ode-answer-repeat-e4-1", "Step up to E4.", "E4"),
          single("ode-answer-mix-d4", "Mixed recall: play D4.", "D4"),
          single("ode-answer-mix-c4", "Mixed recall: play C4.", "C4"),
          single("ode-answer-challenge-e4", "Challenge: land on E4.", "E4"),
          single("ode-answer-challenge-d4", "Challenge: finish the answer on D4.", "D4")
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
          single("ode-full-e4-d", "Play E4.", "E4"),
          single("ode-full-e4-e", "Repeat E4.", "E4"),
          single("ode-full-d4-b-repeat", "Play D4.", "D4"),
          single("ode-full-d4-c", "Repeat D4.", "D4"),
          single("ode-full-e4-f", "Start the second pass on E4.", "E4"),
          single("ode-full-e4-g", "Repeat E4.", "E4"),
          single("ode-full-f4-c", "Play F4.", "F4"),
          single("ode-full-g4-c", "Play G4.", "G4"),
          single("ode-full-g4-d", "Repeat G4.", "G4"),
          single("ode-full-f4-d", "Play F4.", "F4"),
          single("ode-full-e4-h", "Play E4.", "E4"),
          single("ode-full-d4-d", "Play D4.", "D4"),
          single("ode-full-c4-c", "Play C4.", "C4"),
          single("ode-full-c4-d", "Repeat C4.", "C4"),
          single("ode-full-d4-e", "Play D4.", "D4"),
          single("ode-full-e4-i", "Play E4.", "E4"),
          single("ode-full-d4-f", "Step down to D4.", "D4"),
          single("ode-full-c4-e", "Finish on C4.", "C4")
        ]
      }
    ]
  }
].map((course) => courseSchema.parse(course));
