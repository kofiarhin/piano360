import { exercises, lessons, skills } from ".";
import { isNoteInRange } from "../features/piano/keyboardLayout";

const expectUniqueIds = (ids: string[]) => {
  expect(new Set(ids).size).toBe(ids.length);
};

describe("static content integrity", () => {
  it("uses unique stable IDs", () => {
    expectUniqueIds(exercises.map((exercise) => exercise.id));
    expectUniqueIds(lessons.map((lesson) => lesson.id));
    expectUniqueIds(skills.map((skill) => skill.id));
  });

  it("keeps exercise lesson, skill, and prerequisite references valid", () => {
    const lessonIds = new Set(lessons.map((lesson) => lesson.id));
    const skillIds = new Set(skills.map((skill) => skill.id));
    const exerciseIds = new Set(exercises.map((exercise) => exercise.id));

    for (const exercise of exercises) {
      expect(lessonIds.has(exercise.lessonId)).toBe(true);

      for (const skillId of exercise.skillIds) {
        expect(skillIds.has(skillId)).toBe(true);
      }

      for (const prerequisiteId of exercise.prerequisiteExerciseIds) {
        expect(exerciseIds.has(prerequisiteId)).toBe(true);
      }
    }
  });

  it("keeps lesson skill and exercise references valid", () => {
    const skillIds = new Set(skills.map((skill) => skill.id));
    const exerciseIds = new Set(exercises.map((exercise) => exercise.id));

    for (const lesson of lessons) {
      for (const skillId of lesson.skillIds) {
        expect(skillIds.has(skillId)).toBe(true);
      }

      for (const exerciseId of lesson.exerciseIds) {
        expect(exerciseIds.has(exerciseId)).toBe(true);
      }
    }
  });

  it("keeps skill prerequisites valid", () => {
    const skillIds = new Set(skills.map((skill) => skill.id));

    for (const skill of skills) {
      for (const prerequisiteId of skill.prerequisiteSkillIds) {
        expect(skillIds.has(prerequisiteId)).toBe(true);
      }
    }
  });

  it("keeps step target notes inside exercise keyboard ranges", () => {
    for (const exercise of exercises) {
      for (const step of exercise.steps) {
        expect(step.targetNotes.length).toBeGreaterThan(0);

        for (const target of step.targetNotes) {
          expect(isNoteInRange(target, exercise.keyboardRange)).toBe(true);
        }
      }
    }
  });
});
