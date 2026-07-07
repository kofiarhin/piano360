import cors from "cors";
import express, { type Express } from "express";

import { config } from "./config";

export type HealthResponse = {
  service: "piano360-api";
  status: "ok";
  timestamp: string;
};

export const createApp = (): Express => {
  const app = express();

  app.use(
    cors({
      origin: config.clientOrigin
    })
  );
  app.use(express.json());

  app.get("/health", (_request, response) => {
    const payload: HealthResponse = {
      service: "piano360-api",
      status: "ok",
      timestamp: new Date().toISOString()
    };

    response.status(200).json(payload);
  });

  return app;
};
