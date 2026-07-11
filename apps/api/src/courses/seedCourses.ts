import type { Course, Lesson, LessonStep, NoteId } from "./courseTypes";
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

type SingleNotePhrase = {
  slug: string;
  title: string;
  description: string;
  stepPrefix: string;
  rhythmHint: string;
  notes: NoteId[];
};

type SingleNoteCourseConfig = {
  slug: string;
  title: string;
  description: string;
  order: number;
  phrases: SingleNotePhrase[];
  finalSlug: string;
  finalTitle: string;
  finalDescription: string;
  finalStepPrefix: string;
  finalRhythmHint: string;
};

const buildSingleNoteLesson = (
  phrase: SingleNotePhrase,
  order: number,
  isFinal = false
): Lesson => ({
  slug: phrase.slug,
  title: phrase.title,
  description: phrase.description,
  order,
  isFinal,
  steps: phrase.notes.map((note, index) =>
    single(
      `${phrase.stepPrefix}-${String(index + 1).padStart(2, "0")}`,
      `${phrase.rhythmHint}: play ${note}.`,
      note
    )
  )
});

const buildSingleNoteCourse = (config: SingleNoteCourseConfig): Course => ({
  slug: config.slug,
  title: config.title,
  description: config.description,
  contentType: "single-note",
  hand: "right",
  difficulty: "beginner",
  order: config.order,
  lessons: [
    ...config.phrases.map((phrase, index) => buildSingleNoteLesson(phrase, index + 1)),
    buildSingleNoteLesson(
      {
        slug: config.finalSlug,
        title: config.finalTitle,
        description: config.finalDescription,
        stepPrefix: config.finalStepPrefix,
        rhythmHint: config.finalRhythmHint,
        notes: config.phrases.flatMap((phrase) => phrase.notes)
      },
      config.phrases.length + 1,
      true
    )
  ]
});

const foundationalCourses: Course[] = [
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
];

