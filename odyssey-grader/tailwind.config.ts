import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1b1a17",
        paper: "#f6f4ee",
        line: "#e3ddce",
        brass: "#8a6d3b",
        ok: "#3f7a4f",
        warn: "#b3452c",
      },
    },
  },
  plugins: [],
};
export default config;
