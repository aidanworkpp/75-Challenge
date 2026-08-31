import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0c0f",
        surface: "#15171c",
        surface2: "#1e2129",
        border: "#2a2e38",
        text: "#eef1f6",
        muted: "#8b93a3",
        accent: "#f97316",
        accentSoft: "#fb923c",
        success: "#22c55e",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
