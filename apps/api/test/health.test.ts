import request from "supertest";

import { createApp, type HealthResponse } from "../src/app";

describe("GET /health", () => {
  it("returns the API health payload", async () => {
    const response = await request(createApp()).get("/health").expect(200);
    const body = response.body as HealthResponse;

    expect(body).toMatchObject({
      service: "piano360-api",
      status: "ok"
    });
    expect(new Date(body.timestamp).toString()).not.toBe("Invalid Date");
  });
});