const reggaeCourses: Course[] = [
  buildSingleNoteCourse({
    slug: "three-little-birds-limited-excerpt",
    title: "Three Little Birds Limited Excerpt",
    description:
      "Practice a licensed or legally approved excerpt using a bright, simplified reggae contour.",
    order: 4,
    phrases: [
      {
        slug: "three-little-birds-lift",
        title: "Lift Phrase",
        description: "Shape the opening lift with relaxed repeated notes.",
        stepPrefix: "tlb-lift",
        rhythmHint: "Light reggae lift with a small space before the next target",
        notes: ["C4", "E4", "G4", "A4", "G4", "E4", "D4", "C4", "E4", "G4", "A4", "G4"]
      },
      {
        slug: "three-little-birds-answer",
        title: "Answer Phrase",
        description: "Answer the lift with a calm stepwise landing.",
        stepPrefix: "tlb-answer",
        rhythmHint: "Relaxed answer phrase with gentle offbeat emphasis",
        notes: ["E4", "D4", "C4", "D4", "E4", "G4", "E4", "D4", "C4", "C4", "D4", "E4"]
      }
    ],
    finalSlug: "complete-three-little-birds-excerpt",
    finalTitle: "Complete Approved Excerpt",
    finalDescription:
      "Combine the limited approved excerpt phrases without extending into a full song transcription.",
    finalStepPrefix: "tlb-complete",
    finalRhythmHint: "Complete approved excerpt with relaxed reggae spacing"
  }),
  buildSingleNoteCourse({
    slug: "one-love-limited-excerpt",
    title: "One Love Limited Excerpt",
    description:
      "Practice a licensed or legally approved excerpt as a short right-hand single-note melody.",
    order: 5,
    phrases: [
      {
        slug: "one-love-rise",
        title: "Rising Phrase",
        description: "Move upward through a warm reggae phrase.",
        stepPrefix: "ol-rise",
        rhythmHint: "Gentle offbeat rise with each repeated note kept even",
        notes: ["G4", "A4", "B4", "A4", "G4", "E4", "G4", "A4", "G4", "E4", "D4", "E4"]
      },
      {
        slug: "one-love-return",
        title: "Return Phrase",
        description: "Return to the home note through a compact answer.",
        stepPrefix: "ol-return",
        rhythmHint: "Short-answer feel with a soft space after repeated notes",
        notes: ["E4", "G4", "A4", "G4", "E4", "D4", "C4", "D4", "E4", "D4", "C4", "C4"]
      }
    ],
    finalSlug: "complete-one-love-excerpt",
    finalTitle: "Complete Approved Excerpt",
    finalDescription:
      "Combine the limited approved excerpt phrases without adding a full song transcription.",
    finalStepPrefix: "ol-complete",
    finalRhythmHint: "Complete approved excerpt with steady offbeat phrasing"
  }),
  buildSingleNoteCourse({
    slug: "redemption-song-limited-excerpt",
    title: "Redemption Song Limited Excerpt",
    description:
      "Practice a licensed or legally approved excerpt with a simplified folk-reggae contour.",
    order: 6,
    phrases: [
      {
        slug: "redemption-song-low-call",
        title: "Low Call Phrase",
        description: "Start low and climb into the phrase with control.",
        stepPrefix: "rs-low-call",
        rhythmHint: "Plain call phrase with a held-feel repeated note",
        notes: ["A3", "C4", "D4", "E4", "D4", "C4", "A3", "C4", "D4", "E4", "G4", "E4"]
      },
      {
        slug: "redemption-song-settle",
        title: "Settle Phrase",
        description: "Settle the phrase back into the lower hand position.",
        stepPrefix: "rs-settle",
        rhythmHint: "Settled answer with light spaces between note groups",
        notes: ["D4", "C4", "A3", "B3", "C4", "D4", "C4", "A3", "B3", "C4", "A3", "A3"]
      }
    ],
    finalSlug: "complete-redemption-song-excerpt",
    finalTitle: "Complete Approved Excerpt",
    finalDescription:
      "Combine the limited approved excerpt phrases without extending beyond the approved passage.",
    finalStepPrefix: "rs-complete",
    finalRhythmHint: "Complete approved excerpt with simple folk-reggae timing"
  }),
  buildSingleNoteCourse({
    slug: "rivers-of-babylon-limited-excerpt",
    title: "Rivers of Babylon Limited Excerpt",
    description: "Practice a licensed or legally approved excerpt in a compact beginner range.",
    order: 7,
    phrases: [
      {
        slug: "rivers-of-babylon-call",
        title: "Call Phrase",
        description: "Play the call phrase with a clear top-note arrival.",
        stepPrefix: "rob-call",
        rhythmHint: "Call phrase with a small lift before the top note",
        notes: ["E4", "G4", "A4", "B4", "A4", "G4", "E4", "D4", "E4", "G4", "A4", "G4"]
      },
      {
        slug: "rivers-of-babylon-answer",
        title: "Answer Phrase",
        description: "Answer with a descending phrase and steady landing.",
        stepPrefix: "rob-answer",
        rhythmHint: "Answer phrase with an easy offbeat pulse",
        notes: ["G4", "E4", "D4", "C4", "D4", "E4", "G4", "E4", "D4", "C4", "C4", "D4"]
      }
    ],
    finalSlug: "complete-rivers-of-babylon-excerpt",
    finalTitle: "Complete Approved Excerpt",
    finalDescription:
      "Combine the limited approved excerpt phrases without building a full transcription.",
    finalStepPrefix: "rob-complete",
    finalRhythmHint: "Complete approved excerpt with steady reggae spacing"
  }),
  buildSingleNoteCourse({
    slug: "island-sunrise",
    title: "Island Sunrise",
    description: "Learn a complete original reggae melody study with a warm stepwise shape.",
    order: 8,
    phrases: [
      {
        slug: "island-sunrise-opening",
        title: "Opening Phrase",
        description: "Introduce the sunrise melody with repeated anchor notes.",
        stepPrefix: "is-opening",
        rhythmHint: "Original one-drop opening with relaxed repeated notes",
        notes: ["C4", "E4", "G4", "E4", "C4", "D4", "E4", "G4", "A4", "G4", "E4", "D4"]
      },
      {
        slug: "island-sunrise-middle",
        title: "Middle Phrase",
        description: "Climb higher, then settle back through the center.",
        stepPrefix: "is-middle",
        rhythmHint: "Original middle phrase with soft offbeat accents",
        notes: ["E4", "G4", "A4", "B4", "A4", "G4", "E4", "D4", "C4", "D4", "E4", "G4"]
      },
      {
        slug: "island-sunrise-close",
        title: "Closing Phrase",
        description: "Close the original melody with a gentle return home.",
        stepPrefix: "is-close",
        rhythmHint: "Original closing phrase with a calm final landing",
        notes: ["A4", "G4", "E4", "D4", "C4", "D4", "E4", "G4", "E4", "D4", "C4", "C4"]
      }
    ],
    finalSlug: "complete-island-sunrise",
    finalTitle: "Complete Island Sunrise",
    finalDescription: "Play the full original Island Sunrise melody study.",
    finalStepPrefix: "is-complete",
    finalRhythmHint: "Complete original melody with relaxed one-drop spacing"
  }),
  buildSingleNoteCourse({
    slug: "one-drop-walk",
    title: "One-Drop Walk",
    description:
      "Learn a complete original study that walks through repeated one-drop-style targets.",
    order: 9,
    phrases: [
      {
        slug: "one-drop-walk-anchor",
        title: "Anchor Phrase",
        description: "Start with a grounded walking pattern around D4.",
        stepPrefix: "odw-anchor",
        rhythmHint: "Original one-drop walk with repeated anchor notes",
        notes: ["D4", "D4", "F4", "G4", "F4", "D4", "C4", "D4", "F4", "G4", "A4", "G4"]
      },
      {
        slug: "one-drop-walk-turn",
        title: "Turn Phrase",
        description: "Turn the walk through a higher answer.",
        stepPrefix: "odw-turn",
        rhythmHint: "Original turn phrase with clipped offbeat targets",
        notes: ["F4", "G4", "A4", "G4", "F4", "D4", "F4", "G4", "F4", "D4", "C4", "D4"]
      },
      {
        slug: "one-drop-walk-landing",
        title: "Landing Phrase",
        description: "Land the walk with repeated notes and a low return.",
        stepPrefix: "odw-landing",
        rhythmHint: "Original landing phrase with space after repeated notes",
        notes: ["G4", "F4", "D4", "C4", "A3", "C4", "D4", "F4", "D4", "C4", "D4", "D4"]
      }
    ],
    finalSlug: "complete-one-drop-walk",
    finalTitle: "Complete One-Drop Walk",
    finalDescription: "Play the full original One-Drop Walk melody study.",
    finalStepPrefix: "odw-complete",
    finalRhythmHint: "Complete original melody with one-drop-style spacing"
  }),
  buildSingleNoteCourse({
    slug: "kingston-evening",
    title: "Kingston Evening",
    description: "Learn a complete original reggae study with a mellow descending contour.",
    order: 10,
    phrases: [
      {
        slug: "kingston-evening-opening",
        title: "Opening Phrase",
        description: "Open with a mellow phrase around G4 and E4.",
        stepPrefix: "ke-opening",
        rhythmHint: "Original mellow reggae phrase with light syncopation",
        notes: ["G4", "E4", "D4", "E4", "G4", "A4", "G4", "E4", "D4", "C4", "D4", "E4"]
      },
      {
        slug: "kingston-evening-glow",
        title: "Glow Phrase",
        description: "Add a small upper turn before coming down.",
        stepPrefix: "ke-glow",
        rhythmHint: "Original upper phrase with a gentle offbeat glow",
        notes: ["E4", "G4", "A4", "C5", "B4", "A4", "G4", "E4", "D4", "E4", "G4", "A4"]
      },
      {
        slug: "kingston-evening-close",
        title: "Closing Phrase",
        description: "Bring the evening phrase back to a quiet landing.",
        stepPrefix: "ke-close",
        rhythmHint: "Original closing phrase with a quiet final repeat",
        notes: ["G4", "E4", "D4", "C4", "B3", "C4", "D4", "E4", "D4", "C4", "B3", "C4"]
      }
    ],
    finalSlug: "complete-kingston-evening",
    finalTitle: "Complete Kingston Evening",
    finalDescription: "Play the full original Kingston Evening melody study.",
    finalStepPrefix: "ke-complete",
    finalRhythmHint: "Complete original melody with mellow reggae phrasing"
  }),
  buildSingleNoteCourse({
    slug: "positive-vibration-study",
    title: "Positive Vibration Study",
    description: "Learn a complete original reggae study with repeated upbeat figures.",
    order: 11,
    phrases: [
      {
        slug: "positive-vibration-pulse",
        title: "Pulse Phrase",
        description: "Build the upbeat pulse with repeated center notes.",
        stepPrefix: "pvs-pulse",
        rhythmHint: "Original upbeat pulse with short repeated notes",
        notes: ["E4", "E4", "G4", "A4", "G4", "E4", "D4", "E4", "G4", "G4", "A4", "G4"]
      },
      {
        slug: "positive-vibration-lift",
        title: "Lift Phrase",
        description: "Lift the study through B4 and return smoothly.",
        stepPrefix: "pvs-lift",
        rhythmHint: "Original lift phrase with clear offbeat accents",
        notes: ["A4", "B4", "A4", "G4", "E4", "G4", "A4", "G4", "E4", "D4", "E4", "G4"]
      },
      {
        slug: "positive-vibration-release",
        title: "Release Phrase",
        description: "Release the energy with a descending finish.",
        stepPrefix: "pvs-release",
        rhythmHint: "Original release phrase with a relaxed final note",
        notes: ["G4", "E4", "D4", "C4", "D4", "E4", "G4", "E4", "D4", "C4", "C4", "E4"]
      }
    ],
    finalSlug: "complete-positive-vibration-study",
    finalTitle: "Complete Positive Vibration Study",
    finalDescription: "Play the full original Positive Vibration Study melody.",
    finalStepPrefix: "pvs-complete",
    finalRhythmHint: "Complete original melody with upbeat reggae phrasing"
  }),
  buildSingleNoteCourse({
    slug: "ska-step-up",
    title: "Ska Step-Up",
    description: "Practice a complete original ska exercise focused on quick upward steps.",
    order: 12,
    phrases: [
      {
        slug: "ska-step-up-low",
        title: "Low Step Phrase",
        description: "Start the ska pattern with quick lower steps.",
        stepPrefix: "ssu-low",
        rhythmHint: "Original ska phrase with clipped offbeat taps",
        notes: ["C4", "D4", "E4", "D4", "C4", "D4", "E4", "G4", "E4", "D4", "C4", "D4"]
      },
      {
        slug: "ska-step-up-high",
        title: "High Step Phrase",
        description: "Push the ska pattern higher without leaving the beginner range.",
        stepPrefix: "ssu-high",
        rhythmHint: "Original high ska phrase with short, bright attacks",
        notes: ["E4", "F#4", "G4", "A4", "G4", "F#4", "E4", "G4", "A4", "B4", "A4", "G4"]
      },
      {
        slug: "ska-step-up-return",
        title: "Return Phrase",
        description: "Return the exercise to the lower hand position.",
        stepPrefix: "ssu-return",
        rhythmHint: "Original return phrase with crisp offbeat spacing",
        notes: ["A4", "G4", "E4", "D4", "C4", "D4", "E4", "G4", "E4", "D4", "C4", "C4"]
      }
    ],
    finalSlug: "complete-ska-step-up",
    finalTitle: "Complete Ska Step-Up",
    finalDescription: "Play the full original Ska Step-Up exercise.",
    finalStepPrefix: "ssu-complete",
    finalRhythmHint: "Complete original ska exercise with clipped offbeat taps"
  }),
  buildSingleNoteCourse({
    slug: "offbeat-run",
    title: "Offbeat Run",
    description: "Practice a complete original ska exercise built from quick offbeat runs.",
    order: 13,
    phrases: [
      {
        slug: "offbeat-run-start",
        title: "Start Run",
        description: "Start the run with compact notes around D4.",
        stepPrefix: "obr-start",
        rhythmHint: "Original ska run with every note kept short",
        notes: ["D4", "E4", "F#4", "G4", "F#4", "E4", "D4", "E4", "F#4", "G4", "A4", "G4"]
      },
      {
        slug: "offbeat-run-turn",
        title: "Turn Run",
        description: "Turn the run through the upper notes and back.",
        stepPrefix: "obr-turn",
        rhythmHint: "Original turn run with bright offbeat accents",
        notes: ["G4", "A4", "B4", "A4", "G4", "F#4", "E4", "F#4", "G4", "A4", "G4", "E4"]
      },
      {
        slug: "offbeat-run-finish",
        title: "Finish Run",
        description: "Finish the run with a clean lower landing.",
        stepPrefix: "obr-finish",
        rhythmHint: "Original finish run with a clear final repeat",
        notes: ["F#4", "E4", "D4", "C4", "B3", "C4", "D4", "E4", "D4", "C4", "D4", "D4"]
      }
    ],
    finalSlug: "complete-offbeat-run",
    finalTitle: "Complete Offbeat Run",
    finalDescription: "Play the full original Offbeat Run ska exercise.",
    finalStepPrefix: "obr-complete",
    finalRhythmHint: "Complete original ska exercise with short offbeat attacks"
  }),
  buildSingleNoteCourse({
    slug: "echo-bass-melody",
    title: "Echo Bass Melody",
    description: "Practice a complete original dub exercise arranged as a right-hand echo melody.",
    order: 14,
    phrases: [
      {
        slug: "echo-bass-melody-call",
        title: "Call Phrase",
        description: "Play the low call, leaving space after repeated notes.",
        stepPrefix: "ebm-call",
        rhythmHint: "Original dub call with imagined echo space after each group",
        notes: ["A3", "C4", "D4", "D4", "C4", "A3", "C4", "D4", "E4", "D4", "C4", "A3"]
      },
      {
        slug: "echo-bass-melody-echo",
        title: "Echo Phrase",
        description: "Answer the call as if the phrase repeats through delay.",
        stepPrefix: "ebm-echo",
        rhythmHint: "Original dub echo with repeated notes acting like delay repeats",
        notes: ["C4", "D4", "E4", "G4", "E4", "D4", "C4", "C4", "D4", "E4", "D4", "C4"]
      },
      {
        slug: "echo-bass-melody-drop",
        title: "Drop Phrase",
        description: "Drop back to the low anchor and finish with space.",
        stepPrefix: "ebm-drop",
        rhythmHint: "Original dub drop with a roomy final landing",
        notes: ["E4", "D4", "C4", "A3", "A3", "C4", "D4", "E4", "D4", "C4", "A3", "A3"]
      }
    ],
    finalSlug: "complete-echo-bass-melody",
    finalTitle: "Complete Echo Bass Melody",
    finalDescription: "Play the full original Echo Bass Melody dub exercise.",
    finalStepPrefix: "ebm-complete",
    finalRhythmHint: "Complete original dub exercise with imagined echo space"
  }),
  buildSingleNoteCourse({
    slug: "space-and-delay-study",
    title: "Space and Delay Study",
    description:
      "Practice a complete original dub exercise where repeated steps stand in for delay.",
    order: 15,
    phrases: [
      {
        slug: "space-and-delay-space",
        title: "Space Phrase",
        description: "Use repeated notes to feel the space between phrases.",
        stepPrefix: "sds-space",
        rhythmHint: "Original dub space phrase with repeated notes as delay taps",
        notes: ["C4", "C4", "E4", "G4", "E4", "C4", "D4", "D4", "F4", "G4", "F4", "D4"]
      },
      {
        slug: "space-and-delay-delay",
        title: "Delay Phrase",
        description: "Climb and repeat notes as a simple delay effect.",
        stepPrefix: "sds-delay",
        rhythmHint: "Original delay phrase with echo-like repeated targets",
        notes: ["E4", "G4", "A4", "A4", "G4", "E4", "D4", "E4", "G4", "G4", "E4", "D4"]
      },
      {
        slug: "space-and-delay-fade",
        title: "Fade Phrase",
        description: "Fade the study back to a centered ending.",
        stepPrefix: "sds-fade",
        rhythmHint: "Original fade phrase with a spacious final repeat",
        notes: ["G4", "E4", "D4", "C4", "C4", "D4", "E4", "G4", "E4", "D4", "C4", "C4"]
      }
    ],
    finalSlug: "complete-space-and-delay-study",
    finalTitle: "Complete Space and Delay Study",
    finalDescription: "Play the full original Space and Delay Study dub exercise.",
    finalStepPrefix: "sds-complete",
    finalRhythmHint: "Complete original dub exercise with echo-like repeated notes"
  })
];

export const seedCourses: Course[] = [...foundationalCourses, ...reggaeCourses].map((course) =>
  courseSchema.parse(course)
);
