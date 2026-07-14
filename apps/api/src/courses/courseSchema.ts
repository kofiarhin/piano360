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

const timingWindowsSchema = new Schema(
  {
    perfectMs: { type: Number, required: true, min: 1 },
    goodMs: { type: Number, required: true, min: 1 },
    acceptedMs: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const instructionalTimingTemplateSchema = new Schema(
  {
    templateId: { type: String, required: true },
    eventSpacingBeats: { type: Number, required: true, min: Number.EPSILON },
    noteDurationBeats: { type: Number, required: true, min: Number.EPSILON },
    firstEventBeat: { type: Number, required: true, min: 0 },
    restBetweenGroupsBeats: { type: Number, required: false, min: 0 },
    originalBpm: { type: Number, required: true, min: 1 },
    countInBeats: { type: Number, required: true, min: 0 },
    timingWindows: { type: timingWindowsSchema, required: true }
  },
  { _id: false }
);

const timelineSourceMetadataSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "instructional-template",
        "midi",
        "sheet-music",
        "manual-transcription",
        "recorded-performance"
      ],
      required: true
    },
    reference: { type: String, required: false },
    importedAt: { type: String, required: false },
    importedBy: { type: String, required: false },
    reviewedAt: { type: String, required: false },
    reviewedBy: { type: String, required: false },
    reviewStatus: {
      type: String,
      enum: ["instructional", "unreviewed", "reviewed", "approved"],
      required: true
    }
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
    velocity: { type: Number, min: 0, max: 1, required: false },
    instruction: { type: String, required: false },
    fingerNumbers: { type: [Number], required: false, default: undefined }
  },
  { _id: false }
);

const songTimelineSchema = new Schema(
  {
    schemaVersion: { type: Number, enum: [2], required: true },
    timingSource: { type: String, enum: ["instructional", "verified"], required: true },
    originalBpm: { type: Number, required: true, min: 1 },
    timeSignature: { type: timeSignatureSchema, required: true },
    countInBeats: { type: Number, required: true, min: 0 },
    totalBeats: { type: Number, required: true, min: Number.EPSILON },
    pickupBeats: { type: Number, required: false, min: 0 },
    events: { type: [timelineEventSchema], required: true },
    source: { type: timelineSourceMetadataSchema, required: true },
    instructionalTemplate: { type: instructionalTimingTemplateSchema, required: false }
  },
  { _id: false }
);

const lessonBehaviourSchema = new Schema(
  {
    defaultPracticeMode: { type: String, enum: ["guided", "performance"], required: true },
    pauseOnMiss: { type: Boolean, required: true },
    enableTimingScore: { type: Boolean, required: true },
    timingProfile: { type: String, enum: ["generous", "standard", "strict"], required: true },
    allowPerformanceMode: { type: Boolean, required: true }
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
    contentKind: {
      type: String,
      enum: ["foundational-drill", "rhythm-drill", "song-phrase", "complete-song"],
      required: false
    },
    mode: {
      type: String,
      enum: ["guided-steps", "timeline", "migration-blocked"],
      default: "guided-steps"
    },
    steps: { type: [lessonStepSchema], required: false, default: undefined },
    legacySteps: { type: [lessonStepSchema], required: false, default: undefined },
    timeline: { type: songTimelineSchema, required: false },
    defaultPracticeMode: { type: String, enum: ["guided", "performance"], required: false },
    availablePracticeModes: {
      type: [String],
      enum: ["guided", "performance"],
      required: false,
      default: undefined
    },
    behaviour: { type: lessonBehaviourSchema, required: false },
    migrationStatus: {
      type: String,
      enum: [
        "legacy",
        "generated-instructional",
        "needs-transcription",
        "needs-review",
        "approved"
      ],
      required: false
    },
    unavailableReason: { type: String, required: false },
    requiredTimingSource: { type: String, required: false }
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
