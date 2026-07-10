import type { Model } from "mongoose";

import { CourseModel } from "./courseSchema";
import type { Course, CourseFilters } from "./courseTypes";
import { courseSchema } from "./courseValidation";

export type CourseRepository = {
  findAll(filters?: CourseFilters): Promise<Course[]>;
  findBySlug(slug: string): Promise<Course | undefined>;
  replaceAll(courses: Course[]): Promise<void>;
};

const withoutMongoId = (value: unknown): unknown => {
  if (!value || typeof value !== "object") {
    return value;
  }

  const rest = { ...(value as Record<string, unknown>) };
  delete rest._id;
  return rest;
};

const toCourse = (value: unknown): Course => courseSchema.parse(withoutMongoId(value));

export const createCourseRepository = (model: Model<Course> = CourseModel): CourseRepository => ({
  async findAll(filters = {}) {
    const documents = await model.find(filters).sort({ order: 1 }).lean().exec();
    return documents.map(toCourse);
  },

  async findBySlug(slug) {
    const document = await model.findOne({ slug }).lean().exec();
    return document ? toCourse(document) : undefined;
  },

  async replaceAll(courses) {
    const validatedCourses = courses.map(toCourse);
    await model.deleteMany({}).exec();
    if (validatedCourses.length > 0) {
      await model.insertMany(validatedCourses, { ordered: true });
    }
  }
});
