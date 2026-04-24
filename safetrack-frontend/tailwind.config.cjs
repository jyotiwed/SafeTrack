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
          500: "#06b6d4",
          600: "#0590aa",
          700: "#047085",
          800: "#035568",
          900: "#02394a",
        },
        accent: {
          400: "#a855f7",
          500: "#7c3aed",
        },
        light: {
          bg: "#ffffff",
          text: "#000000", 
          header: "#f8f9fa",
          footer: "#f8f9fa",
          footerText: "#6a737d", 
          content: "#ffffff", 
          border: "#e1e8ed",
          code: "#f4f4f4", 
        },
        dark: {
          bg: "#000000", 
          text: "#ffffff",
          header: "#1f1f1f",
          footer: "#1f1f1f", 
          footerText: "#a0a0a0", 
          content: "#242424", 
          border: "#333333", 
          code: "#333333", 
        },
       
        twitterBlue: {
          default: "#1da1f2",
          hover: "#0c84d6",
        },
      },
      
      boxShadow: {
        light: "0 1px 3px rgba(0, 0, 0, 0.1)",
        dark: "0 1px 3px rgba(255, 255, 255, 0.1)",
      },
    },
  },
  plugins: [],
};