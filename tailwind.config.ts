import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        "neon-green": "0 0 24px rgba(34, 197, 94, 0.26)",
        "neon-red": "0 0 24px rgba(239, 68, 68, 0.24)",
        "neon-cyan": "0 0 28px rgba(34, 211, 238, 0.22)"
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Consolas", "Liberation Mono", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
