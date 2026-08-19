import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F3EBDD",
        surface: "#FFFDF8",
        primary: "#315C45",
        secondary: "#5F8068",
        sage: "#A8B9A1",
        ink: "#26312A",
        muted: "#6E746D",
        line: "#D8CDB8",
        warning: "#B58A3A",
        danger: "#A84B45",
      },
      fontFamily: {
        sans: ["var(--font-source-sans)", "Segoe UI", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(38, 49, 42, 0.04), 0 8px 24px rgba(38, 49, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
