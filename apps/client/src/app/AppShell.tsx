import { Outlet } from "react-router-dom";

import { Navigation } from "./Navigation";

export const AppShell = () => {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <a href="/" className="w-fit text-2xl font-black tracking-tight text-ink">
            Piano360
          </a>
          <Navigation />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
};
