import "dotenv/config";

import { createCourseRepository } from "../courses/courseRepository";
import { seedCourses } from "../courses/seedCourses";
import { connectToDatabase, disconnectFromDatabase } from "../db";

const resetAndSeed = async () => {
  await connectToDatabase();
  await createCourseRepository().replaceAll(seedCourses);
  console.log(`Seeded ${seedCourses.length} courses.`);
};

resetAndSeed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromDatabase();
  });
