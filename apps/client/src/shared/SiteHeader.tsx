import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-black transition active:translate-y-0.5",
    isActive ? "bg-amber-200 text-stone-950" : "text-stone-200 hover:bg-white/10 hover:text-white"
  ].join(" ");

export const SiteHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="site-header border-b border-white/10 bg-[#12110f]/95 text-stone-100 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <span
            aria-hidden="true"
            className="grid h-10 w-10 grid-cols-5 overflow-hidden rounded-lg border border-amber-200/30 bg-[#f6f2ea] p-1"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                className={[
                  "border-r border-stone-950/20 last:border-r-0",
                  index === 1 || index === 3 ? "bg-stone-950" : "bg-[#f6f2ea]"
                ].join(" ")}
              />
            ))}
          </span>
          <span className="truncate text-lg font-black tracking-tight text-white">Piano360</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Primary">
          <NavLink to="/courses" className={navLinkClass}>
            Courses
          </NavLink>
          <Link
            to="/courses"
            className="rounded-lg bg-amber-200 px-4 py-2 text-sm font-black text-stone-950 transition hover:bg-amber-100 active:translate-y-0.5"
          >
            Start Learning
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-2 text-sm font-black text-stone-100 transition active:translate-y-0.5 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen((current) => !current)}
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-navigation"
          className="grid gap-2 border-t border-white/10 px-4 pb-4 md:hidden"
          aria-label="Mobile primary"
        >
          <NavLink to="/courses" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            Courses
          </NavLink>
          <Link
            to="/courses"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg bg-amber-200 px-4 py-2 text-center text-sm font-black text-stone-950 transition active:translate-y-0.5"
          >
            Start Learning
          </Link>
        </nav>
      )}
    </header>
  );
};
