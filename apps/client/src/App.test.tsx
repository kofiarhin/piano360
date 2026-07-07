import { render, screen, waitFor } from "@testing-library/react";

import { App } from "./App";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the API health status when the backend responds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          service: "piano360-api",
          status: "ok",
          timestamp: "2026-07-07T12:00:00.000Z"
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200
        }
      )
    );

    render(<App />);

    expect(screen.getByText("Checking API")).toBeInTheDocument();

    expect(await screen.findByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("piano360-api")).toBeInTheDocument();
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("renders an error state when the backend request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 503 }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("API unavailable");
    });
  });
});
