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

const timeSignatureSchema = new Schema(
  {
    numerator: { type: Number, required: true, min: 1 },
    denominator: { type: Number, enum: [2, 4, 8, 16], required: true }
  },
  { _id: false }
);

const timelineEventSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["note", "rest"], required: true },
    notes: { type: [String], required: false, default: undefined },
    startBeat: { type: Number, required: true, min: 0 },
    durationBeats: { type: Number, required: true, min: Number.EPSILON },
    hand: { type: String, enum: ["left", "right", "both"], required: false },
    velocity: { type: Number, min: 0, max: 1, required: false }
  },
  { _id: false }
);

const songTimelineSchema = new Schema(
  {
    originalBpm: { type: Number, required: true, min: 1 },
    timeSignature: { type: timeSignatureSchema, required: true },
    countInBeats: { type: Number, required: true, min: 0 },
    totalBeats: { type: Number, required: true, min: Number.EPSILON },
    events: { type: [timelineEventSchema], required: true }
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
    mode: { type: String, enum: ["guided-steps", "timeline"], default: "guided-steps" },
    steps: { type: [lessonStepSchema], required: false, default: undefined },
    timeline: { type: songTimelineSchema, required: false }
  },
  { _id: false }
);

const courseSchema = new Schema<Course>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    contentType: {
      type: String,
      enum: ["single-note", "chord", "mixed"],
      required: true,
      index: true
    },
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
