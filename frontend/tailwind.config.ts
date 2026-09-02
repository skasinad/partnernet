import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FBFAF7",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1C1B18",
          soft: "#4A4842",
          faint: "#7C7A72",
        },
        line: "#E7E3DA",
        forest: {
          50: "#EEF4F0",
          100: "#D7E7DE",
          200: "#AECFBD",
          400: "#4F8C6C",
          600: "#1F5C43",
          700: "#184734",
          900: "#0E2A20",
        },
        clay: {
          100: "#F4E7DF",
          400: "#D08C63",
          600: "#B26A41",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,27,24,0.04), 0 8px 24px -12px rgba(28,27,24,0.10)",
        lift: "0 2px 4px rgba(28,27,24,0.05), 0 16px 40px -16px rgba(28,27,24,0.18)",
      },
      maxWidth: {
        content: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
