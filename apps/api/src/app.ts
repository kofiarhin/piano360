import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { config } from "./config";
import { createCourseRouter } from "./courses/courseRoutes";
import { createCourseService, type CourseService } from "./courses/courseService";

export type HealthResponse = {
  service: "piano360-api";
  status: "ok";
  timestamp: string;
};

type AppDependencies = {
  courseService?: CourseService;
};

const errorHandler = (error: unknown, _request: Request, response: Response, next: NextFunction) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: "validation_error",
      message: "Request validation failed.",
      issues: error.issues
    });
    return;
  }

  next(error);
};

export const createApp = (dependencies: AppDependencies = {}): Express => {
  const app = express();

  app.use(
    cors({
      origin: config.clientOrigin
    })
  );
  app.use(express.json());

  const healthHandler = (_request: Request, response: Response) => {
    const payload: HealthResponse = {
      service: "piano360-api",
      status: "ok",
      timestamp: new Date().toISOString()
    };

    response.status(200).json(payload);
  };

  app.get("/health", healthHandler);
  app.get("/api/health", healthHandler);

  app.use("/api/courses", createCourseRouter(dependencies.courseService ?? createCourseService()));

  app.use(errorHandler);

  return app;
};
