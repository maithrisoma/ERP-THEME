import { create } from "zustand";

/**
 * Light / dark theme, available to every profile. The actual colours flip via
 * CSS variables under a `.dark` class on <html> (see globals.css + tailwind
 * config). This store tracks the choice, persists it, and reflects the OS
 * preference on first visit. An inline script in the root layout applies the
 * class before paint to avoid a flash.
 */
export type Theme = "light" | "dark";
const KEY = "diigoo-theme";

function applyClass(t: Theme) {
  if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", t === "dark");
}

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    // Default to light (this is a white-background portal); honor an explicit
    // saved choice. We intentionally do NOT follow the OS dark preference.
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
    return "light";
  } catch {
    return "light";
  }
}

interface ThemeStore {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

export const useTheme = create<ThemeStore>((set, get) => ({
  // Apply on store creation so the class always matches the tracked state.
  theme: (() => {
    const t = initialTheme();
    applyClass(t);
    return t;
  })(),
  setTheme: (t) => {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* ignore */
    }
    applyClass(t);
    set({ theme: t });
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));
