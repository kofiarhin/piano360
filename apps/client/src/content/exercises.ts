import type { Exercise, NoteTarget } from "./types";

const range = {
  beginner: { startNote: "C", startOctave: 3, endNote: "C", endOctave: 5 } as const
};

const target = (
  note: NoteTarget["note"],
  octave: number,
  hand: NoteTarget["hand"],
  finger: NoteTarget["finger"],
  role: string,
  displayLabel = `${note}${octave}`
): NoteTarget => ({
  note,
  octave,
  hand,
  finger,
  role,
  displayLabel
});

export const exercises: Exercise[] = [
  {
    id: "middle-c-anchor",
    title: "Middle C anchor",
    description: "Find middle C three times and build a center landmark.",
    category: "orientation",
    difficulty: "beginner",
    estimatedMinutes: 3,
    lessonId: "lesson-middle-c-map",
    skillIds: ["middle-c-orientation"],
    keyboardRange: range.beginner,
    completionRule: { minimumCorrectSteps: 2, allowSkips: true },
    validationModes: ["manual"],
    prerequisiteExerciseIds: [],
    steps: [
      {
        id: "middle-c-right-thumb",
        instruction: "Place right thumb on middle C.",
        targetNotes: [target("C", 4, "right", 1, "anchor", "Middle C")],
        expectedHand: "right",
        skippable: false,
        validationModes: ["manual"],
        successFeedback: "Good. Middle C is your center landmark.",
        retryHint: "Look for the C just left of the pair of black keys near the piano center."
      },
      {
        id: "middle-c-left-thumb",
        instruction: "Place left thumb on middle C.",
        targetNotes: [target("C", 4, "left", 1, "anchor", "Middle C")],
        expectedHand: "left",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "Good. Both hands can find the same anchor.",
        retryHint: "Keep the note the same and switch hands."
      },
      {
        id: "middle-c-repeat",
        instruction: "Look away, then return right thumb to middle C.",
        targetNotes: [target("C", 4, "right", 1, "anchor", "Middle C")],
        expectedHand: "right",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "That repeat builds spatial memory.",
        retryHint: "Reset your hand and feel the two-black-key group again."
      }
    ]
  },
  {
    id: "right-hand-five-fingers",
    title: "Right-hand five fingers",
    description: "Place right-hand fingers 1 through 5 on C through G.",
    category: "finger-numbers",
    difficulty: "beginner",
    estimatedMinutes: 4,
    lessonId: "lesson-middle-c-map",
    skillIds: ["right-hand-finger-numbers", "white-key-geography"],
    keyboardRange: range.beginner,
    completionRule: { minimumCorrectSteps: 3, allowSkips: true },
    validationModes: ["manual"],
    prerequisiteExerciseIds: ["middle-c-anchor"],
    steps: [
      {
        id: "right-c-d-e",
        instruction: "Play C, D, E with right fingers 1, 2, 3.",
        targetNotes: [
          target("C", 4, "right", 1, "start"),
          target("D", 4, "right", 2, "step"),
          target("E", 4, "right", 3, "step")
        ],
        expectedHand: "right",
        skippable: false,
        validationModes: ["manual"],
        successFeedback: "The first three fingers are mapped.",
        retryHint: "Keep thumb on C, index on D, and middle finger on E."
      },
      {
        id: "right-f-g",
        instruction: "Add F and G with fingers 4 and 5.",
        targetNotes: [target("F", 4, "right", 4, "step"), target("G", 4, "right", 5, "top")],
        expectedHand: "right",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "Your right hand now spans C position.",
        retryHint: "Let the hand relax. Ring finger reaches F, little finger reaches G."
      },
      {
        id: "right-c-position",
        instruction: "Place all five right-hand fingers on C, D, E, F, G.",
        targetNotes: [
          target("C", 4, "right", 1, "position"),
          target("D", 4, "right", 2, "position"),
          target("E", 4, "right", 3, "position"),
          target("F", 4, "right", 4, "position"),
          target("G", 4, "right", 5, "position")
        ],
        expectedHand: "right",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "This is right-hand C position.",
        retryHint: "Each finger gets one neighboring white key."
      }
    ]
  },
  {
    id: "left-hand-five-fingers",
    title: "Left-hand five fingers",
    description: "Map left-hand fingers 5 through 1 on C through G below middle C.",
    category: "finger-numbers",
    difficulty: "beginner",
    estimatedMinutes: 4,
    lessonId: "lesson-middle-c-map",
    skillIds: ["left-hand-finger-numbers", "white-key-geography"],
    keyboardRange: range.beginner,
    completionRule: { minimumCorrectSteps: 3, allowSkips: true },
    validationModes: ["manual"],
    prerequisiteExerciseIds: ["middle-c-anchor"],
    steps: [
      {
        id: "left-c-d-e",
        instruction: "Play C, D, E below middle C with left fingers 5, 4, 3.",
        targetNotes: [
          target("C", 3, "left", 5, "start"),
          target("D", 3, "left", 4, "step"),
          target("E", 3, "left", 3, "step")
        ],
        expectedHand: "left",
        skippable: false,
        validationModes: ["manual"],
        successFeedback: "Left-hand finger numbers run in the opposite direction.",
        retryHint: "Little finger starts on C, then move one white key at a time."
      },
      {
        id: "left-f-g",
        instruction: "Add F and G with left fingers 2 and 1.",
        targetNotes: [target("F", 3, "left", 2, "step"), target("G", 3, "left", 1, "top")],
        expectedHand: "left",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "Your left thumb lands on G.",
        retryHint: "Keep the wrist quiet and let the thumb reach G."
      },
      {
        id: "left-c-position",
        instruction: "Place all five left-hand fingers on C, D, E, F, G.",
        targetNotes: [
          target("C", 3, "left", 5, "position"),
          target("D", 3, "left", 4, "position"),
          target("E", 3, "left", 3, "position"),
          target("F", 3, "left", 2, "position"),
          target("G", 3, "left", 1, "position")
        ],
        expectedHand: "left",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "This is left-hand C position.",
        retryHint: "Use one finger per white key."
      }
    ]
  },
  {
    id: "step-and-skip-drill",
    title: "Steps and skips",
    description: "Feel seconds as neighbors and thirds as one-key skips.",
    category: "intervals",
    difficulty: "beginner",
    estimatedMinutes: 4,
    lessonId: "lesson-beginner-intervals",
    skillIds: ["interval-shapes"],
    keyboardRange: range.beginner,
    completionRule: { minimumCorrectSteps: 3, allowSkips: true },
    validationModes: ["manual"],
    prerequisiteExerciseIds: ["right-hand-five-fingers"],
    steps: [
      {
        id: "second-c-d",
        instruction: "Play C to D with right fingers 1 and 2.",
        targetNotes: [target("C", 4, "right", 1, "start"), target("D", 4, "right", 2, "second")],
        expectedHand: "right",
        skippable: false,
        validationModes: ["manual"],
        successFeedback: "A second moves to the neighboring white key.",
        retryHint: "C and D are side by side."
      },
      {
        id: "third-c-e",
        instruction: "Play C to E with right fingers 1 and 3.",
        targetNotes: [target("C", 4, "right", 1, "start"), target("E", 4, "right", 3, "third")],
        expectedHand: "right",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "A third skips over one white key.",
        retryHint: "Keep D between your thumb and middle finger."
      },
      {
        id: "third-d-f",
        instruction: "Play D to F with right fingers 2 and 4.",
        targetNotes: [target("D", 4, "right", 2, "start"), target("F", 4, "right", 4, "third")],
        expectedHand: "right",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "That same skip shape can start on D.",
        retryHint: "D and F have E between them."
      }
    ]
  },
  {
    id: "fourth-fifth-reach",
    title: "Fourth and fifth reach",
    description: "Practice wider beginner intervals from middle C.",
    category: "intervals",
    difficulty: "beginner",
    estimatedMinutes: 4,
    lessonId: "lesson-beginner-intervals",
    skillIds: ["fourths-and-fifths"],
    keyboardRange: range.beginner,
    completionRule: { minimumCorrectSteps: 2, allowSkips: true },
    validationModes: ["manual"],
    prerequisiteExerciseIds: ["step-and-skip-drill"],
    steps: [
      {
        id: "fourth-c-f",
        instruction: "Play C to F with right fingers 1 and 4.",
        targetNotes: [target("C", 4, "right", 1, "start"), target("F", 4, "right", 4, "fourth")],
        expectedHand: "right",
        skippable: false,
        validationModes: ["manual"],
        successFeedback: "A fourth feels like a wider open hand.",
        retryHint: "F is three white-key steps above C."
      },
      {
        id: "fifth-c-g",
        instruction: "Play C to G with right fingers 1 and 5.",
        targetNotes: [target("C", 4, "right", 1, "start"), target("G", 4, "right", 5, "fifth")],
        expectedHand: "right",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "A fifth spans the full five-finger position.",
        retryHint: "Thumb stays on C and little finger reaches G."
      }
    ]
  },
  {
    id: "c-major-triad-shape",
    title: "C major triad shape",
    description: "Play C, E, and G as one steady hand shape.",
    category: "triads",
    difficulty: "beginner",
    estimatedMinutes: 5,
    lessonId: "lesson-first-triads",
    skillIds: ["major-triad-shape"],
    keyboardRange: range.beginner,
    completionRule: { minimumCorrectSteps: 2, allowSkips: true },
    validationModes: ["manual"],
    prerequisiteExerciseIds: ["fourth-fifth-reach"],
    steps: [
      {
        id: "c-major-place",
        instruction: "Place right fingers 1, 3, 5 on C, E, G.",
        targetNotes: [
          target("C", 4, "right", 1, "root"),
          target("E", 4, "right", 3, "third"),
          target("G", 4, "right", 5, "fifth")
        ],
        expectedHand: "right",
        skippable: false,
        validationModes: ["manual"],
        successFeedback: "That is the C major triad shape.",
        retryHint: "Use every other white key: C, E, G."
      },
      {
        id: "c-major-repeat",
        instruction: "Lift, reset, and play C, E, G again.",
        targetNotes: [
          target("C", 4, "right", 1, "root"),
          target("E", 4, "right", 3, "third"),
          target("G", 4, "right", 5, "fifth")
        ],
        expectedHand: "right",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "Repeating the same shape builds muscle memory.",
        retryHint: "Keep the hand shape loose and land on every other white key."
      }
    ]
  },
  {
    id: "a-minor-triad-shape",
    title: "A minor triad shape",
    description: "Compare A, C, and E to the major triad shape.",
    category: "triads",
    difficulty: "beginner",
    estimatedMinutes: 5,
    lessonId: "lesson-first-triads",
    skillIds: ["minor-triad-shape"],
    keyboardRange: range.beginner,
    completionRule: { minimumCorrectSteps: 2, allowSkips: true },
    validationModes: ["manual"],
    prerequisiteExerciseIds: ["c-major-triad-shape"],
    steps: [
      {
        id: "a-minor-place",
        instruction: "Place left fingers 5, 3, 1 on A, C, E.",
        targetNotes: [
          target("A", 3, "left", 5, "root"),
          target("C", 4, "left", 3, "third"),
          target("E", 4, "left", 1, "fifth")
        ],
        expectedHand: "left",
        skippable: false,
        validationModes: ["manual"],
        successFeedback: "That is the A minor triad shape.",
        retryHint: "Use every other white key from A to E."
      },
      {
        id: "major-minor-compare",
        instruction: "Compare A minor with C major by shape, not by speed.",
        targetNotes: [
          target("A", 3, "left", 5, "minor root", "A minor"),
          target("C", 4, "left", 3, "shared tone", "C"),
          target("E", 4, "left", 1, "shared tone", "E")
        ],
        expectedHand: "left",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "You can now feel a minor triad shape.",
        retryHint: "Keep A, C, E as every-other-white-key targets."
      }
    ]
  },
  {
    id: "basic-i-iv-v-i",
    title: "Basic I-IV-V-I",
    description: "Meet the C major home-away-tension-home progression.",
    category: "progressions",
    difficulty: "beginner",
    estimatedMinutes: 6,
    lessonId: "lesson-first-triads",
    skillIds: ["chord-transition-control", "basic-progression-memory"],
    keyboardRange: range.beginner,
    completionRule: { minimumCorrectSteps: 3, allowSkips: true },
    validationModes: ["manual"],
    prerequisiteExerciseIds: ["a-minor-triad-shape"],
    steps: [
      {
        id: "progression-i",
        instruction: "Start at I: play C major with right fingers 1, 3, 5.",
        targetNotes: [
          target("C", 4, "right", 1, "I root", "C"),
          target("E", 4, "right", 3, "I third", "E"),
          target("G", 4, "right", 5, "I fifth", "G")
        ],
        expectedHand: "right",
        skippable: false,
        validationModes: ["manual"],
        successFeedback: "I is the home chord in C major.",
        retryHint: "C, E, G are every other white key."
      },
      {
        id: "progression-iv",
        instruction: "Move to IV: play F and A, then notice C as the top note.",
        targetNotes: [
          target("F", 3, "left", 5, "IV root", "F"),
          target("A", 3, "left", 3, "IV third", "A"),
          target("C", 4, "left", 1, "IV fifth", "C")
        ],
        expectedHand: "left",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "IV feels like moving away from home.",
        retryHint: "Use F, A, C as every other white key."
      },
      {
        id: "progression-v",
        instruction: "Move to V: play G, B, D with the left hand.",
        targetNotes: [
          target("G", 3, "left", 5, "V root", "G"),
          target("B", 3, "left", 3, "V third", "B"),
          target("D", 4, "left", 1, "V fifth", "D")
        ],
        expectedHand: "left",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "V creates tension that wants to resolve.",
        retryHint: "G, B, D is the same every-other-white-key shape."
      },
      {
        id: "progression-return-i",
        instruction: "Return to I: play C major again.",
        targetNotes: [
          target("C", 4, "right", 1, "I root", "C"),
          target("E", 4, "right", 3, "I third", "E"),
          target("G", 4, "right", 5, "I fifth", "G")
        ],
        expectedHand: "right",
        skippable: true,
        validationModes: ["manual"],
        successFeedback: "The progression resolves back home.",
        retryHint: "Return to C, E, G with the right hand."
      }
    ]
  }
];
