"use client";

import { useState } from "react";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const current = document.documentElement.getAttribute("data-theme");

    if (current === "light" || current === "dark") {
      return current;
    }

    return getSystemTheme();
  });

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("untie-theme", nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className="inline-flex items-center gap-2 rounded-full border border-divider bg-background/70 px-3 py-2 text-xs font-semibold text-muted transition-all hover:-translate-y-0.5 hover:border-accent hover:text-text"
    >
      <span
        aria-hidden="true"
        className="grid size-5 place-items-center rounded-full border border-divider bg-surface text-[10px]"
        suppressHydrationWarning
      >
        {theme === "dark" ? "●" : "○"}
      </span>
      <span suppressHydrationWarning>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
