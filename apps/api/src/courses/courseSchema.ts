import mongoose, { Schema, type Model } from "mongoose";

import type { Course } from "./courseTypes";

const lessonStepSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["single-note", "chord"], required: true },
    instruction: { type: String, required: true },
    targetNotes: { type: [String], required: true }
  },
  { _id: false }
);

const lessonSchema = new Schema(
  {
    slug: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, required: true },
    isFinal: { type: Boolean, required: true },
    steps: { type: [lessonStepSchema], required: true }
  },
  { _id: false }
);

const courseSchema = new Schema<Course>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    contentType: { type: String, enum: ["single-note", "chord", "mixed"], required: true, index: true },
    hand: { type: String, enum: ["left", "right"], required: true, index: true },
    difficulty: { type: String, enum: ["beginner"], required: true, index: true },
    order: { type: Number, required: true, index: true },
    lessons: { type: [lessonSchema], required: true }
  },
  {
    collection: "courses",
    versionKey: false
  }
);

export type CourseDocument = Course & mongoose.Document;

export const CourseModel: Model<Course> =
  mongoose.models.Course ?? mongoose.model<Course>("Course", courseSchema);
