import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Today" },
  { to: "/lessons", label: "Lessons" },
  { to: "/practice/free", label: "Free Practice" },
  { to: "/library", label: "Library" },
  { to: "/progress", label: "Progress" }
];

export const Navigation = () => {
  return (
    <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            [
              "rounded-full px-4 py-2 text-sm font-bold transition active:translate-y-0.5",
              isActive ? "bg-ink text-white" : "bg-white/70 text-ink ring-1 ring-ink/10 hover:bg-white"
            ].join(" ")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};
