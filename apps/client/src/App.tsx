import { useEffect, useState } from "react";

import { fetchHealth, type ApiHealth } from "./api";

type HealthState =
  | { status: "loading" }
  | { status: "ready"; data: ApiHealth }
  | { status: "error"; message: string };

export const App = () => {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  const loadHealth = () => {
    setHealth({ status: "loading" });

    fetchHealth()
      .then((data) => {
        setHealth({ status: "ready", data });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unable to reach the API";
        setHealth({ status: "error", message });
      });
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <main className="app-shell">
      <section className="intro-panel" aria-labelledby="app-title">
        <p className="eyebrow">TypeScript monorepo</p>
        <h1 id="app-title">piano360</h1>
        <p className="lede">
          React, Vite, Express, shared checks, and a live API health handshake in one workspace.
        </p>
      </section>

      <section className="status-panel" aria-labelledby="health-title">
        <div className="status-header">
          <div>
            <p className="eyebrow">API connection</p>
            <h2 id="health-title">Health status</h2>
          </div>
          <button className="refresh-button" type="button" onClick={loadHealth}>
            Refresh
          </button>
        </div>

        {health.status === "loading" && (
          <div className="health-state" role="status" aria-live="polite">
            <span className="status-dot status-dot-loading" aria-hidden="true" />
            <div>
              <p className="state-title">Checking API</p>
              <div className="skeleton-line skeleton-line-wide" />
              <div className="skeleton-line skeleton-line-short" />
            </div>
          </div>
        )}

        {health.status === "ready" && (
          <div className="health-state" aria-live="polite">
            <span className="status-dot status-dot-ready" aria-hidden="true" />
            <div>
              <p className="state-title">Connected</p>
              <dl className="health-details">
                <div>
                  <dt>Service</dt>
                  <dd>{health.data.service}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{health.data.status}</dd>
                </div>
                <div>
                  <dt>Timestamp</dt>
                  <dd>{new Date(health.data.timestamp).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {health.status === "error" && (
          <div className="health-state health-state-error" role="alert">
            <span className="status-dot status-dot-error" aria-hidden="true" />
            <div>
              <p className="state-title">API unavailable</p>
              <p className="state-copy">{health.message}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
