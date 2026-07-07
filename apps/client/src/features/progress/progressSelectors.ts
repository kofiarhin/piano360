import { exercises, lessons, skills } from "../../content";
import type { ProgressSnapshot } from "./types";

export const isExerciseCompleted = (progress: ProgressSnapshot, exerciseId: string) =>
  progress.completedExerciseIds.includes(exerciseId);

export const isExerciseUnlocked = (progress: ProgressSnapshot, exerciseId: string) => {
  const exercise = exercises.find((item) => item.id === exerciseId);

  if (!exercise) {
    return false;
  }

  return exercise.prerequisiteExerciseIds.every((prerequisiteId) => isExerciseCompleted(progress, prerequisiteId));
};

export const getCategoryCompletion = (progress: ProgressSnapshot) => {
  const categories = [...new Set(exercises.map((exercise) => exercise.category))];

  return categories.map((category) => {
    const categoryExercises = exercises.filter((exercise) => exercise.category === category);
    const completed = categoryExercises.filter((exercise) => isExerciseCompleted(progress, exercise.id)).length;

    return {
      category,
      completed,
      total: categoryExercises.length
    };
  });
};

export const getLessonCompletion = (progress: ProgressSnapshot) => {
  return lessons.map((lesson) => {
    const completed = lesson.exerciseIds.filter((exerciseId) => isExerciseCompleted(progress, exerciseId)).length;

    return {
      lesson,
      completed,
      total: lesson.exerciseIds.length
    };
  });
};

export const getSkillProgressRows = (progress: ProgressSnapshot) => {
  return skills.map((skill) => ({
    skill,
    progress: progress.skillStats[skill.id]
  }));
};
