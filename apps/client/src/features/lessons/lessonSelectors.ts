import { exercises, lessons } from "../../content";
import type { Exercise } from "../../content";

export const getOrderedLessons = () => [...lessons].sort((a, b) => a.order - b.order);

export const getLessonExercises = (exerciseIds: string[]) =>
  exerciseIds
    .map((exerciseId) => exercises.find((exercise) => exercise.id === exerciseId))
    .filter((exercise): exercise is Exercise => Boolean(exercise));
