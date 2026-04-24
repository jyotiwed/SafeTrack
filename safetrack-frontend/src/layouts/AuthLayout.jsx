import { useEffect, useState } from "react";

export default function AuthLayout({ children }) {

  const [theme, setTheme] = useState("dark");

  // Detect theme once
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    let initialTheme = "dark";

    if (savedTheme) {
      initialTheme = savedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      initialTheme = "light";
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className={`relative min-h-screen overflow-hidden ${
      theme === "light"
        ? "bg-light-bg text-light-text"
        : "bg-dark-bg text-dark-text"
    }`}>

      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12)_0,_transparent_55%)] opacity-40 mix-blend-soft-light" />

      {/* Auth Card */}
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-md">

          <div className={`absolute -inset-[1px] rounded-3xl opacity-60 blur-xl ${
            theme === "light"
              ? "bg-gradient-to-r from-light-border via-twitterBlue-default to-light-border"
              : "bg-gradient-to-r from-dark-border via-twitterBlue-default to-dark-border"
          }`} />

          <div className={`relative rounded-3xl border p-6 shadow-2xl ${
            theme === "light"
              ? "border-light-border bg-light-content"
              : "border-dark-border bg-dark-content"
          }`}>
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}