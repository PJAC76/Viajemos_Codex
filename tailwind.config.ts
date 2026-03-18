import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        primary: "#2b7cee",
        "primary-dark": "#101822",
        "background-light": "#f6f7f8",
        "background-dark": "#101822",
        surface: "#ffffff",
        "surface-dark": "#0f172a"
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(16, 24, 34, 0.08)"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px"
      }
    }
  },
  plugins: []
} satisfies Config;
