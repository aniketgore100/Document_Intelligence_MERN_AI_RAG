import { MoonStar, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_KEY = "ui_theme";

const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      className="inline-flex items-center justify-center p-1 text-slate-700 transition hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? <Sun size={17} /> : <MoonStar size={17} />}
    </button>
  );
};

export default ThemeToggle;
