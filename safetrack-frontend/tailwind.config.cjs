// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e0faff",
          100: "#b3f1ff",
          200: "#80e7ff",
          300: "#4ddcff",
          400: "#26d4ff",
          500: "#06b6d4", // main primary
          600: "#0590aa",
          700: "#047085",
          800: "#035568",
          900: "#02394a",
        },
        accent: {
          400: "#a855f7",
          500: "#7c3aed",
        },
      },
    },
  },
  plugins: [],
};
